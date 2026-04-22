//! Windows Certificate Store operations
//!
//! This module provides functions to retrieve certificates and private keys
//! from the Windows Certificate Store (User store).

use crate::os::error::KeyringError;
use super::{encode_utf16, win32_error_as_string};
use schannel::cert_context::CertContext;
use schannel::RawPointer;
use std::ffi::c_void;
use windows_sys::Win32::Foundation::*;
use windows_sys::Win32::Security::Cryptography::*;

/// Extract the Common Name (CN) from a certificate
///
/// # Arguments
/// * `cert` - The certificate context to extract the CN from
///
/// # Returns
/// * `Ok(String)` - The CN from the certificate subject
/// * `Err(KeyringError)` - Error extracting the CN
fn extract_certificate_cn(cert: &CertContext) -> Result<String, KeyringError> {
    let cert_context = cert.as_ptr() as *const CERT_CONTEXT;
    
    // Get buffer size needed for the CN
    let size = unsafe {
        CertGetNameStringA(
            cert_context,
            CERT_NAME_SIMPLE_DISPLAY_TYPE, // Gets CN
            0,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            0,
        )
    };
    
    if size == 0 {
        return Err(KeyringError::Os("Failed to get certificate subject size".to_owned()));
    }
    
    // Allocate buffer and get actual name
    let mut buffer = vec![0u8; size as usize];
    let actual_size = unsafe {
        CertGetNameStringA(
            cert_context,
            CERT_NAME_SIMPLE_DISPLAY_TYPE,
            0,
            std::ptr::null_mut(),
            buffer.as_mut_ptr() as *mut i8,
            size,
        )
    };
    
    if actual_size == 0 {
        return Err(KeyringError::Os("Failed to get certificate subject".to_owned()));
    }
    
    // Convert to string (remove null terminator)
    Ok(String::from_utf8_lossy(&buffer[..actual_size as usize - 1]).into_owned())
}

/// Find a certificate in the Windows Certificate Store by subject name
///
/// # Arguments
/// * `account` - The subject name (CN) to search for
///
/// # Returns
/// * `Ok(Some(CertContext))` - schannel CertContext (owns the underlying CERT_CONTEXT,
///   will call CertFreeCertificateContext on drop)
/// * `Ok(None)` - Certificate not found
/// * `Err(KeyringError)` - Error accessing certificate store
pub fn find_certificate_by_subject(account: &str) -> Result<Option<CertContext>, KeyringError> {
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
    
    // Search for certificates by subject name (substring match) and validate exact CN
    let mut cert_context = std::ptr::null();
    
    loop {
        cert_context = unsafe {
            CertFindCertificateInStore(
                store,
                X509_ASN_ENCODING | PKCS_7_ASN_ENCODING,
                0,
                CERT_FIND_SUBJECT_STR_W,
                subject_name.as_ptr() as *const c_void,
                cert_context,
            )
        };
        
        if cert_context.is_null() {
            break;
        }
        
        let ctx = unsafe { CertContext::from_ptr(cert_context as *mut c_void) };
        match extract_certificate_cn(&ctx) {
            Ok(cn) if cn == account => {
                unsafe { CertCloseStore(store, 0); }
                return Ok(Some(ctx));
            }
            _ => {
                // Windows automatically frees the previous `cert_context` in the next iteration.
                // We use `forget` to prevent `CertContext`'s Drop impl from doing a double free.
                std::mem::forget(ctx);
            }
        }
    }
    
    // Close the store - no exact match found
    unsafe {
        CertCloseStore(store, 0);
    }
    
    Err(KeyringError::Library {
        name: "Windows Certificate Store".to_owned(),
        details: format!(
            "No certificate found with exact Common Name '{}'. Found certificates with partial matches but none with exact CN match.",
            account
        ),
    })
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
    account: &String,
) -> Result<Option<Vec<u8>>, KeyringError> {
    match find_certificate_by_subject(account.as_str())? {
        Some(cert_context) => {
            // to_der() returns &[u8] directly (no Result)
            let cert_bytes = cert_context.to_der().to_vec();
            Ok(Some(cert_bytes))
        }
        None => Ok(None),
    }
}

/// Returns the private key data (PKCS#1 DER format) for a given identity.
///
/// # Current Implementation Limitation
/// This function currently does NOT check whether a key is actually exportable.
/// Instead, it always returns an error indicating the key cannot be exported.
/// This is intentional behavior for the initial implementation phase.
///
/// # Rationale
/// Windows certificates can have non-exportable private keys that cannot be extracted
/// but can still be used for cryptographic operations via CNG APIs. Rather than
/// attempting to export keys (which may fail or expose security risks), this function
/// directs users to use the native HTTPS client which can work with non-exportable keys.
///
/// # Future Enhancement
/// A proper implementation could use NCryptExportKey to determine if a key is truly
/// exportable: https://learn.microsoft.com/en-us/windows/win32/api/ncrypt/nf-ncrypt-ncryptexportkey
///
/// # Arguments
/// * `_service` - Service name (reserved for future use)
/// * `account` - The subject name (CN) of the certificate
///
/// # Returns
/// * `Ok(Some(Vec<u8>))` - Private key data in PKCS#1 DER format (not currently returned)
/// * `Ok(None)` - Certificate not found
/// * `Err(KeyringError)` - Always returned if certificate is found, directing users to use
///   `create_tls_pipe` for non-exportable keys
pub fn get_private_key(
    account: &String,
) -> Result<Option<Vec<u8>>, KeyringError> {
    match find_certificate_by_subject(account.as_str())? {
        Some(cert_context) => {
            // Check whether the cert has an associated private key via safe schannel API.
            // private_key() returns AcquirePrivateKeyOptions; calling acquire() verifies
            // the key is present and accessible.
            match cert_context.private_key().acquire() {
                Err(_) => Err(KeyringError::Library {
                    name: "Windows Certificate Store".to_owned(),
                    details: "Certificate does not have an associated private key".to_owned(),
                }),
                Ok(_) => {
                    // Private key exists but cannot be exported from Windows CNG.
                    Err(KeyringError::Library {
                        name: "Windows Certificate Store".to_owned(),
                        details: "Private key cannot be exported (likely non-exportable). Use create_tls_pipe for TLS with this certificate.".to_owned(),
                    })
                }
            }
        }
        None => Ok(None),
    }
}

