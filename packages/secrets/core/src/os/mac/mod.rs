use super::error::KeyringError;

mod error;
mod ffi;
pub mod https_client;
pub mod https_client_nsurlsession;
mod identity_cache;
mod keychain;
mod keychain_item;
mod keychain_search;
mod misc;

use error::Error;

use crate::os::mac::error::ERR_SEC_ITEM_NOT_FOUND;
use crate::os::mac::keychain_search::{KeychainSearch, SearchResult};
use adler2::Adler32;
use fmutex::Guard;
use keychain::SecKeychain;

impl From<Error> for KeyringError {
    fn from(error: Error) -> Self {
        KeyringError::Library {
            name: "macOS Security.framework".to_owned(),
            details: format!("{:?}", error.message()),
        }
    }
}

impl From<std::io::Error> for KeyringError {
    fn from(error: std::io::Error) -> Self {
        KeyringError::Os(error.to_string())
    }
}

fn keyring_mutex() -> Result<Guard, KeyringError> {
    // MacOS shows keychain prompt after secret has been modified by another process. We use cross-process mutex to
    // block keychain access if there are multiple concurrent keychain operations invoked by the same process. This
    // prevents multiple instances of the same app (e.g. VS Code) from triggering several keychain prompts at once.
    // Use checksum since path length is limited: https://nodejs.org/api/net.html#identifying-paths-for-ipc-connections
    let exe_path = std::env::current_exe().unwrap();
    let mut hasher = Adler32::new();
    hasher.write_slice(exe_path.to_string_lossy().as_bytes());
    let lock_path = std::env::temp_dir()
        .join(format!("zowe_{}_{:08x}.lock", env!("CARGO_PKG_NAME"), hasher.checksum()));
    std::fs::OpenOptions::new().create(true).write(true).open(&lock_path)
        .and_then(|_| fmutex::lock(lock_path))
        .map_err(KeyringError::from)
}

