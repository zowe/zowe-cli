use core_foundation::base::TCFType;

declare_TCFType! {
    Keychain
}

impl Keychain {
    pub unsafe fn default() -> Result<Self> {
        let mut keychain = std::ptr::null_mut();
        cvt(SecKeychainCopyDefault(&mut keychain))?;
        Ok(Self::wrap_under_create_rule(keychain))
    }

    pub unsafe fn set_password(&self, service: &str, account: &str, password: &[u8]) -> Result<()> {
        cvt(SecKeychainAddGenericPassword(
            self.as_CFTypeRef() as *mut _,
            service.len() as u32,
            service.as_ptr().cast(),
            account.len() as u32,
            account.as_ptr().cast(),
            password.len() as u32,
            password.as_ptr().cast(),
            std::ptr::null_mut()
        ))
    }
}

pub enum OpaqueSecKeychainRef {}
pub type SecKeychainRef = *mut OpaqueSecKeychainRef;
extern "C" {
    pub fn SecKeychainCopyDefault(keychain: *mut SecKeychainRef) -> OSStatus;
    pub fn SecKeychainAddGenericPassword(
        keychain: SecKeychainRef,
        serviceNameLength: u32,
        serviceName: *const c_char,
        accountNameLength: u32,
        accountName: *const c_char,
        passwordLength: u32,
        passwordData: *const c_void,
        itemRef: *mut SecKeychainItemRef,
    ) -> OSStatus;
}