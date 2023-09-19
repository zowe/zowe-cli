use std::ffi::{c_char, c_void};
use std::fmt::{Debug, Display, Formatter};
use std::num::NonZeroI32;
use std::ops::Deref;
use core_foundation_sys::base::{CFTypeID, CFTypeRef, OSStatus};
use core_foundation::{impl_TCFType, base::TCFType, declare_TCFType};
use core_foundation::string::CFString;
use core_foundation_sys::string::CFStringRef;
use crate::os::mac::keychain_item::{KeychainItem, KeychainItemRef};

#[derive(Copy, Clone)]
pub struct Error(NonZeroI32);

impl Error {
    #[inline]
    #[must_use]
    pub fn from_code(code: OSStatus) -> Self {
        Self(NonZeroI32::new(code).unwrap_or_else(|| NonZeroI32::new(1).unwrap()))
    }

    pub fn code(self) -> i32 {
        self.0.get() as _
    }

    pub fn message(&self) -> Option<String> {
        unsafe {
            let s = SecCopyErrorMessageString(self.code(), std::ptr::null_mut());
            if s.is_null() {
                None
            } else {
                Some(CFString::wrap_under_create_rule(s).to_string())
            }
        }
    }
}

impl Debug for Error {
    fn fmt(&self, fmt: &mut Formatter<'_>) -> std::fmt::Result {
        let mut builder = fmt.debug_struct("Error");
        builder.field("code", &self.0);
        if let Some(message) = self.message() {
            builder.field("message", &message);
        }
        builder.finish()
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self.message() {
            Some(msg) => write!(f, "{}", msg),
            None => write!(f, "code: {}", self.code())
        }
    }
}

pub enum OpaqueSecKeychainRef {}

pub type KeychainRef = *mut OpaqueSecKeychainRef;

declare_TCFType! {
    Keychain, KeychainRef
}

impl_TCFType!(Keychain, KeychainRef, SecKeychainGetTypeID);

#[inline(always)]
pub fn cvt(err: OSStatus) -> Result<(), Error> {
    match err {
        // errSecSuccess
        0 => Ok(()),
        // TODO: better error handling
        err => Err(Error::from_code(err))
    }
}

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
        unsafe { cvt(SecKeychainCopyDefault(&mut keychain))?; }
        unsafe { Ok(Self::wrap_under_create_rule(keychain)) }
    }

    pub fn set_password(&self, service: &str, account: &str, password: &[u8]) -> Result<(), Error> {
        match self.find_password(service, account) {
            Ok((_, mut item)) => item.set_password(password),
            _ => unsafe { cvt(SecKeychainAddGenericPassword(
                    self.as_CFTypeRef() as *mut _,
                    service.len() as u32,
                    service.as_ptr().cast(),
                    account.len() as u32,
                    account.as_ptr().cast(),
                    password.len() as u32,
                    password.as_ptr().cast(),
                    std::ptr::null_mut(),
                )) }
        }
    }
    pub fn find_password(&self, service: &str, account: &str) -> Result<(KeychainItemPassword, KeychainItem), Error> {
        let keychain_ref = self.as_CFTypeRef();

        let mut len = 0;
        let mut data = std::ptr::null_mut();
        let mut item = std::ptr::null_mut();

        unsafe {
            cvt(SecKeychainFindGenericPassword(
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

extern "C" {
    pub fn SecKeychainCopyDefault(keychain: *mut KeychainRef) -> OSStatus;
    pub fn SecKeychainAddGenericPassword(
        keychain: KeychainRef,
        service_name_length: u32,
        service_name: *const c_char,
        account_name_length: u32,
        account_name: *const c_char,
        password_length: u32,
        password_data: *const c_void,
        item_ref: *mut KeychainItemRef,
    ) -> OSStatus;
    pub fn SecKeychainFindGenericPassword(
        keychain_or_array: CFTypeRef,
        service_name_len: u32,
        service_name: *const c_char,
        account_name_len: u32,
        account_name: *const c_char,
        password_len: *mut u32,
        password: *mut *mut c_void,
        item_ref: *mut KeychainItemRef,
    ) -> OSStatus;
    pub fn SecKeychainGetTypeID() -> CFTypeID;
    pub fn SecCopyErrorMessageString(status: OSStatus, reserved: *mut c_void) -> CFStringRef;
}