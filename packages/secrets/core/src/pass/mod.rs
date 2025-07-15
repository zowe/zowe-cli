use pgp::{
    composed::{ArmorOptions, Deserializable, Message, MessageBuilder, SignedPublicKey, SignedSecretKey},
    crypto::sym::SymmetricKeyAlgorithm,
    types::KeyDetails,
};
use rand_core::OsRng;
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;
use std::sync::OnceLock;

use crate::os::error::KeyringError;

/// Cached home directory to avoid repeated environment variable lookups
static HOME_DIR: OnceLock<String> = OnceLock::new();

/// Gets the home directory, cached for performance
fn get_home_dir() -> Result<&'static str, KeyringError> {
    HOME_DIR.get_or_init(|| {
        std::env::var("HOME").unwrap_or_else(|_| "/home/user".to_string())
    });
    HOME_DIR.get().map(|s| s.as_str()).ok_or_else(|| {
        KeyringError::Os("Could not determine home directory".to_string())
    })
}

/// Gets the GPG home directory path
fn get_gpg_home() -> PathBuf {
    match std::env::var("GNUPGHOME") {
        Ok(gpg_home) => PathBuf::from(gpg_home),
        Err(_) => {
            let home = get_home_dir().unwrap_or("/home/user");
            PathBuf::from(home).join(".gnupg")
        }
    }
}

/// Gets the password store directory path
fn get_password_store_dir() -> Result<PathBuf, KeyringError> {
    let home_dir = get_home_dir()?;
    Ok(PathBuf::from(home_dir).join(".password-store"))
}

///
/// Gets the GPG key ID from the password store .gpg-id file.
///
/// Returns:
/// - `Some(gpg_id)` if the .gpg-id file exists and contains a valid ID
/// - `None` if the file doesn't exist or is empty
/// - A `KeyringError` if there were any issues reading the file
///
fn get_gpg_id() -> Result<Option<String>, KeyringError> {
    let password_store_dir = get_password_store_dir()?;
    let gpg_id_file = password_store_dir.join(".gpg-id");
    
    if !gpg_id_file.exists() {
        return Ok(None);
    }
    
    let gpg_id = fs::read_to_string(&gpg_id_file)
        .map_err(|e| KeyringError::Os(format!("Failed to read .gpg-id file: {}", e)))?
        .trim()
        .to_string();
    
    if gpg_id.is_empty() {
        return Ok(None);
    }
    
    Ok(Some(gpg_id))
}

/// Helper function to check if a key ID matches the target
fn key_id_matches(key_id: &str, target_key_id: &str) -> bool {
    let key_id_upper = key_id.to_uppercase();
    let target_upper = target_key_id.to_uppercase();
    key_id_upper.ends_with(&target_upper) || target_upper.ends_with(&key_id_upper)
}

/// Helper function to try parsing a key file with multiple formats
fn try_parse_key_file(key_data: &[u8]) -> Option<SignedSecretKey> {
    // Try armored format first
    if let Ok((secret_key, _)) = SignedSecretKey::from_armor_single(key_data) {
        return Some(secret_key);
    }
    
    // Try binary format
    if let Ok(secret_key) = SignedSecretKey::from_bytes(key_data) {
        return Some(secret_key);
    }
    
    None
}

