use core_foundation_sys::base::{CFTypeID, CFTypeRef, OSStatus};
use core_foundation_sys::dictionary::CFDictionaryRef;
use core_foundation_sys::string::CFStringRef;
use std::ffi::{c_char, c_void};

///
/// Keychain item reference types.
///
/// See lib/SecBase.h here:
/// https://opensource.apple.com/source/libsecurity_keychain/libsecurity_keychain-55050.2/
///
pub enum OpaqueSecKeychainItemRef {}
pub enum OpaqueSecKeychainRef {}
pub type SecKeychainItemRef = *mut OpaqueSecKeychainItemRef;
pub type SecKeychainRef = *mut OpaqueSecKeychainRef;

///
/// Certificate item reference types.  
/// https://developer.apple.com/documentation/security/opaqueseccertificateref
///
pub enum OpaqueSecCertificateRef {}
pub type SecCertificateRef = *mut OpaqueSecCertificateRef;

///
/// Identity reference types.  
/// https://developer.apple.com/documentation/security/opaquesecidentityref
///
pub enum OpaqueSecIdentityRef {}
pub type SecIdentityRef = *mut OpaqueSecIdentityRef;

///
/// Key reference types.  
/// https://developer.apple.com/documentation/security/seckeyref
///
pub enum OpaqueSecKeyRef {}
pub type SecKeyRef = *mut OpaqueSecKeyRef;

///
/// Keychain attribute structure for searching items.  
/// https://developer.apple.com/documentation/security/seckeychainattribute,
/// https://developer.apple.com/documentation/security/seckeychainattributelist
///
#[repr(C)]
#[derive(Copy, Clone)]
pub struct SecKeychainAttribute {
    pub tag: u32,
    pub length: u32,
    pub data: *mut c_void,
}
#[repr(C)]
#[derive(Copy, Clone)]
pub struct SecKeychainAttributeList {
    pub count: u32,
    pub attr: *mut SecKeychainAttribute,
}

/*
 * Defined below are the C functions that the Rust logic
 * uses to interact with macOS's Security.framework.
 *
 * Since we can call C functions directly using Rust FFI, we just need to define
 * the function prototypes ahead of time, and link them to the Security.framework library.
 * Rust will evaluate these symbols during compile time.
 */
#[link(name = "Security", kind = "framework")]
extern "C" {
    // keychain.rs:
    pub fn SecCopyErrorMessageString(status: OSStatus, reserved: *mut c_void) -> CFStringRef;
    pub fn SecKeychainAddGenericPassword(
        keychain: SecKeychainRef,
        service_name_length: u32,
        service_name: *const c_char,
        account_name_length: u32,
        account_name: *const c_char,
        password_length: u32,
        password_data: *const c_void,
        item_ref: *mut SecKeychainItemRef,
    ) -> OSStatus;
    pub fn SecKeychainCopyDefault(keychain: *mut SecKeychainRef) -> OSStatus;
    pub fn SecKeychainFindGenericPassword(
        keychain_or_array: CFTypeRef,
        service_name_len: u32,
        service_name: *const c_char,
        account_name_len: u32,
        account_name: *const c_char,
        password_len: *mut u32,
        password: *mut *mut c_void,
        item_ref: *mut SecKeychainItemRef,
    ) -> OSStatus;
    pub fn SecKeychainGetTypeID() -> CFTypeID;

    // keychain_item.rs:
    pub fn SecKeychainItemDelete(item_ref: SecKeychainItemRef) -> OSStatus;
    pub fn SecKeychainItemGetTypeID() -> CFTypeID;
    pub fn SecKeychainItemModifyAttributesAndData(
        item_ref: SecKeychainItemRef,
        attr_list: *const SecKeychainAttributeList,
        length: u32,
        data: *const c_void,
    ) -> OSStatus;

    // keychain_search.rs:
    pub fn SecItemCopyMatching(query: CFDictionaryRef, result: *mut CFTypeRef) -> OSStatus;
    pub static kSecAttrAccount: CFStringRef;
    pub static kSecAttrLabel: CFStringRef;
    pub static kSecAttrService: CFStringRef;
    pub static kSecClass: CFStringRef;
    pub static kSecClassGenericPassword: CFStringRef;
    pub static kSecMatchLimit: CFStringRef;
    pub static kSecReturnAttributes: CFStringRef;
    pub static kSecReturnData: CFStringRef;
    pub static kSecReturnRef: CFStringRef;

    // misc.rs:
    pub fn SecCertificateGetTypeID() -> CFTypeID;
    pub fn SecIdentityGetTypeID() -> CFTypeID;
    pub fn SecKeyGetTypeID() -> CFTypeID;

    // Certificate and Identity operations:
    pub fn SecIdentityCopyCertificate(
        identity_ref: SecIdentityRef,
        certificate_ref: *mut SecCertificateRef,
    ) -> OSStatus;
    pub fn SecIdentityCopyPrivateKey(
        identity_ref: SecIdentityRef,
        private_key_ref: *mut SecKeyRef,
    ) -> OSStatus;
    pub fn SecCertificateCopyData(certificate: SecCertificateRef) -> CFTypeRef;

    // Additional keychain search constants for identity/certificate search:
    pub static kSecClassIdentity: CFStringRef;
    pub static kSecClassCertificate: CFStringRef;
    pub static kSecMatchSubjectContains: CFStringRef;

    // Key export operations:
    pub fn SecItemExport(
        sec_item_or_array: CFTypeRef,
        output_format: u32,
        flags: u32,
        key_params: *const c_void,
        out_data: *mut CFTypeRef,
    ) -> OSStatus;
    pub fn SecKeyCopyExternalRepresentation(
        key: SecKeyRef,
        error: *mut CFTypeRef,
    ) -> CFTypeRef;

    // Key signing operations (iOS 10.0+, macOS 10.12+):
    pub fn SecKeyCreateSignature(
        key: SecKeyRef,
        algorithm: CFStringRef,
        data_to_sign: CFTypeRef,
        error: *mut CFTypeRef,
    ) -> CFTypeRef;
    pub fn SecKeyCopyAttributes(key: SecKeyRef) -> CFDictionaryRef;
}

// Signature algorithm constants
pub const kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA256: &str = "algid:sign:RSA:digest-PKCS1v15:SHA256";
pub const kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA384: &str = "algid:sign:RSA:digest-PKCS1v15:SHA384";
pub const kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA512: &str = "algid:sign:RSA:digest-PKCS1v15:SHA512";
pub const kSecKeyAlgorithmECDSASignatureDigestX962SHA256: &str = "algid:sign:ECDSA:digest-X962:SHA256";
pub const kSecKeyAlgorithmECDSASignatureDigestX962SHA384: &str = "algid:sign:ECDSA:digest-X962:SHA384";
pub const kSecKeyAlgorithmECDSASignatureDigestX962SHA512: &str = "algid:sign:ECDSA:digest-X962:SHA512";

// Error codes
pub const errSecDataNotAvailable: OSStatus = -25316;

// Export format constants
pub const kSecFormatOpenSSL: u32 = 3;
