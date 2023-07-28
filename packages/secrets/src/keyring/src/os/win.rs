use super::error::KeyringError;
use std::ffi::c_void;
use std::result::Result;
use windows_sys::{
    core::{PCWSTR, PWSTR},
    Win32::Foundation::*,
    Win32::Security::Credentials::*,
    Win32::System::{
        Diagnostics::Debug::{
            FormatMessageW, FORMAT_MESSAGE_ALLOCATE_BUFFER, FORMAT_MESSAGE_FROM_SYSTEM,
            FORMAT_MESSAGE_IGNORE_INSERTS,
        },
        Memory::LocalFree,
    },
};

impl From<WIN32_ERROR> for KeyringError {
    fn from(error: WIN32_ERROR) -> Self {
        KeyringError::Os(win32_error_as_string(error))
    }
}

///
/// Helper function to convert the last Win32 error into a human-readable error message.
/// 
/// Returns: 
/// A `String` object containing the error message
/// 
fn win32_error_as_string(error: WIN32_ERROR) -> String {
    let buffer: PWSTR = std::ptr::null_mut();

    // https://github.com/microsoft/windows-rs/blob/master/crates/libs/core/src/hresult.rs#L96
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
            buffer,
            0,
            std::ptr::null(),
        );

        if buffer.is_null() {
            return str;
        }

        str = String::from_utf16(std::slice::from_raw_parts(buffer, size as usize)).unwrap_or(str);
        LocalFree(buffer as isize);
    }

    str
}

///
/// Helper function to encode a string as a null-terminated UTF-16 string for use w/ credential APIs.
/// 
/// Returns:
/// - `Some(val)` if the string was successfully converted to UTF-16, or `None` otherwise.
/// 
fn encode_utf16(str: &str) -> Vec<u16> {
    let mut chars: Vec<u16> = str.encode_utf16().collect();
    chars.push(0);
    chars
}