///
/// Finds a specific GPG public key by key ID.
///
/// Returns:
/// - `Some(SignedPublicKey)` if the key was found
/// - `None` if the key was not found
/// - A `KeyringError` if there were any issues reading or parsing keys
///
fn find_public_key_by_id(target_key_id: &str) -> Result<Option<SignedPublicKey>, KeyringError> {
    let gpg_home = get_gpg_home();
    
    let key_paths = [
        ("pubring.kbx", gpg_home.join("pubring.kbx")),
        ("pubring.db", gpg_home.join("pubring.db")),
        ("public-keys.d/pubring.db", gpg_home.join("public-keys.d").join("pubring.db")),
        ("secring.gpg", gpg_home.join("secring.gpg")),
    ];
    
    for (format_name, path) in &key_paths {
        if !path.exists() {
            continue;
        }
        
        let key_data = fs::read(path)
            .map_err(|e| KeyringError::Os(format!("Failed to read {}: {}", format_name, e)))?;
        
        // Try different parsing methods based on format
        let public_key = if format_name == &"secring.gpg" {
            // For secring, parse as secret key and extract public key
            if let Ok((secret_key, _)) = SignedSecretKey::from_armor_single(Cursor::new(&key_data)) {
                Some(secret_key.signed_public_key())
            } else {
                None
            }
        } else {
            // For pubring formats, parse as public key
            SignedPublicKey::from_armor_single(Cursor::new(&key_data)).ok().map(|(key, _)| key)
        };
        
        if let Some(key) = public_key {
            let key_id = key.key_id().to_string();
            if key_id_matches(&key_id, target_key_id) {
                return Ok(Some(key));
            }
        }
    }
    
    Ok(None)
}

///
/// Gets the default public key from the GPG keyring.
/// If a .gpg-id file exists, it will try to find that specific key first.
///
/// Returns:
/// - A `SignedPublicKey` if a key was found and parsed successfully
/// - A `KeyringError` if there were any issues reading or parsing the key
///
fn get_public_key() -> Result<SignedPublicKey, KeyringError> {
    // Check if there's a specific GPG ID configured
    if let Ok(Some(gpg_id)) = get_gpg_id() {
        if let Ok(Some(public_key)) = find_public_key_by_id(&gpg_id) {
            return Ok(public_key);
        }
        // If the specific key wasn't found, fall back to default behavior
    }
    
    let gpg_home = get_gpg_home();
    
    let key_paths = [
        // ("pubring.kbx", gpg_home.join("pubring.kbx")),
        // ("pubring.db", gpg_home.join("pubring.db")),
        ("public-keys.d/pubring.db", gpg_home.join("public-keys.d").join("pubring.db")),
        // ("secring.gpg", gpg_home.join("secring.gpg")),
    ];
    
    for (format_name, path) in &key_paths {
        panic!("gpg_home: {:?} {:?}", path, path.exists());
        if !path.exists() {
            continue;
        }
        
        let key_data = fs::read(path)
            .map_err(|e| KeyringError::Os(format!("Failed to read {}: {}", format_name, e)))?;
        
        // Try different parsing methods based on format
        let public_key = if format_name == &"secring.gpg" {
            // For secring, parse as secret key and extract public key
            match SignedSecretKey::from_armor_single(Cursor::new(&key_data)) {
                Ok((secret_key, _)) => Ok(secret_key.signed_public_key()),
                Err(e) => Err(KeyringError::Os(format!("Failed to parse secret key: {}", e))),
            }
        } else {
            // For pubring formats, parse as public key
            match SignedPublicKey::from_armor_single(Cursor::new(&key_data)) {
                Ok((key, _)) => Ok(key),
                Err(e) => Err(KeyringError::Os(format!("Failed to parse public key from {}: {}", format_name, e))),
            }
        };
        
        match public_key {
            Ok(key) => return Ok(key),
            Err(_) => continue, // Try next format
        }
    }
    
    Err(KeyringError::Os("No GPG keys found".to_string()))
}

