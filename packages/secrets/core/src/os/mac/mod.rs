use super::error::KeyringError;

mod error;
mod ffi;
mod keychain;
mod keychain_item;
mod keychain_search;
mod misc;

use error::Error;
use base64::Engine;

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

/// Returns the certificate data for the given service/account from the keychain.
/// Public wrapper that calls get_certificate_or_key with optional=false.
pub fn get_certificate(service: &String, account: &String, optional: bool) -> Result<Option<Vec<u8>>, KeyringError> {
    get_certificate_or_key(service, account, true, optional)
}

/// Returns the private key data for the given service/account from the keychain.
/// Public wrapper that calls get_certificate_or_key with optional=false.
pub fn get_certificate_key(service: &String, account: &String, optional: bool) -> Result<Option<Vec<u8>>, KeyringError> {
    // Quick check: if the account name looks like a profile name (simple alphanumeric),
    // skip keychain search to avoid triggering export errors for non-certificate accounts.
    // Real certificate account names typically have spaces, "@", or other special chars.
    let looks_like_profile_name = account.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_')
        && !account.contains(" ");

    if looks_like_profile_name {
        // Account name looks like a profile name, not a certificate subject - skip keychain search
        return Ok(None);
    }

    get_certificate_or_key(service, account, false, optional)
}

