use std::ffi::c_void;
use core_foundation::{declare_TCFType, impl_TCFType};
use core_foundation::base::TCFType;
use core_foundation_sys::base::OSStatus;
use crate::os::mac::ffi::{SecKeychainItemDelete, SecKeychainItemModifyAttributesAndData};
use crate::os::mac::error::{Error, handle_os_status};

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

    pub fn set_password(&mut self, password: &[u8]) -> Result<(), Error> {
        unsafe {
            handle_os_status(SecKeychainItemModifyAttributesAndData(
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