///
/// Attempts to set a password for a given service and account.
///
/// - `service`: The service name for the new credential
/// - `account`: The account name for the new credential
///
/// Returns:
/// - `true` if the credential was stored successfully
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn set_password(
    service: &String,
    account: &String,
    password: &String,
) -> Result<bool, KeyringError> {
    let keychain = SecKeychain::default().unwrap();
    let _lock = keyring_mutex()?;
    match keychain.set_password(service.as_str(), account.as_str(), password.as_bytes()) {
        Ok(()) => Ok(true),
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Returns a password contained in the given service and account, if found.
///
/// - `service`: The service name that matches the credential of interest
/// - `account`: The account name that matches the credential of interest
///
/// Returns:
/// - `Some(password)` if a matching credential was found; `None` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn get_password(service: &String, account: &String) -> Result<Option<String>, KeyringError> {
    let keychain = SecKeychain::default().unwrap();
    let _lock = keyring_mutex()?;
    match keychain.find_password(service.as_str(), account.as_str()) {
        Ok((pw, _)) => Ok(Some(String::from_utf8(pw.to_owned())?)),
        Err(err) if err.code() == ERR_SEC_ITEM_NOT_FOUND => Ok(None),
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Returns the first password (if any) that matches the given service pattern.
///
/// - `service`: The service pattern that matches the credential of interest
///
/// Returns:
/// - `Some(password)` if a matching credential was found; `None` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn find_password(service: &String) -> Result<Option<String>, KeyringError> {
    let cred_attrs: Vec<&str> = service.split("/").collect();
    if cred_attrs.len() < 2 {
        return Err(KeyringError::InvalidArg {
            argument: "service".to_owned(),
            details: "Invalid format for service string; must be in format 'SERVICE/ACCOUNT'"
                .to_owned(),
        });
    }

    let keychain = SecKeychain::default().unwrap();
    let _lock = keyring_mutex()?;
    match keychain.find_password(cred_attrs[0], cred_attrs[1]) {
        Ok((pw, _)) => {
            let pw_str = String::from_utf8(pw.to_owned())?;
            return Ok(Some(pw_str));
        }
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Attempts to delete the password associated with a given service and account.
///
/// - `service`: The service name of the credential to delete
/// - `account`: The account name of the credential to delete
///
/// Returns:
/// - `true` if a matching credential was deleted; `false` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn delete_password(service: &String, account: &String) -> Result<bool, KeyringError> {
    let keychain = SecKeychain::default().unwrap();
    let _lock = keyring_mutex()?;
    match keychain.find_password(service.as_str(), account.as_str()) {
        Ok((_, item)) => {
            item.delete()?;
            return Ok(true);
        }
        Err(err) if err.code() == ERR_SEC_ITEM_NOT_FOUND => Ok(false),
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Builds a vector of all credentials matching the given service pattern.
///
/// - `service`: The service pattern that matches the credential(s) of interest
/// - `credentials`: The vector consisting of (username, password) pairs for each credential that matches
///
/// Returns:
/// - `true` if at least 1 credential was found, `false` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn find_credentials(
    service: &String,
    credentials: &mut Vec<(String, String)>,
) -> Result<bool, KeyringError> {
    let _lock = keyring_mutex()?;
    match KeychainSearch::new()
        .label(service.as_str())
        .with_attrs()
        .with_data()
        .with_refs()
        .execute()
    {
        Ok(search_results) => {
            *credentials = search_results
                .iter()
                .filter_map(|result| match result {
                    SearchResult::Dict(_) => {
                        return match result.parse_dict() {
                            Some(attrs) => Some((
                                attrs.get("acct").unwrap().to_owned(),
                                attrs.get("v_Data").unwrap().to_owned(),
                            )),
                            None => None,
                        };
                    }
                    _ => None,
                })
                .collect();

            Ok(!credentials.is_empty())
        }
        Err(err) if err.code() == ERR_SEC_ITEM_NOT_FOUND => Ok(false),
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Returns the certificate data (DER format) for a given identity
///
pub fn get_certificate(
    _service: &String,
    account: &String,
) -> Result<Option<Vec<u8>>, KeyringError> {
    let keychain = SecKeychain::default().unwrap();
    let _lock = keyring_mutex()?;

    match keychain.find_identity(account.as_str()) {
        Ok(identity) => match keychain.get_certificate_data(&identity) {
            Ok(data) => Ok(Some(data)),
            Err(err) => Err(KeyringError::from(err)),
        },
        Err(err) if err.code() == ERR_SEC_ITEM_NOT_FOUND => Ok(None),
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Returns the private key data (PKCS#1 DER format) for a given identity.
/// This will fail with errSecDataNotAvailable (-25316) if the key is non-exportable.
/// In that case, use create_identity_context + sign_with_identity instead.
///
pub fn get_private_key(
    _service: &String,
    account: &String,
) -> Result<Option<Vec<u8>>, KeyringError> {
    let keychain = SecKeychain::default().unwrap();
    let _lock = keyring_mutex()?;

    match keychain.find_identity(account.as_str()) {
        Ok(identity) => match keychain.get_private_key(&identity) {
            Ok(key) => match keychain.export_private_key_data(&key) {
                Ok(data) => Ok(Some(data)),
                Err(err) => {
                    // If export fails due to non-exportable key, return an informative error
                    Err(KeyringError::Library {
                        name: "Keychain".to_owned(),
                        details: format!("Private key cannot be exported (error: {}). Use create_identity_context and sign_with_identity for non-exportable keys.", err),
                    })
                }
            },
            Err(err) => Err(KeyringError::from(err)),
        },
        Err(err) if err.code() == ERR_SEC_ITEM_NOT_FOUND => Ok(None),
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Creates an identity context handle for use in TLS signing operations.
/// This caches the identity and returns a handle ID that can be used for signing.
///
/// - `service`: The service name (currently unused, reserved for future use)
/// - `account`: The label/account name for the identity in the keychain
///
/// Returns:
/// - `Some(handle_id)` if the identity was found and cached; `None` if not found
/// - A `KeyringError` if there were any issues
///
pub fn create_identity_context(
    _service: &String,
    account: &String,
) -> Result<Option<String>, KeyringError> {
    let keychain = SecKeychain::default().unwrap();
    let _lock = keyring_mutex()?;

    match keychain.find_identity(account.as_str()) {
        Ok(identity) => {
            // Cache the identity and return a handle
            match identity_cache::cache_identity(identity) {
                Ok(handle_id) => Ok(Some(handle_id)),
                Err(err) => Err(KeyringError::Library {
                    name: "Identity cache".to_owned(),
                    details: err,
                }),
            }
        }
        Err(err) if err.code() == ERR_SEC_ITEM_NOT_FOUND => Ok(None),
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Signs data using a cached identity's private key (supports non-exportable keys).
///
/// - `handle_id`: The identity handle ID returned from create_identity_context
/// - `algorithm`: The signing algorithm (e.g., "RSA-SHA256", "ECDSA-SHA256")
/// - `data`: The data to sign (usually a hash)
///
/// Returns:
/// - `Some(signature_bytes)` if signing succeeded
/// - A `KeyringError` if there were any issues
///
pub fn sign_with_identity(
    handle_id: &String,
    algorithm: &String,
    data: &Vec<u8>,
) -> Result<Option<Vec<u8>>, KeyringError> {
    let keychain = SecKeychain::default().unwrap();
    let _lock = keyring_mutex()?;

    // Get the cached identity
    let identity = identity_cache::get_cached_identity(handle_id.as_str()).map_err(|err| {
        KeyringError::Library {
            name: "Identity cache".to_owned(),
            details: err,
        }
    })?;

    // Get the private key
    match keychain.get_private_key(&identity) {
        Ok(key) => {
            // Map algorithm name to macOS constant
            let mac_algorithm = match algorithm.as_str() {
                "RSA-SHA256" => ffi::kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA256,
                "RSA-SHA384" => ffi::kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA384,
                "RSA-SHA512" => ffi::kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA512,
                "ECDSA-SHA256" => ffi::kSecKeyAlgorithmECDSASignatureDigestX962SHA256,
                "ECDSA-SHA384" => ffi::kSecKeyAlgorithmECDSASignatureDigestX962SHA384,
                "ECDSA-SHA512" => ffi::kSecKeyAlgorithmECDSASignatureDigestX962SHA512,
                _ => {
                    return Err(KeyringError::InvalidArg {
                        argument: "algorithm".to_owned(),
                        details: format!("Unsupported signing algorithm: {}", algorithm),
                    });
                }
            };

            // Sign the data
            match keychain.sign_with_private_key(&key, mac_algorithm, data.as_slice()) {
                Ok(signature) => Ok(Some(signature)),
                Err(err) => Err(KeyringError::from(err)),
            }
        }
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Releases a cached identity context.
///
/// - `handle_id`: The identity handle ID to release
///
/// Returns:
/// - `true` if the identity was found and removed; `false` otherwise
/// - A `KeyringError` if there were any issues
///
pub fn release_identity_context(handle_id: &String) -> Result<bool, KeyringError> {
    identity_cache::remove_cached_identity(handle_id.as_str()).map_err(|err| {
        KeyringError::Library {
            name: "Identity cache".to_owned(),
            details: err,
        }
    })
}

///
/// Makes an HTTPS request using macOS native APIs with certificate-based authentication.
/// Supports non-exportable private keys from the system keychain.
///
/// - `hostname`: The target hostname
/// - `port`: The target port (typically 443)
/// - `path`: The request path (e.g., "/api/v1/resource")
/// - `method`: HTTP method (GET, POST, PUT, DELETE, etc.)
/// - `headers`: HashMap of HTTP headers
/// - `body`: Optional request body as bytes
/// - `cert_account`: The identity label/account name in the keychain
/// - `reject_unauthorized`: Whether to validate server certificate chain
/// - `timeout`: Optional timeout in milliseconds
///
/// Returns:
/// - `HttpsResponse` containing status code, headers, and body
/// - A `KeyringError` if there were any issues
///
pub fn native_https_request(
    hostname: &String,
    port: u16,
    path: &String,
    method: &String,
    headers: std::collections::HashMap<String, String>,
    body: Option<Vec<u8>>,
    cert_account: &String,
    reject_unauthorized: bool,
    timeout: Option<u64>,
) -> Result<https_client::HttpsResponse, KeyringError> {
    let request = https_client::HttpsRequest {
        hostname: hostname.clone(),
        port,
        path: path.clone(),
        method: method.clone(),
        headers,
        body,
        cert_account: cert_account.clone(),
        reject_unauthorized,
        timeout,
    };

    // Use NSURLSession implementation which properly supports non-exportable keys
    https_client_nsurlsession::native_https_request_nsurlsession(&request)
}
