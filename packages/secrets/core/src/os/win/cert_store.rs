//! Windows Certificate Store operations
//!
//! This module provides functions to retrieve certificates and private keys
//! from the Windows Certificate Store (User store).

use crate::os::error::KeyringError;
use std::ffi::c_void;
use windows_sys::Win32::Foundation::*;
use windows_sys::Win32::Security::Cryptography::*;

/// Helper function to encode a string as a null-terminated UTF-16 string
fn encode_utf16(s: &str) -> Vec<u16> {
    let mut chars: Vec<u16> = s.encode_utf16().collect();
    chars.push(0);
    chars
}

/// Helper function to convert Windows error to string
fn win32_error_as_string(error: WIN32_ERROR) -> String {
    use windows_sys::Win32::System::Diagnostics::Debug::*;
    use windows_sys::Win32::System::Memory::LocalFree;
    use windows_sys::core::PWSTR;
    
    let mut buffer: PWSTR = std::ptr::null_mut();
    let as_hresult = if error == 0 {
        0
    } else {
        (error & 0x0000_FFFF) | (7 << 16) | 0x8000_0000
    } as _;
    
    let mut str = "No error details available.".to_owned();
    unsafe {
        let size = FormatMessageW(
            FORMAT_MESSAGE_ALLOCATE_BUFFER
                | FORMAT_MESSAGE_FROM_SYSTEM
                | FORMAT_MESSAGE_IGNORE_INSERTS,
            as_hresult as *const c_void,
            as_hresult,
            0,
            &mut buffer as *mut PWSTR as PWSTR,
            0,
            std::ptr::null(),
        );
        
        if !buffer.is_null() {
            str = String::from_utf16(std::slice::from_raw_parts(buffer, size as usize))
                .unwrap_or(str);
            LocalFree(buffer as isize);
        }
    }
    str
}

/// Find a certificate in the Windows Certificate Store by subject name
///
/// # Arguments
/// * `account` - The subject name (CN) to search for
///
/// # Returns
/// * `Ok(Some(*const CERT_CONTEXT))` - Certificate context pointer
/// * `Ok(None)` - Certificate not found
/// * `Err(KeyringError)` - Error accessing certificate store
pub fn find_certificate_by_subject(account: &str) -> Result<Option<*const CERT_CONTEXT>, KeyringError> {
    let store_name = encode_utf16("MY");
    let subject_name = encode_utf16(account);
    
    // Open the User Certificate Store (Personal certificates)
    let store = unsafe {
        CertOpenStore(
            CERT_STORE_PROV_SYSTEM_W,
            0,
            0,
            CERT_SYSTEM_STORE_CURRENT_USER_ID << CERT_SYSTEM_STORE_LOCATION_SHIFT,
            store_name.as_ptr() as *const c_void,
        )
    };
    
    if store.is_null() {
        let error = unsafe { GetLastError() };
        return Err(KeyringError::Os(format!(
            "Failed to open certificate store: {}",
            win32_error_as_string(error)
        )));
    }
    
    // Search for certificate by subject name
    let cert_context = unsafe {
        CertFindCertificateInStore(
            store,
            X509_ASN_ENCODING | PKCS_7_ASN_ENCODING,
            0,
            CERT_FIND_SUBJECT_STR_W,
            subject_name.as_ptr() as *const c_void,
            std::ptr::null(),
        )
    };
    
    // Close the store (certificate context remains valid)
    unsafe {
        CertCloseStore(store, 0);
    }
    
    if cert_context.is_null() {
        let error = unsafe { GetLastError() };
        if error == CRYPT_E_NOT_FOUND as u32 {
            return Ok(None);
        }
        return Err(KeyringError::Os(format!(
            "Failed to find certificate: {}",
            win32_error_as_string(error)
        )));
    }
    
    Ok(Some(cert_context))
}

/// Returns the certificate data (DER format) for a given identity
///
/// # Arguments
/// * `_service` - Service name (reserved for future use)
/// * `account` - The subject name (CN) of the certificate
///
/// # Returns
/// * `Ok(Some(Vec<u8>))` - Certificate data in DER format
/// * `Ok(None)` - Certificate not found
/// * `Err(KeyringError)` - Error accessing certificate
pub fn get_certificate(
    _service: &String,
    account: &String,
) -> Result<Option<Vec<u8>>, KeyringError> {
    match find_certificate_by_subject(account.as_str())? {
        Some(cert_context) => {
            unsafe {
                let cert_data = (*cert_context).pbCertEncoded;
                let cert_len = (*cert_context).cbCertEncoded as usize;
                
                if cert_data.is_null() || cert_len == 0 {
                    CertFreeCertificateContext(cert_context);
                    return Err(KeyringError::Library {
                        name: "Windows Certificate Store".to_owned(),
                        details: "Certificate data is empty".to_owned(),
                    });
                }
                
                // Copy certificate data
                let cert_bytes = std::slice::from_raw_parts(cert_data, cert_len).to_vec();
                
                // Free certificate context
                CertFreeCertificateContext(cert_context);
                
                Ok(Some(cert_bytes))
            }
        }
        None => Ok(None),
    }
}

/// Returns the private key data (PKCS#1 DER format) for a given identity.
/// This will fail if the key is non-exportable.
/// In that case, use create_identity_context + sign_with_identity instead.
///
/// # Arguments
/// * `_service` - Service name (reserved for future use)
/// * `account` - The subject name (CN) of the certificate
///
/// # Returns
/// * `Ok(Some(Vec<u8>))` - Private key data in PKCS#1 DER format
/// * `Ok(None)` - Certificate not found
/// * `Err(KeyringError)` - Error accessing key or key is non-exportable
pub fn get_private_key(
    _service: &String,
    account: &String,
) -> Result<Option<Vec<u8>>, KeyringError> {
    match find_certificate_by_subject(account.as_str())? {
        Some(cert_context) => {
            unsafe {
                // Try to get the private key property
                let mut key_prov_info_size: u32 = 0;
                
                // First call to get size
                let result = CertGetCertificateContextProperty(
                    cert_context,
                    CERT_KEY_PROV_INFO_PROP_ID,
                    std::ptr::null_mut(),
                    &mut key_prov_info_size,
                );
                
                if result == 0 {
                    let error = GetLastError();
                    CertFreeCertificateContext(cert_context);
                    
                    if error == CRYPT_E_NOT_FOUND as u32 {
                        return Err(KeyringError::Library {
                            name: "Windows Certificate Store".to_owned(),
                            details: "Certificate does not have an associated private key".to_owned(),
                        });
                    }
                    
                    return Err(KeyringError::Os(format!(
                        "Failed to get private key info: {}",
                        win32_error_as_string(error)
                    )));
                }
                
                // For non-exportable keys, we cannot export the key data
                // Return an informative error message
                CertFreeCertificateContext(cert_context);
                
                Err(KeyringError::Library {
                    name: "Windows Certificate Store".to_owned(),
                    details: "Private key cannot be exported (likely non-exportable). Use create_identity_context and sign_with_identity for non-exportable keys.".to_owned(),
                })
            }
        }
        None => Ok(None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_utf16() {
        let encoded = encode_utf16("test");
        assert_eq!(encoded.len(), 5); // 4 chars + null terminator
        assert_eq!(encoded[4], 0);
    }
}
