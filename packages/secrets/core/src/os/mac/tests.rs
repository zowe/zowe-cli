use super::*;
use crate::os::error::KeyringError;

const INVALID_SERVICE: &str = "invalid-service-format";
const NONEXISTENT_SERVICE: &str = "NonExistentService12345";
const NONEXISTENT_ACCOUNT: &str = "NonExistentAccount12345";

// ============================================================================
// Error Handling Tests
// ============================================================================

#[test]
fn test_error_conversion() {
    let error: KeyringError = error::Error::from_code(ERR_SEC_ITEM_NOT_FOUND).into();
    match error {
        KeyringError::Library { name, details } => {
            assert_eq!(name, "macOS Security.framework");
            assert!(!details.is_empty(), "Error details should not be empty");
        }
        _ => panic!("Expected Library error variant"),
    }
}

#[test]
fn test_find_password_invalid_service_format() {
    let service = INVALID_SERVICE.to_string();
    let result = super::find_password(&service);

    match result {
        Err(KeyringError::InvalidArg { argument, details }) => {
            assert_eq!(argument, "service");
            assert!(details.contains("SERVICE/ACCOUNT"));
        }
        _ => panic!("Expected InvalidArg error for malformed service"),
    }
}

#[test]
fn test_get_password_nonexistent_returns_none() {
    let service = NONEXISTENT_SERVICE.to_string();
    let account = NONEXISTENT_ACCOUNT.to_string();
    let result = super::get_password(&service, &account);

    match result {
        Ok(None) => {}
        Ok(Some(_)) => {
            panic!("Unexpectedly found password for nonexistent credential");
        }
        Err(e) => {
            println!("Keychain lookup returned error (acceptable): {:?}", e);
        }
    }
}

#[test]
fn test_delete_password_nonexistent_is_false_or_error() {
    let service = NONEXISTENT_SERVICE.to_string();
    let account = NONEXISTENT_ACCOUNT.to_string();
    let result = super::delete_password(&service, &account);

    match result {
        Ok(false) => {}
        Ok(true) => {
            panic!("Unexpectedly deleted nonexistent credential");
        }
        Err(e) => {
            println!("Keychain delete returned error (acceptable): {:?}", e);
        }
    }
}

// Made with Bob