/// Helper function that can retrieve either certificate or private key from identity/certificate items.
/// Searches for kSecClassIdentity or kSecClassCertificate items.
/// Falls back to base64-encoded password lookup if keychain items not found.
/// Uses kSecAttrLabel (the friendly name) to match the account parameter.
fn get_certificate_or_key(service: &String, account: &String, is_certificate: bool, optional: bool) -> Result<Option<Vec<u8>>, KeyringError> {
    use crate::os::mac::ffi::{
        kSecAttrLabel, kSecClass, kSecClassCertificate, kSecClassIdentity,
        kSecMatchLimit, kSecReturnRef, SecCertificateCopyData, SecItemCopyMatching,
        SecIdentityCopyCertificate, SecItemExport, SecCertificateRef,
    };
    use crate::os::mac::misc::{SecCertificate, SecIdentity, SecKey};
    use core_foundation::base::{CFType, TCFType};
    use core_foundation::data::CFData;
    use core_foundation::dictionary::CFDictionary;
    use core_foundation::number::CFNumber;
    use core_foundation::string::CFString;
    use core_foundation_sys::base::{CFGetTypeID, CFTypeRef};
    use std::sync::Mutex;
    use std::collections::HashSet;

    static WARNED_ACCOUNTS: Mutex<Option<HashSet<String>>> = Mutex::new(None);

    let _lock = keyring_mutex()?;

    unsafe {
        // First, try to find an identity (certificate + private key pair)
        // This is the preferred approach as it gives us access to both
        let mut params = vec![];
        params.push((
            CFString::wrap_under_get_rule(kSecClass),
            CFType::wrap_under_get_rule(kSecClassIdentity.cast()),
        ));
        params.push((
            CFString::wrap_under_get_rule(kSecAttrLabel),
            CFString::new(account.as_str()).as_CFType(),
        ));
        params.push((
            CFString::wrap_under_get_rule(kSecReturnRef),
            core_foundation::boolean::CFBoolean::true_value().into_CFType(),
        ));
        params.push((
            CFString::wrap_under_get_rule(kSecMatchLimit),
            CFNumber::from(1).into_CFType(),
        ));

        let params = CFDictionary::from_CFType_pairs(&params);
        let mut ret: CFTypeRef = std::ptr::null();
        let status = SecItemCopyMatching(params.as_concrete_TypeRef(), &mut ret);

        if status == 0 && !ret.is_null() {
            // Identity found!
            let type_id = CFGetTypeID(ret);
            if type_id == SecIdentity::type_id() {
                let identity = SecIdentity::wrap_under_create_rule(ret as *mut _);

                if is_certificate {
                    // Extract certificate from identity
                    let mut cert_ref: SecCertificateRef = std::ptr::null_mut();
                    let cert_status = SecIdentityCopyCertificate(identity.as_concrete_TypeRef(), &mut cert_ref);
                    if cert_status == 0 && !cert_ref.is_null() {
                        let cert = SecCertificate::wrap_under_create_rule(cert_ref);
                        let data_ref = SecCertificateCopyData(cert.as_concrete_TypeRef());
                        if !data_ref.is_null() {
                            let data = CFData::wrap_under_create_rule(data_ref as *mut _);
                            // Certificate data is in DER format - convert to PEM
                            let der_bytes = data.bytes();
                            let base64_cert = base64::engine::general_purpose::STANDARD.encode(der_bytes);
                            let pem_cert = format!(
                                "-----BEGIN CERTIFICATE-----\n{}\n-----END CERTIFICATE-----\n",
                                base64_cert.chars()
                                    .collect::<Vec<_>>()
                                    .chunks(64)
                                    .map(|chunk| chunk.iter().collect::<String>())
                                    .collect::<Vec<_>>()
                                    .join("\n")
                            );
                            return Ok(Some(pem_cert.into_bytes()));
                        }
                    }
                } else {
                    // Extract private key from identity using SecItemExport
                    // This is the same API the CLI tools use and will trigger keychain authorization
                    use crate::os::mac::ffi::SecIdentityCopyPrivateKey;
                    use core_foundation::data::CFData;

                    let mut key_ref: *mut _ = std::ptr::null_mut();
                    let key_status = SecIdentityCopyPrivateKey(identity.as_concrete_TypeRef(), &mut key_ref);

                    if key_status == 0 && !key_ref.is_null() {
                        let key = SecKey::wrap_under_create_rule(key_ref);

                        // Try SecItemExport with OpenSSL format (kSecFormatOpenSSL = 4) which exports as PKCS#1
                        // This is the closest to what the CLI tools use
                        let mut exported_data: CFTypeRef = std::ptr::null();
                        let export_status = SecItemExport(
                            key.as_CFTypeRef(),
                            4, // kSecFormatOpenSSL (PKCS#1 DER for RSA keys)
                            0, // flags - allow prompting
                            std::ptr::null(),
                            &mut exported_data
                        );

                        if export_status == 0 && !exported_data.is_null() {
                            let data = CFData::wrap_under_create_rule(exported_data as *mut _);
                            let mut bytes = Vec::new();
                            bytes.extend_from_slice(data.bytes());
                            return Ok(Some(bytes));
                        } else {
                            // Export failed - key is likely non-exportable or user denied access
                            // Only print error if not optional and once per account to avoid spam
                            if !optional {
                                let mut warned = WARNED_ACCOUNTS.lock().unwrap();
                                if warned.is_none() {
                                    *warned = Some(HashSet::new());
                                }
                                if let Some(ref mut set) = *warned {
                                    if !set.contains(account.as_str()) {
                                        set.insert(account.to_string());
                                        eprintln!("Private key export failed (status: {}) - identity found but key cannot be exported for account '{}'", export_status, account);
                                        eprintln!("The private key was imported as non-exportable (a macOS security feature).");
                                        eprintln!();
                                        eprintln!("Workarounds:");
                                        eprintln!("  1. Provide certKeyFile path instead of certKeyAccount");
                                        eprintln!("  2. Re-import certificate with exportable private key:");
                                        eprintln!("     security import cert.p12 -k KEYCHAIN_NAME -A -x");
                                        eprintln!();
                                        eprintln!("For detailed instructions, see:");
                                        eprintln!("  https://github.com/zowe/zowe-cli/blob/master/docs/Certificate_Keychain_Limitations.md");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // If identity search failed and we're looking for a certificate,
        // try standalone certificate item
        if is_certificate {
            let mut params = vec![];
            params.push((
                CFString::wrap_under_get_rule(kSecClass),
                CFType::wrap_under_get_rule(kSecClassCertificate.cast()),
            ));
            params.push((
                CFString::wrap_under_get_rule(kSecAttrLabel),
                CFString::new(account.as_str()).as_CFType(),
            ));
            params.push((
                CFString::wrap_under_get_rule(kSecReturnRef),
                core_foundation::boolean::CFBoolean::true_value().into_CFType(),
            ));
            params.push((
                CFString::wrap_under_get_rule(kSecMatchLimit),
                CFNumber::from(1).into_CFType(),
            ));

            let params = CFDictionary::from_CFType_pairs(&params);
            let mut ret: CFTypeRef = std::ptr::null();
            let status = SecItemCopyMatching(params.as_concrete_TypeRef(), &mut ret);

            if status == 0 && !ret.is_null() {
                let type_id = CFGetTypeID(ret);
                if type_id == SecCertificate::type_id() {
                    let cert = SecCertificate::wrap_under_create_rule(ret as *mut _);
                    let data_ref = SecCertificateCopyData(cert.as_concrete_TypeRef());
                    if !data_ref.is_null() {
                        let data = CFData::wrap_under_create_rule(data_ref as *mut _);
                        let mut bytes = Vec::new();
                        bytes.extend_from_slice(data.bytes());
                        return Ok(Some(bytes));
                    }
                }
            }
        }
    }

    // If certificate search failed, try password lookup with base64 decoding
    // (for private keys stored as passwords)
    let keychain = SecKeychain::default().unwrap();
    match keychain.find_password(service.as_str(), account.as_str()) {
        Ok((pw, _)) => {
            let pw_str = String::from_utf8(pw.to_owned())?;
            match base64::engine::general_purpose::STANDARD.decode(&pw_str) {
                Ok(bytes) => Ok(Some(bytes)),
                Err(_) => Ok(None), // Not base64-encoded, treat as not found
            }
        }
        Err(_) => Ok(None), // Not found as password either
    }
}
