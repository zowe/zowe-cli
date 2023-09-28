use std::{str::Utf8Error, string::FromUtf16Error, string::FromUtf8Error};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum KeyringError {
    #[cfg(target_os = "macos")]
    #[error("[keyring] Invalid parameter provided for '{argument:?}'. Details:\n\n{details:?}")]
    InvalidArg { argument: String, details: String },

    #[cfg(any(target_os = "macos", target_os = "linux", target_os = "freebsd"))]
    #[error("[keyring] {name:?} library returned an error:\n\n{details:?}")]
    Library { name: String, details: String },

    #[cfg(not(target_os = "macos"))]
    #[error("[keyring] An OS error has occurred:\n\n{0}")]
    Os(String),

    #[error("[keyring] A UTF-8 error has occurred:\n\n{0}")]
    Utf8(String),

    #[error("[keyring] A UTF-16 error has occurred:\n\n{0}")]
    Utf16(String),
}

impl From<FromUtf8Error> for KeyringError {
    fn from(error: FromUtf8Error) -> Self {
        KeyringError::Utf8(format!("{:?}", error))
    }
}

impl From<FromUtf16Error> for KeyringError {
    fn from(error: FromUtf16Error) -> Self {
        KeyringError::Utf16(format!("{:?}", error))
    }
}

impl From<Utf8Error> for KeyringError {
    fn from(error: Utf8Error) -> Self {
        KeyringError::Utf8(format!("{:?}", error))
    }
}
