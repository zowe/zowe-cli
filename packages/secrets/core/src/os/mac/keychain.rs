use crate::os::mac::error::{handle_os_status, Error};
use crate::os::mac::ffi::{
    SecKeychainAddGenericPassword, SecKeychainCopyDefault, SecKeychainFindGenericPassword,
    SecKeychainGetTypeID, SecKeychainRef,
};
use crate::os::mac::keychain_item::SecKeychainItem;
use core_foundation::{base::TCFType, declare_TCFType, impl_TCFType};
use std::ops::Deref;

/*
 * SecKeychain: https://developer.apple.com/documentation/security/seckeychain
 * SecKeychainRef: https://developer.apple.com/documentation/security/seckeychainref
 */
declare_TCFType! {
    SecKeychain, SecKeychainRef
}
impl_TCFType!(SecKeychain, SecKeychainRef, SecKeychainGetTypeID);

/* Wrapper struct for handling passwords within SecKeychainItem objects. */
pub struct KeychainItemPassword {
    pub data: *const u8,
    pub data_len: usize,
}

impl AsRef<[u8]> for KeychainItemPassword {
    #[inline]
    fn as_ref(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.data, self.data_len) }
    }
}

impl Deref for KeychainItemPassword {
    type Target = [u8];
    #[inline]
    fn deref(&self) -> &Self::Target {
        self.as_ref()
    }
}

impl SecKeychain {
    pub fn default() -> Result<Self, Error> {
        let mut keychain = std::ptr::null_mut();
        unsafe {
            handle_os_status(SecKeychainCopyDefault(&mut keychain))?;
        }
        unsafe { Ok(Self::wrap_under_create_rule(keychain)) }
    }

    ///
    /// set_password  
    /// Attempts to set the password within the keychain for a given service and account.
    ///
    /// Returns:
    /// - Nothing if the password was set successfully, or
    /// - An `Error` object if an error was encountered
    ///
    pub fn set_password(&self, service: &str, account: &str, password: &[u8]) -> Result<(), Error> {
        match self.find_password(service, account) {
            Ok((_, mut item)) => item.set_password(password),
            _ => unsafe {
                handle_os_status(SecKeychainAddGenericPassword(
                    self.as_CFTypeRef() as *mut _,
                    service.len() as u32,
                    service.as_ptr().cast(),
                    account.len() as u32,
                    account.as_ptr().cast(),
                    password.len() as u32,
                    password.as_ptr().cast(),
                    std::ptr::null_mut(),
                ))
            },
        }
    }

    ///
    /// find_password  
    /// Attempts to find a password within the keychain matching a given service and account.
    ///
    /// Returns:
    /// - A pair containing the KeychainItem object with its password data if the password was found, or
    /// - An `Error` object if an error was encountered
    ///
    pub fn find_password(
        &self,
        service: &str,
        account: &str,
    ) -> Result<(KeychainItemPassword, SecKeychainItem), Error> {
        let keychain_ref = self.as_CFTypeRef();

        let mut len = 0;
        let mut data = std::ptr::null_mut();
        let mut item = std::ptr::null_mut();

        unsafe {
            handle_os_status(SecKeychainFindGenericPassword(
                keychain_ref,
                service.len() as u32,
                service.as_ptr().cast(),
                account.len() as u32,
                account.as_ptr().cast(),
                &mut len,
                &mut data,
                &mut item,
            ))?;
            Ok((
                KeychainItemPassword {
                    data: data as *const _,
                    data_len: len as usize,
                },
                SecKeychainItem::wrap_under_create_rule(item),
            ))
        }
    }
}