/// 
/// Attempts to set a password for a given service and account.
/// 
/// - `service`: The service name for the new credential
/// - `account`: The account name for the new credential
/// 
/// Returns:
/// - `true` if the credential was stored successfully
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn set_password(
    service: &String,
    account: &String,
    password: &mut String,
) -> Result<bool, KeyringError> {
    // Build WinAPI strings and object parameters from arguments
    let target_bytes = encode_utf16(format!("{}/{}", service, account).as_str());
    let username_bytes = encode_utf16(account.as_str());

    let cred = CREDENTIALW {
        Flags: 0,
        Type: CRED_TYPE_GENERIC,
        TargetName: target_bytes.as_ptr() as PWSTR,
        Comment: std::ptr::null_mut(),
        LastWritten: FILETIME {
            dwLowDateTime: 0,
            dwHighDateTime: 0,
        },
        Persist: CRED_PERSIST_ENTERPRISE,
        CredentialBlobSize: password.len() as u32,
        CredentialBlob: password.as_ptr() as *mut u8,
        AttributeCount: 0,
        Attributes: std::ptr::null_mut(),
        TargetAlias: std::ptr::null_mut(),
        UserName: username_bytes.as_ptr() as PWSTR,
    };

    // Save credential to user's credential set
    let write_result = unsafe { CredWriteW(&cred, 0) };

    if write_result != TRUE {
        let error_code = unsafe { GetLastError() };
        return Err(KeyringError::from(error_code));
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
pub fn get_password(service: &String, account: &String) -> Result<Option<String>, KeyringError> {
    let mut cred: *mut CREDENTIALW = std::ptr::null_mut::<CREDENTIALW>();
    let target_name = encode_utf16(format!("{}/{}", service, account).as_str());

    // Attempt to read credential from user's credential set
    let read_result = unsafe {
        CredReadW(
            target_name.as_ptr() as PCWSTR,
            CRED_TYPE_GENERIC,
            0,
            &mut cred,
        )
    };

    if read_result != TRUE {
        let error_code = unsafe { GetLastError() };
        if cred != std::ptr::null_mut() {
            unsafe {
                CredFree(cred as *const c_void);
            }
        }
        return match error_code {
            ERROR_NOT_FOUND => Ok(None),
            _ => Err(KeyringError::from(error_code)),
        };
    }

    // Build buffer for credential secret and return as UTF-8 string
    unsafe {
        let bytes =
            std::slice::from_raw_parts((*cred).CredentialBlob, (*cred).CredentialBlobSize as usize);

        let result = match String::from_utf8(bytes.to_vec()) {
            Ok(string) => Ok(Some(string)),
            Err(err) => Err(KeyringError::Utf8(
                format!("Failed to convert credential to UTF-8: {}", err).to_owned(),
            )),
        };
        CredFree(cred as *const c_void);
        result
    }
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
pub fn delete_password(service: &String, account: &String) -> Result<bool, KeyringError> {
    let target_name = encode_utf16(format!("{}/{}", service, account).as_str());

    // Attempt to delete credential from user's credential set
    let delete_result =
        unsafe { CredDeleteW(target_name.as_ptr() as PCWSTR, CRED_TYPE_GENERIC, 0) };

    if delete_result != TRUE {
        let error_code = unsafe { GetLastError() };

        return match error_code {
            // If we are trying to delete a credential that doesn't exist,
            // we didn't actually delete the password
            ERROR_NOT_FOUND => Ok(false),
            _ => Err(KeyringError::from(error_code)),
        };
    }

    Ok(true)
}

/// 
/// Returns the first password (if any) that matches the given service pattern.
/// 
/// - `service`: The service pattern that matches the credential of interest
/// 
/// Returns:
/// - `Some(password)` if a matching credential was found; `None` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
/// 
pub fn find_password(service: &String) -> Result<Option<String>, KeyringError> {
    let filter = encode_utf16(format!("{}*", service).as_str());

    let mut count: u32 = 0;
    let mut creds: *mut *mut CREDENTIALW = std::ptr::null_mut::<*mut CREDENTIALW>();

    // Attempt to find matching credential from user's credential set
    let find_result = unsafe {
        CredEnumerateW(
            filter.as_ptr() as PCWSTR,
            0u32,
            &mut count,
            &mut creds as *mut *mut *mut CREDENTIALW,
        )
    };

    if find_result != TRUE {
        let error_code = unsafe { GetLastError() };
        if creds != std::ptr::null_mut() {
            unsafe {
                CredFree(creds as *const c_void);
            }
        }
        return match error_code {
            ERROR_NOT_FOUND => Ok(None),
            _ => Err(KeyringError::from(error_code)),
        };
    }

    // Convert credential data into a valid String object and return.
    unsafe {
        let cred = *creds.offset(0);
        let bytes =
            std::slice::from_raw_parts((*cred).CredentialBlob, (*cred).CredentialBlobSize as usize);

        let result = match String::from_utf8(bytes.to_vec()) {
            Ok(string) => Ok(Some(string)),
            Err(err) => Err(KeyringError::from(err)),
        };
        CredFree(creds as *const c_void);
        result
    }
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
pub fn find_credentials(
    service: &String,
    credentials: &mut Vec<(String, String)>,
) -> Result<bool, KeyringError> {
    let filter_bytes: Vec<u16> = encode_utf16(format!("{}*", service).as_str());
    let filter = filter_bytes.as_ptr() as PCWSTR;

    let mut count: u32 = 0;
    let mut creds: *mut *mut CREDENTIALW = std::ptr::null_mut::<*mut CREDENTIALW>();

    // Attempt to fetch user's credential set
    let find_result = unsafe {
        CredEnumerateW(
            filter,
            0u32,
            &mut count,
            &mut creds as *mut *mut *mut CREDENTIALW,
        )
    };

    if find_result != TRUE {
        let error_code = unsafe { GetLastError() };
        if creds != std::ptr::null_mut() {
            unsafe {
                CredFree(creds as *const c_void);
            }
        }
        return match error_code {
            ERROR_NOT_FOUND => Ok(false),
            _ => Err(KeyringError::from(error_code)),
        };
    }

    // Find and build matching credential list from user's credential set
    for i in 0..count {
        let cred: &CREDENTIALW = unsafe { &**creds.offset(i as isize) };

        if cred.UserName.is_null() || cred.CredentialBlobSize == 0 {
            continue;
        }

        // Build a valid String from the raw *u8 credential data.
        let pw_bytes = unsafe {
            std::slice::from_raw_parts((*cred).CredentialBlob, (*cred).CredentialBlobSize as usize)
        };
        let password_result = match String::from_utf8(pw_bytes.to_vec()) {
            Ok(string) => Ok(string),
            Err(err) => Err(KeyringError::from(err)),
        };
        if password_result.is_err() {
            unsafe {
                CredFree(creds as *const c_void);
            }
            return Err(password_result.unwrap_err());
        }

        // Decode the raw wchar_t* username data as a UTF-16 String
        let username: String;
        unsafe {
            let size = (0..).take_while(|&i| *cred.UserName.offset(i) != 0).count();
            username = String::from_utf16(std::slice::from_raw_parts(cred.UserName, size))?;
        }
        credentials.push((username, password_result.unwrap()));
    }

    unsafe {
        CredFree(creds as *const c_void);
    }

    Ok(true)
}