///
/// Finds a specific GPG secret key by key ID.
///
/// Returns:
/// - `Some(SignedSecretKey)` if the key was found
/// - `None` if the key was not found
/// - A `KeyringError` if there were any issues reading or parsing keys
///
fn find_secret_key_by_id(target_key_id: &str) -> Result<Option<SignedSecretKey>, KeyringError> {
    let gpg_home = get_gpg_home();
    
    // Try secring.gpg first (older format)
    let secring_path = gpg_home.join("secring.gpg");
    if secring_path.exists() {
        let secring_data = fs::read(&secring_path)
            .map_err(|e| KeyringError::Os(format!("Failed to read secring: {}", e)))?;
        
        if let Ok((secret_key, _)) = SignedSecretKey::from_armor_single(Cursor::new(&secring_data)) {
            let key_id = secret_key.key_id().to_string();
            if key_id_matches(&key_id, target_key_id) {
                return Ok(Some(secret_key));
            }
        }
    }
    
    // Try private-keys-v1.d directory (GPG 2.1+)
    let private_keys_path = gpg_home.join("private-keys-v1.d");
    if private_keys_path.exists() {
        let entries = fs::read_dir(&private_keys_path)
            .map_err(|e| KeyringError::Os(format!("Failed to read private-keys-v1.d directory: {}", e)))?;
        
        for entry in entries {
            let entry = entry
                .map_err(|e| KeyringError::Os(format!("Failed to read directory entry: {}", e)))?;
            
            let filename = entry.file_name().to_string_lossy().to_string();
            if filename.ends_with(".key") {
                let key_data = fs::read(entry.path())
                    .map_err(|e| KeyringError::Os(format!("Failed to read key file {}: {}", filename, e)))?;
                
                if let Some(secret_key) = try_parse_key_file(&key_data) {
                    let key_id = secret_key.key_id().to_string();
                    if key_id_matches(&key_id, target_key_id) {
                        return Ok(Some(secret_key));
                    }
                }
            }
        }
    }
    
    Ok(None)
}

///
/// Gets the default secret key from the GPG keyring.
/// If a .gpg-id file exists, it will try to find that specific key first.
///
/// Returns:
/// - A `SignedSecretKey` if a key was found and parsed successfully
/// - A `KeyringError` if there were any issues reading or parsing the key
///
fn get_secret_key() -> Result<SignedSecretKey, KeyringError> {
    // Check if there's a specific GPG ID configured
    if let Ok(Some(gpg_id)) = get_gpg_id() {
        if let Ok(Some(secret_key)) = find_secret_key_by_id(&gpg_id) {
            return Ok(secret_key);
        }
        // If the specific key wasn't found, fall back to default behavior
    }
    
    let gpg_home = get_gpg_home();
    
    // Try secring.gpg first (older format)
    let secring_path = gpg_home.join("secring.gpg");
    if secring_path.exists() {
        let secring_data = fs::read(&secring_path)
            .map_err(|e| KeyringError::Os(format!("Failed to read secring: {}", e)))?;
        
        if let Ok((secret_key, _)) = SignedSecretKey::from_armor_single(Cursor::new(&secring_data)) {
            return Ok(secret_key);
        }
    }
    
    // Try private-keys-v1.d directory (GPG 2.1+)
    let private_keys_path = gpg_home.join("private-keys-v1.d");
    if private_keys_path.exists() {
        let entries = fs::read_dir(&private_keys_path)
            .map_err(|e| KeyringError::Os(format!("Failed to read private-keys-v1.d directory: {}", e)))?;
        
        for entry in entries {
            let entry = entry
                .map_err(|e| KeyringError::Os(format!("Failed to read directory entry: {}", e)))?;
            
            let filename = entry.file_name().to_string_lossy().to_string();
            if filename.ends_with(".key") {
                let key_data = fs::read(entry.path())
                    .map_err(|e| KeyringError::Os(format!("Failed to read key file {}: {}", filename, e)))?;
                
                if let Some(secret_key) = try_parse_key_file(&key_data) {
                    return Ok(secret_key);
                }
            }
        }
        
        return Err(KeyringError::Os("No valid secret keys found in private-keys-v1.d directory".to_string()));
    }
    
    Err(KeyringError::Os("No GPG secret keys found".to_string()))
}

///
/// Encrypts data using PGP with a public key.
///
/// Returns:
/// - The encrypted armored string if successful
/// - A `KeyringError` if there were any issues with encryption
///
fn encrypt_with_pgp(data: &[u8], public_key: &SignedPublicKey) -> Result<String, KeyringError> {
    let rng = OsRng;
    let mut builder = MessageBuilder::from_bytes("", data.to_vec()).seipd_v1(rng, SymmetricKeyAlgorithm::AES256);
    builder.encrypt_to_key(rng, public_key).map_err(|e| KeyringError::Os(format!("Failed to encrypt message: {}", e)))?;
    builder.to_armored_string(rng, ArmorOptions::default()).map_err(|e| KeyringError::Os(format!("Failed to armor message: {}", e)))
}

