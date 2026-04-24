//! Unit tests for Windows certificate operations
//!
//! These tests verify the Windows-specific certificate store and TLS pipe support.

use super::*;
use crate::os::error::KeyringError;

const INVALID_CERT_SUBJECT: &str = "NonExistentCertificate12345";

// ============================================================================
// Certificate Store Tests
// ============================================================================

#[test]
fn test_encode_utf16_basic() {
    let encoded = super::encode_utf16("test");
    assert_eq!(encoded.len(), 5); // 4 chars + null terminator
    assert_eq!(encoded[4], 0);
    assert_eq!(encoded[0], 't' as u16);
    assert_eq!(encoded[1], 'e' as u16);
    assert_eq!(encoded[2], 's' as u16);
    assert_eq!(encoded[3], 't' as u16);
}

#[test]
fn test_encode_utf16_empty() {
    let encoded = super::encode_utf16("");
    assert_eq!(encoded.len(), 1); // Just null terminator
    assert_eq!(encoded[0], 0);
}

#[test]
fn test_encode_utf16_unicode() {
    let encoded = super::encode_utf16("Hello 世界");
    assert!(encoded.len() > 1);
    assert_eq!(encoded[encoded.len() - 1], 0); // Null terminator
}

#[test]
fn test_find_certificate_invalid_subject() {
    let result = super::cert_store::find_certificate_by_subject(INVALID_CERT_SUBJECT);
    match result {
        Ok(None) => {}
        Ok(Some(_)) => {
            panic!("Unexpectedly found certificate with invalid subject");
        }
        Err(e) => {
            println!("Certificate search returned error (acceptable): {:?}", e);
        }
    }
}


// ============================================================================
// Error Handling Tests
// ============================================================================

#[test]
fn test_error_conversion() {
    use windows_sys::Win32::Foundation::ERROR_NOT_FOUND;

    let error: KeyringError = ERROR_NOT_FOUND.into();
    match error {
        KeyringError::Os(msg) => {
            assert!(!msg.is_empty(), "Error message should not be empty");
        }
        _ => panic!("Expected Os error variant"),
    }
}

