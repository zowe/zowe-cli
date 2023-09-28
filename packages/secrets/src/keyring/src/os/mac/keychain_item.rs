use crate::os::mac::error::{handle_os_status, Error};
use crate::os::mac::ffi::{
    SecKeychainItemDelete, SecKeychainItemGetTypeID, SecKeychainItemModifyAttributesAndData,
    SecKeychainItemRef,
};
use core_foundation::base::TCFType;
use core_foundation::{declare_TCFType, impl_TCFType};

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
    ///
    /// delete
    /// Attempts to delete this keychain item from the keychain.
    ///
    /// Returns:
    /// - Nothing if the deletion request was successful, or
    /// - An `Error` object if an error was encountered
    ///
    #[inline]
    pub fn delete(self) -> Result<(), Error> {
        unsafe { handle_os_status(SecKeychainItemDelete(self.as_CFTypeRef() as *mut _)) }
    }

    ///
    /// set_password  
    /// Attempts to set the password for this keychain item.
    ///
    /// Returns:
    /// - Nothing if the password was set successfully, or
    /// - An `Error` object if an error was encountered
    ///
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