///
/// Decrypts data using PGP.
///
/// Returns:
/// - The decrypted string if successful
/// - A `KeyringError` if there were any issues with decryption
///
fn decrypt_with_pgp(data: &[u8], secret_key: &SignedSecretKey) -> Result<String, KeyringError> {
    let encrypted_message = Message::from_bytes(data).map_err(|e| KeyringError::Os(format!("Failed to parse message: {}", e)))?;
    match encrypted_message.decrypt(&"".into(), secret_key) {
        Ok(mut decrypted) => decrypted.as_data_string().map_err(|e| KeyringError::Os(format!("Failed to extract data: {}", e))),
        Err(e) => Err(KeyringError::Os(format!("Failed to decrypt message: {}", e))),
    }
}

///
/// Removes empty parent directories recursively.
///
/// Returns:
/// - `Ok(())` if successful
/// - A `KeyringError` if there were any issues
///
fn remove_empty_parent_dirs(file_path: &Path) -> Result<(), KeyringError> {
    let Some(parent) = file_path.parent() else {
        return Ok(());
    };
    
    let password_store_dir = get_password_store_dir()?;
    
    // Only remove if it's within the password store directory
    if !parent.starts_with(&password_store_dir) || parent == password_store_dir {
        return Ok(());
    }
    
    // Check if the directory is empty
    let entries = fs::read_dir(parent).map_err(|e| {
        KeyringError::Os(format!("Failed to read directory for cleanup: {}", e))
    })?;
    
    if entries.count() == 0 {
        // Directory is empty, remove it
        fs::remove_dir(parent)
            .map_err(|e| KeyringError::Os(format!("Failed to remove empty directory: {}", e)))?;
        
        // Recursively check and remove parent directories
        remove_empty_parent_dirs(parent)?;
    }
    
    Ok(())
}

