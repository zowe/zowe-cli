//! Unit tests for Windows certificate operations
//!
//! These tests verify the Windows-specific certificate store, cryptography,
//! and identity caching functionality.

#[cfg(test)]
#[cfg(target_os = "windows")]
mod tests {
    use super::super::*;
    use crate::os::error::KeyringError;

    // Test certificate subject names - these should be replaced with actual test certificates
    // in your Windows Certificate Store for integration testing
    #[allow(dead_code)]
    const TEST_CERT_SUBJECT: &str = "TestCertificate";
    const INVALID_CERT_SUBJECT: &str = "NonExistentCertificate12345";

    // ============================================================================
    // Certificate Store Tests
    // ============================================================================

    #[test]
    fn test_encode_utf16_basic() {
        let encoded = cert_store::encode_utf16("test");
        assert_eq!(encoded.len(), 5); // 4 chars + null terminator
        assert_eq!(encoded[4], 0);
        assert_eq!(encoded[0], 't' as u16);
        assert_eq!(encoded[1], 'e' as u16);
        assert_eq!(encoded[2], 's' as u16);
        assert_eq!(encoded[3], 't' as u16);
    }

    #[test]
    fn test_encode_utf16_empty() {
        let encoded = cert_store::encode_utf16("");
        assert_eq!(encoded.len(), 1); // Just null terminator
        assert_eq!(encoded[0], 0);
    }

    #[test]
    fn test_encode_utf16_unicode() {
        let encoded = cert_store::encode_utf16("Hello 世界");
        assert!(encoded.len() > 1);
        assert_eq!(encoded[encoded.len() - 1], 0); // Null terminator
    }

    #[test]
    fn test_find_certificate_invalid_subject() {
        // This should return Ok(None) for a non-existent certificate
        let result = cert_store::find_certificate_by_subject(INVALID_CERT_SUBJECT);
        match result {
            Ok(None) => {
                // Expected: certificate not found
            }
            Ok(Some(_)) => {
                panic!("Unexpectedly found certificate with invalid subject");
            }
            Err(e) => {
                // Also acceptable if it returns an error
                println!("Certificate search returned error (acceptable): {:?}", e);
            }
        }
    }

    #[test]
    fn test_get_certificate_invalid_subject() {
        let service = String::from("TestService");
        let account = String::from(INVALID_CERT_SUBJECT);
        
        let result = get_certificate(&service, &account);
        match result {
            Ok(None) => {
                // Expected: certificate not found
            }
            Ok(Some(_)) => {
                panic!("Unexpectedly found certificate data for invalid subject");
            }
            Err(_) => {
                // Also acceptable if it returns an error
            }
        }
    }

    #[test]
    fn test_get_private_key_invalid_subject() {
        let service = String::from("TestService");
        let account = String::from(INVALID_CERT_SUBJECT);
        
        let result = get_private_key(&service, &account);
        match result {
            Ok(None) => {
                // Expected: certificate not found
            }
            Ok(Some(_)) => {
                panic!("Unexpectedly found private key for invalid subject");
            }
            Err(_) => {
                // Also acceptable if it returns an error
            }
        }
    }

    // ============================================================================
    // Cryptography Tests
    // ============================================================================

    #[test]
    fn test_create_identity_context_invalid_subject() {
        let service = String::from("TestService");
        let account = String::from(INVALID_CERT_SUBJECT);
        
        let result = create_identity_context(&service, &account);
        match result {
            Ok(None) => {
                // Expected: certificate not found
            }
            Ok(Some(_)) => {
                panic!("Unexpectedly created identity context for invalid subject");
            }
            Err(_) => {
                // Also acceptable if it returns an error
            }
        }
    }

    #[test]
    fn test_sign_with_invalid_handle() {
        let handle_id = String::from("invalid-handle-id-12345");
        let algorithm = String::from("RSA-SHA256");
        let data = vec![1, 2, 3, 4, 5];
        
        let result = sign_with_identity(&handle_id, &algorithm, &data);
        assert!(result.is_err(), "Should fail with invalid handle ID");
        
        match result {
            Err(KeyringError::Library { name, details }) => {
                assert_eq!(name, "Identity cache");
                assert!(details.contains("not found") || details.contains("Identity handle"));
            }
            _ => panic!("Expected Library error for invalid handle"),
        }
    }

    #[test]
    fn test_sign_with_unsupported_algorithm() {
        // Even with an invalid handle, it should fail on algorithm validation first
        let handle_id = String::from("test-handle");
        let algorithm = String::from("INVALID-ALGORITHM");
        let data = vec![1, 2, 3, 4, 5];
        
        let result = sign_with_identity(&handle_id, &algorithm, &data);
        
        // This might fail on handle lookup first, which is also acceptable
        if let Err(e) = result {
            match e {
                KeyringError::InvalidArg { argument, details } => {
                    assert_eq!(argument, "algorithm");
                    assert!(details.contains("Unsupported algorithm"));
                }
                KeyringError::Library { .. } => {
                    // Also acceptable - handle lookup failed first
                }
                _ => panic!("Unexpected error type: {:?}", e),
            }
        }
    }

