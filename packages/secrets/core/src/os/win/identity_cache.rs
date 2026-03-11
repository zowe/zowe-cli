//! Identity context caching for Windows certificates
//!
//! This module provides thread-safe caching of certificate contexts and CNG key handles
//! to support signing operations with non-exportable private keys.

use lazy_static::lazy_static;
use std::collections::HashMap;
use std::sync::RwLock;
use uuid::Uuid;
use windows_sys::Win32::Security::Cryptography::*;

/// Cached identity containing certificate context and CNG key handle
/// Wrapped in a struct that implements Send + Sync for thread safety
#[derive(Clone, Copy)]
pub struct CachedIdentity {
    pub cert_context: *const CERT_CONTEXT,
    pub key_handle: NCRYPT_KEY_HANDLE,
}

// SAFETY: Windows certificate contexts and CNG key handles are thread-safe
// when properly synchronized. The RwLock in IDENTITY_CACHE provides the
// necessary synchronization.
unsafe impl Send for CachedIdentity {}
unsafe impl Sync for CachedIdentity {}

// Thread-safe global cache for identity contexts
lazy_static! {
    static ref IDENTITY_CACHE: RwLock<HashMap<String, CachedIdentity>> =
        RwLock::new(HashMap::new());
}

/// Cache a certificate context and key handle, returning a unique handle ID
pub fn cache_identity(
    cert_context: *const CERT_CONTEXT,
    key_handle: NCRYPT_KEY_HANDLE,
) -> Result<String, String> {
    let handle_id = Uuid::new_v4().to_string();
    
    let mut cache = IDENTITY_CACHE
        .write()
        .map_err(|e| format!("Failed to acquire cache write lock: {}", e))?;
    
    cache.insert(
        handle_id.clone(),
        CachedIdentity {
            cert_context,
            key_handle,
        },
    );
    
    Ok(handle_id)
}

/// Retrieve a cached identity by handle ID
pub fn get_cached_identity(handle_id: &str) -> Result<CachedIdentity, String> {
    let cache = IDENTITY_CACHE
        .read()
        .map_err(|e| format!("Failed to acquire cache read lock: {}", e))?;
    
    cache
        .get(handle_id)
        .copied()
        .ok_or_else(|| format!("Identity handle not found: {}", handle_id))
}

/// Release a cached identity and free associated Windows resources
pub fn release_identity(handle_id: &str) -> Result<bool, String> {
    let mut cache = IDENTITY_CACHE
        .write()
        .map_err(|e| format!("Failed to acquire cache write lock: {}", e))?;
    
    if let Some(identity) = cache.remove(handle_id) {
        unsafe {
            NCryptFreeObject(identity.key_handle);
            CertFreeCertificateContext(identity.cert_context);
        }
        Ok(true)
    } else {
        Ok(false)
    }
}
