//! Windows cryptographic operations using CNG (Cryptography Next Generation)
//!
//! This module provides signing operations with non-exportable private keys.

use crate::os::error::KeyringError;
use super::cert_store::find_certificate_by_subject;
use super::identity_cache;
use std::ffi::c_void;
use windows_sys::Win32::Foundation::*;
use windows_sys::Win32::Security::Cryptography::*;

/// Helper function to encode a string as a null-terminated UTF-16 string
fn encode_utf16(s: &str) -> Vec<u16> {
    let mut chars: Vec<u16> = s.encode_utf16().collect();
    chars.push(0);
    chars
}

/// Get CNG key handle from certificate context
fn get_cng_key_handle(cert_context: *const CERT_CONTEXT) -> Result<NCRYPT_KEY_HANDLE, KeyringError> {
    unsafe {
        let mut key_handle: NCRYPT_KEY_HANDLE = 0;
        let mut key_spec: u32 = 0;
        let mut must_free: BOOL = 0;
        
        let result = CryptAcquireCertificatePrivateKey(
            cert_context,
            CRYPT_ACQUIRE_ONLY_NCRYPT_KEY_FLAG | CRYPT_ACQUIRE_SILENT_FLAG,
            std::ptr::null(),
            &mut key_handle,
            &mut key_spec,
            &mut must_free,
        );
        
        if result == 0 {
            return Err(KeyringError::Os("Failed to acquire private key".to_owned()));
        }
        
        if key_spec != CERT_NCRYPT_KEY_SPEC {
            if must_free != 0 {
                NCryptFreeObject(key_handle);
            }
            return Err(KeyringError::Library {
                name: "Windows CNG".to_owned(),
                details: "Certificate uses legacy CryptoAPI key, not CNG".to_owned(),
            });
        }
        
        Ok(key_handle)
    }
}

pub fn create_identity_context(
    _service: &String,
    account: &String,
) -> Result<Option<String>, KeyringError> {
    match find_certificate_by_subject(account.as_str())? {
        Some(cert_context) => {
            let key_handle = get_cng_key_handle(cert_context)?;
            match identity_cache::cache_identity(cert_context, key_handle) {
                Ok(handle_id) => Ok(Some(handle_id)),
                Err(err) => {
                    unsafe {
                        NCryptFreeObject(key_handle);
                        CertFreeCertificateContext(cert_context);
                    }
                    Err(KeyringError::Library {
                        name: "Identity cache".to_owned(),
                        details: err,
                    })
                }
            }
        }
        None => Ok(None),
    }
}

pub fn sign_with_identity(
    handle_id: &String,
    algorithm: &String,
    data: &Vec<u8>,
) -> Result<Option<Vec<u8>>, KeyringError> {
    let identity = identity_cache::get_cached_identity(handle_id.as_str()).map_err(|err| {
        KeyringError::Library {
            name: "Identity cache".to_owned(),
            details: err,
        }
    })?;
    
    // Prepare algorithm name for RSA padding (must outlive the padding_info usage)
    let algo_name_wide;
    let (padding_info, padding_flag) = match algorithm.as_str() {
        "RSA-SHA256" | "RSA-SHA384" | "RSA-SHA512" => {
            let algo_name = match algorithm.as_str() {
                "RSA-SHA256" => "SHA256",
                "RSA-SHA384" => "SHA384",
                _ => "SHA512",
            };
            algo_name_wide = encode_utf16(algo_name);
            let padding = BCRYPT_PKCS1_PADDING_INFO {
                pszAlgId: algo_name_wide.as_ptr(),
            };
            (&padding as *const _ as *const c_void, BCRYPT_PAD_PKCS1)
        }
        "ECDSA-SHA256" | "ECDSA-SHA384" | "ECDSA-SHA512" => {
            let _ = algo_name_wide; // Suppress unused warning for ECDSA case
            (std::ptr::null(), 0)
        }
        _ => {
            return Err(KeyringError::InvalidArg {
                argument: "algorithm".to_owned(),
                details: format!("Unsupported algorithm: {}", algorithm),
            });
        }
    };
    
    unsafe {
        let mut signature_size: u32 = 0;
        let result = NCryptSignHash(
            identity.key_handle,
            padding_info as *const c_void,
            data.as_ptr(),
            data.len() as u32,
            std::ptr::null_mut(),
            0,
            &mut signature_size,
            padding_flag,
        );
        
        if result != 0 {
            return Err(KeyringError::Os(format!("Failed to get signature size: {}", result)));
        }
        
        let mut signature = vec![0u8; signature_size as usize];
        let mut bytes_copied: u32 = 0;
        
        let result = NCryptSignHash(
            identity.key_handle,
            padding_info as *const c_void,
            data.as_ptr(),
            data.len() as u32,
            signature.as_mut_ptr(),
            signature_size,
            &mut bytes_copied,
            padding_flag,
        );
        
        if result != 0 {
            return Err(KeyringError::Os(format!("Failed to sign data: {}", result)));
        }
        
        signature.truncate(bytes_copied as usize);
        Ok(Some(signature))
    }
}

pub fn release_identity_context(handle_id: &String) -> Result<bool, KeyringError> {
    identity_cache::release_identity(handle_id.as_str()).map_err(|err| KeyringError::Library {
        name: "Identity cache".to_owned(),
        details: err,
    })
}