///
/// Attempts to set a password for a given service and account.
///
/// - `service`: The service name for the new credential
/// - `account`: The account name for the new credential
/// - `password`: The password to store
///
/// Returns:
/// - `true` if the credential was stored successfully
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn set_password(service: &str, account: &str, password: &str) -> Result<bool, KeyringError> {
    let password_store_dir = get_password_store_dir()?;
    
    // Create the service directory path
    let service_dir = password_store_dir.join(service);
    let password_file = service_dir.join(format!("{}.gpg", account));
    
    // Create directory with proper permissions (0o700)
    fs::create_dir_all(&service_dir)
        .map_err(|e| KeyringError::Os(format!("Failed to create directory: {}", e)))?;
    
    // Set directory permissions to 0o700
    #[cfg(unix)]
    {
        let mut perms = fs::metadata(&service_dir)
            .map_err(|e| KeyringError::Os(format!("Failed to get directory metadata: {}", e)))?
            .permissions();
        perms.set_mode(0o700);
        fs::set_permissions(&service_dir, perms)
            .map_err(|e| KeyringError::Os(format!("Failed to set directory permissions: {}", e)))?;
    }
    
    // Prepare password content (add newline)
    let password_content = format!("{}\n", password);
    
    // Encrypt with PGP
    let public_key = get_public_key()?;
    
    // Encrypt the password content
    let armored = encrypt_with_pgp(password_content.as_bytes(), &public_key)?;
    
    // Write encrypted content to file
    fs::write(&password_file, armored)
        .map_err(|e| KeyringError::Os(format!("Failed to write password file: {}", e)))?;
    
    // Set file permissions to 0o600
    #[cfg(unix)]
    {
        let mut perms = fs::metadata(&password_file)
            .map_err(|e| KeyringError::Os(format!("Failed to get file metadata: {}", e)))?
            .permissions();
        perms.set_mode(0o600);
        fs::set_permissions(&password_file, perms)
            .map_err(|e| KeyringError::Os(format!("Failed to set file permissions: {}", e)))?;
    }
    
    Ok(true)
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
pub fn get_password(service: &str, account: &str) -> Result<Option<String>, KeyringError> {
    let password_store_dir = get_password_store_dir()?;
    
    // Create the password file path
    let password_file = password_store_dir.join(service).join(format!("{}.gpg", account));
    
    // Check if the password file exists
    if !password_file.exists() {
        return Ok(None);
    }
    
    // Read the encrypted file
    let encrypted_data = fs::read(&password_file)
        .map_err(|e| KeyringError::Os(format!("Failed to read password file: {}", e)))?;
    
    // Decrypt with PGP
    let secret_key = get_secret_key()?;
    let decrypted_data = decrypt_with_pgp(&encrypted_data, &secret_key)?;
    
    // Remove trailing newline
    let password = decrypted_data.strip_suffix('\n').unwrap_or(&decrypted_data).to_string();
    
    Ok(Some(password))
}

///
/// Returns the first password (if any) that matches the given service.
/// This is ideal for scenarios where an account is not required.
///
/// - `service`: The service name that matches the credential of interest
///
/// Returns:
/// - `Some(password)` if a matching credential was found; `None` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn find_password(service: &str) -> Result<Option<String>, KeyringError> {
    let password_store_dir = get_password_store_dir()?;
    let service_dir = password_store_dir.join(service);
    
    // Check if the service directory exists
    if !service_dir.exists() {
        return Ok(None);
    }
    
    // Find the first .gpg file in the service directory
    let entries = fs::read_dir(&service_dir)
        .map_err(|e| KeyringError::Os(format!("Failed to read service directory: {}", e)))?;
    
    for entry in entries {
        let entry = entry
            .map_err(|e| KeyringError::Os(format!("Failed to read directory entry: {}", e)))?;
        
        let filename = entry.file_name().to_string_lossy().to_string();
        if filename.ends_with(".gpg") {
            // Extract account name and get the password
            let account = &filename[..filename.len() - 4];
            if let Ok(Some(password)) = get_password(service, account) {
                return Ok(Some(password));
            }
        }
    }
    
    Ok(None)
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
pub fn delete_password(service: &str, account: &str) -> Result<bool, KeyringError> {
    let password_store_dir = get_password_store_dir()?;
    
    // Create the password file path
    let password_file = password_store_dir.join(service).join(format!("{}.gpg", account));
    
    // Check if the password file exists
    if !password_file.exists() {
        return Ok(false);
    }
    
    // Delete the password file
    fs::remove_file(&password_file)
        .map_err(|e| KeyringError::Os(format!("Failed to delete password file: {}", e)))?;
    
    // Remove parent directory if it becomes empty
    remove_empty_parent_dirs(&password_file)?;
    
    Ok(true)
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
pub fn find_credentials(service: &str, credentials: &mut Vec<(String, String)>) -> Result<bool, KeyringError> {
    let password_store_dir = get_password_store_dir()?;
    
    // Create the service directory path
    let service_dir = password_store_dir.join(service);
    
    // Check if the service directory exists
    if !service_dir.exists() {
        return Ok(false);
    }
    
    // Read all files in the service directory
    let entries = fs::read_dir(&service_dir)
        .map_err(|e| KeyringError::Os(format!("Failed to read service directory: {}", e)))?;
    
    let mut found = false;
    
    // Process each file in the directory
    for entry in entries {
        let entry = entry
            .map_err(|e| KeyringError::Os(format!("Failed to read directory entry: {}", e)))?;
        
        let filename = entry.file_name().to_string_lossy().to_string();
        
        // Filter for .gpg files
        if filename.ends_with(".gpg") {
            // Extract account name by removing .gpg extension
            let account = &filename[..filename.len() - 4];
            
            // Get the password for this account
            if let Ok(Some(password)) = get_password(service, account) {
                credentials.push((account.to_string(), password));
                found = true;
            }
        }
    }
    
    Ok(found)
}
