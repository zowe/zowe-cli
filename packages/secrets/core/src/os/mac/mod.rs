use super::error::KeyringError;

mod error;
mod ffi;
mod keychain;
mod keychain_item;
mod keychain_search;
mod misc;

use error::Error;

use crate::os::mac::error::ERR_SEC_ITEM_NOT_FOUND;
use crate::os::mac::keychain_search::{KeychainSearch, SearchResult};
use keychain::SecKeychain;

impl From<Error> for KeyringError {
    fn from(error: Error) -> Self {
        KeyringError::Library {
            name: "macOS Security.framework".to_owned(),
            details: format!("{:?}", error.message()),
        }
    }
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
    password: &mut String,
) -> Result<bool, KeyringError> {
    let keychain = SecKeychain::default().unwrap();
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
