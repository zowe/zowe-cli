use crate::os::mac::error::{handle_os_status, Error};
use crate::os::mac::ffi::{
    SecKeychainItemDelete, SecKeychainItemGetTypeID, SecKeychainItemModifyAttributesAndData,
    SecKeychainItemRef,
};
use core_foundation::base::TCFType;
use core_foundation::{declare_TCFType, impl_TCFType};
use core_foundation_sys::base::OSStatus;

/*
 * SecKeychainItem: https://developer.apple.com/documentation/security/seckeychainitem
 * SecKeychainItemRef: https://developer.apple.com/documentation/security/seckeychainitemref
 */
declare_TCFType! {
    SecKeychainItem, SecKeychainItemRef
}
impl_TCFType! {
    SecKeychainItem,
    SecKeychainItemRef,
    SecKeychainItemGetTypeID
}

impl SecKeychainItem {
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
                password.as_ptr().cast(),
            ))?;
        }

        Ok(())
    }
}
