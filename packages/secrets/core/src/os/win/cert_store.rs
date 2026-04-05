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

    // Safety: cert_context is non-null and owned by us (CertFindCertificateInStore
    // increments the refcount). schannel's CertContext::from_ptr takes ownership and
    // will call CertFreeCertificateContext on drop.
    let ctx = unsafe { CertContext::from_ptr(cert_context as *mut c_void) };
    Ok(Some(ctx))
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
///   create_identity_context and sign_with_identity for non-exportable keys
///
/// # See Also
/// * `create_identity_context` - Creates a context for non-exportable keys
/// * `sign_with_identity` - Signs data using non-exportable keys
pub fn get_private_key(
    _service: &String,
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
                    // Use create_tls_pipe or sign_with_identity for non-exportable keys.
                    Err(KeyringError::Library {
                        name: "Windows Certificate Store".to_owned(),
                        details: "Private key cannot be exported (likely non-exportable). Use create_identity_context and sign_with_identity for non-exportable keys.".to_owned(),
                    })
                }
            }
        }
        None => Ok(None),
    }
}

