use std::ffi::{c_char, c_void};
use core_foundation_sys::base::{CFTypeID, CFTypeRef, OSStatus};
use core_foundation_sys::string::CFStringRef;

pub enum OpaqueSecKeychainItemRef {}

pub enum OpaqueSecKeychainRef {}

pub type KeychainItemRef = *mut OpaqueSecKeychainItemRef;
pub type KeychainRef = *mut OpaqueSecKeychainRef;

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

///
/// Defined below are the C functions that the Rust logic uses
/// to interact with macOS's Security.framework.
///
/// Since we can call C functions directly from Rust, we just need to define the
/// fn prototypes ahead of time - Rust will link to the proper C symbols during compile time.
///
extern "C" {
    // used in keychain.rs:
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
    // used in keychain_item.rs:
    pub fn SecKeychainItemGetTypeID() -> CFTypeID;
    pub fn SecKeychainItemModifyAttributesAndData(
        item_ref: KeychainItemRef,
        attr_list: *const KeychainAttributeList,
        length: u32,
        data: *const c_void,
    ) -> OSStatus;
    pub fn SecKeychainItemDelete(item_ref: KeychainItemRef) -> OSStatus;
}