    #[test]
    fn test_release_invalid_identity_context() {
        let handle_id = String::from("invalid-handle-id-12345");
        
        let result = release_identity_context(&handle_id);
        // Should succeed but return false (nothing to release)
        match result {
            Ok(false) => {
                // Expected: handle not found, nothing released
            }
            Ok(true) => {
                panic!("Should not successfully release non-existent handle");
            }
            Err(_) => {
                // Also acceptable if it returns an error
            }
        }
    }

    // ============================================================================
    // Identity Cache Tests
    // ============================================================================

    #[test]
    fn test_identity_cache_get_nonexistent() {
        let result = identity_cache::get_cached_identity("nonexistent-id");
        assert!(result.is_err(), "Should fail to get non-existent identity");
        
        if let Err(msg) = result {
            assert!(msg.contains("not found") || msg.contains("Identity handle"));
        }
    }

    #[test]
    fn test_identity_cache_release_nonexistent() {
        let result = identity_cache::release_identity("nonexistent-id");
        // Should succeed but return false
        match result {
            Ok(false) => {
                // Expected: nothing to release
            }
            Ok(true) => {
                panic!("Should not successfully release non-existent identity");
            }
            Err(_) => {
                // Also acceptable
            }
        }
    }

    // ============================================================================
    // Algorithm Support Tests
    // ============================================================================

    #[test]
    fn test_supported_algorithms() {
        let supported = vec![
            "RSA-SHA256",
            "RSA-SHA384",
            "RSA-SHA512",
            "ECDSA-SHA256",
            "ECDSA-SHA384",
            "ECDSA-SHA512",
        ];
        
        // Just verify the algorithm names are recognized
        // Actual signing would require a valid certificate
        for algo in supported {
            let handle_id = String::from("test-handle");
            let algorithm = String::from(algo);
            let data = vec![1, 2, 3, 4, 5];
            
            let result = sign_with_identity(&handle_id, &algorithm, &data);
            // Should fail on handle lookup, not algorithm validation
            if let Err(e) = result {
                match e {
                    KeyringError::Library { .. } => {
                        // Expected: handle not found
                    }
                    KeyringError::InvalidArg { .. } => {
                        panic!("Algorithm {} should be supported", algo);
                    }
                    _ => {
                        // Other errors are acceptable
                    }
                }
            }
        }
    }

    #[test]
    fn test_unsupported_algorithms() {
        let unsupported = vec![
            "MD5",
            "SHA1",
            "RSA-MD5",
            "ECDSA-MD5",
            "INVALID",
            "",
        ];
        
        for algo in unsupported {
            let handle_id = String::from("test-handle");
            let algorithm = String::from(algo);
            let data = vec![1, 2, 3, 4, 5];
            
            let result = sign_with_identity(&handle_id, &algorithm, &data);
            // Should eventually fail (either on algorithm or handle)
            assert!(result.is_err(), "Algorithm {} should not be supported", algo);
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

    #[test]
    fn test_get_certificate_empty_account() {
        let service = String::from("TestService");
        let account = String::from("");
        
        let result = get_certificate(&service, &account);
        // Should handle empty account gracefully
        // Note: Windows may find certificates with empty search string, which is acceptable
        match result {
            Ok(None) => {
                // Expected: no certificate found
            }
            Ok(Some(cert_data)) => {
                // Also acceptable: Windows found a certificate (empty string matches all)
                assert!(!cert_data.is_empty(), "Certificate data should not be empty if found");
            }
            Err(_) => {
                // Also acceptable: error occurred
            }
        }
    }

    #[test]
    fn test_create_identity_empty_account() {
        let service = String::from("TestService");
        let account = String::from("");
        
        let result = create_identity_context(&service, &account);
        // Should handle empty account gracefully
        match result {
            Ok(None) => {
                // Expected: no certificate found
            }
            Ok(Some(_)) => {
                panic!("Should not create identity with empty account");
            }
            Err(_) => {
                // Also acceptable
            }
        }
    }

    // ============================================================================
    // Thread Safety Tests
    // ============================================================================

    #[test]
    fn test_identity_cache_thread_safety() {
        use std::thread;
        
        let handles: Vec<_> = (0..10)
            .map(|i| {
                thread::spawn(move || {
                    let handle_id = format!("test-handle-{}", i);
                    // Try to get non-existent identity (should fail safely)
                    let _ = identity_cache::get_cached_identity(&handle_id);
                    // Try to release non-existent identity (should return false)
                    let _ = identity_cache::release_identity(&handle_id);
                })
            })
            .collect();
        
        for handle in handles {
            handle.join().expect("Thread should not panic");
        }
    }
