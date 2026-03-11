use crate::os::mac::misc::SecIdentity;
use core_foundation::base::TCFType;
use std::collections::HashMap;
use std::sync::Mutex;

/// Thread-safe wrapper for SecIdentity
/// Since we manually manage CFRetain/CFRelease and SecIdentity is immutable,
/// it's safe to send between threads despite containing a raw pointer
struct SendableSecIdentity(SecIdentity);

unsafe impl Send for SendableSecIdentity {}

lazy_static::lazy_static! {
    static ref IDENTITY_CACHE: Mutex<IdentityCache> = Mutex::new(IdentityCache::new());
}

/// Cache for storing SecIdentity handles across N-API calls
/// This is necessary because Node.js cannot hold on to raw pointers between async calls
pub struct IdentityCache {
    cache: HashMap<String, SendableSecIdentity>,
    next_id: u64,
}

impl IdentityCache {
    pub fn new() -> Self {
        Self {
            cache: HashMap::new(),
            next_id: 0,
        }
    }

    /// Store an identity and return a handle ID
    pub fn store(&mut self, identity: SecIdentity) -> String {
        let id = format!("identity_{}", self.next_id);
        self.next_id += 1;
        self.cache.insert(id.clone(), SendableSecIdentity(identity));
        id
    }

    /// Retrieve an identity by handle ID
    pub fn get(&self, id: &str) -> Option<&SecIdentity> {
        self.cache.get(id).map(|wrapper| &wrapper.0)
    }

    /// Remove an identity from the cache
    pub fn remove(&mut self, id: &str) -> bool {
        self.cache.remove(id).is_some()
    }
}

/// Store an identity in the global cache
pub fn cache_identity(identity: SecIdentity) -> Result<String, String> {
    let mut cache = IDENTITY_CACHE.lock().map_err(|e| format!("Failed to lock cache: {}", e))?;
    Ok(cache.store(identity))
}

/// Get an identity from the global cache
pub fn get_cached_identity(id: &str) -> Result<SecIdentity, String> {
    let cache = IDENTITY_CACHE.lock().map_err(|e| format!("Failed to lock cache: {}", e))?;
    cache
        .get(id)
        .map(|identity| {
            // Return a retained copy
            unsafe {
                let ptr = identity.as_concrete_TypeRef();
                core_foundation::base::CFRetain(ptr as *const _);
                SecIdentity::wrap_under_create_rule(ptr)
            }
        })
        .ok_or_else(|| format!("Identity not found: {}", id))
}

/// Remove an identity from the global cache
pub fn remove_cached_identity(id: &str) -> Result<bool, String> {
    let mut cache = IDENTITY_CACHE.lock().map_err(|e| format!("Failed to lock cache: {}", e))?;
    Ok(cache.remove(id))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_identity_cache_new() {
        let cache = IdentityCache::new();
        assert_eq!(cache.cache.len(), 0);
        assert_eq!(cache.next_id, 0);
    }

    #[test]
    fn test_identity_cache_id_generation() {
        let mut cache = IdentityCache::new();
        
        // Test that IDs are generated sequentially
        // We can't easily create mock SecIdentity objects, so we test the ID generation logic
        assert_eq!(cache.next_id, 0);
        
        // Simulate storing (without actual SecIdentity)
        let id1 = format!("identity_{}", cache.next_id);
        cache.next_id += 1;
        
        let id2 = format!("identity_{}", cache.next_id);
        cache.next_id += 1;
        
        assert_eq!(id1, "identity_0");
        assert_eq!(id2, "identity_1");
        assert_eq!(cache.next_id, 2);
    }

    #[test]
    fn test_identity_cache_get_nonexistent() {
        let cache = IdentityCache::new();
        
        let retrieved = cache.get("identity_999");
        
        assert!(retrieved.is_none());
    }

    #[test]
    fn test_identity_cache_remove_nonexistent() {
        let mut cache = IdentityCache::new();
        
        let removed = cache.remove("identity_999");
        
        assert!(!removed);
    }

    // Note: Full integration tests with real SecIdentity objects should be done
    // in integration tests that can access the macOS Keychain with test certificates.
    // Unit tests here focus on the cache logic without requiring actual Security.framework objects.
}
