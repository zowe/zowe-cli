use std::fmt::{Debug, Display};
use std::ops::Deref;
use core_foundation::{impl_TCFType, base::TCFType, declare_TCFType};
use crate::os::mac::error::{Error, handle_os_status};
use crate::os::mac::keychain_item::{KeychainItem};
use crate::os::mac::ffi::{KeychainRef, SecKeychainCopyDefault, SecKeychainAddGenericPassword, SecKeychainFindGenericPassword};


declare_TCFType! {
    Keychain, KeychainRef
}

impl_TCFType!(Keychain, KeychainRef, SecKeychainGetTypeID);

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

impl Keychain {
    pub fn default() -> Result<Self, Error> {
        let mut keychain = std::ptr::null_mut();
        unsafe { handle_os_status(SecKeychainCopyDefault(&mut keychain))?; }
        unsafe { Ok(Self::wrap_under_create_rule(keychain)) }
    }

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
            }
        }
    }
    pub fn find_password(&self, service: &str, account: &str) -> Result<(KeychainItemPassword, KeychainItem), Error> {
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
                KeychainItem::wrap_under_create_rule(item)
            ))
        }
    }
}