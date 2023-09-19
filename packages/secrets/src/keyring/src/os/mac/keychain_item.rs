use std::ffi::c_void;
use std::fmt::Error;
use core_foundation::{declare_TCFType, impl_TCFType};
use core_foundation::base::TCFType;
use core_foundation_sys::base::{CFTypeID, OSStatus};
use crate::os::mac::keychain;
use crate::os::mac::keychain::cvt;

pub enum OpaqueSecKeychainItemRef {}
pub type KeychainItemRef = *mut OpaqueSecKeychainItemRef;

declare_TCFType! {
    KeychainItem, KeychainItemRef
}

impl_TCFType! {
    KeychainItem,
    KeychainItemRef,
    SecKeychainItemGetTypeID
}

impl KeychainItem {
    #[inline]
    pub fn delete(self) -> OSStatus {
        unsafe { SecKeychainItemDelete(self.as_CFTypeRef() as *mut _) }
    }

    pub fn set_password(&mut self, password: &[u8]) -> Result<(), keychain::Error> {
        unsafe {
            cvt(SecKeychainItemModifyAttributesAndData(
                self.as_CFTypeRef() as *mut _,
                std::ptr::null(),
                password.len() as u32,
                password.as_ptr().cast()
            ))?;
        }

        Ok(())
    }
}

#[repr(C)]
#[derive(Copy, Clone)]
pub struct KeychainAttribute {
    pub tag: u32,
    pub length: u32,
    pub data: *mut c_void
}

#[repr(C)]
#[derive(Copy, Clone)]
pub struct KeychainAttributeList {
    pub count: u32,
    pub attr: *mut KeychainAttribute
}

extern "C" {
    pub fn SecKeychainItemGetTypeID() -> CFTypeID;
    pub fn SecKeychainItemModifyAttributesAndData(
        item_ref: KeychainItemRef,
        attr_list: *const KeychainAttributeList,
        length: u32,
        data: *const c_void
    ) -> OSStatus;
    pub fn SecKeychainItemDelete(item_ref: KeychainItemRef) -> OSStatus;
}