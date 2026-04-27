use crate::os::mac::error::{handle_os_status, Error, ERR_SEC_ITEM_NOT_FOUND};
use crate::os::mac::ffi::{
    errSecDataNotAvailable, SecCertificateCopyData, SecCertificateCopySubjectSummary, SecIdentityCopyCertificate,
    SecIdentityCopyPrivateKey, SecItemExport, SecKeychainAddGenericPassword, SecKeychainCopyDefault,
    SecKeychainFindGenericPassword, SecKeychainGetTypeID, SecKeychainRef, kSecFormatOpenSSL,
};
use crate::os::mac::keychain_item::SecKeychainItem;
use crate::os::mac::keychain_search::{KeychainSearch, Reference, SearchResult};
use crate::os::mac::misc::{SecCertificate, SecIdentity, SecKey};
use core_foundation::{base::TCFType, data::CFData, string::CFString, declare_TCFType, impl_TCFType};
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

    ///
    /// find_identity  
    /// Attempts to find an identity (certificate + private key) within the keychain
    /// where the subject contains the given account string.
    ///
    /// Returns:
    /// - A `SecIdentity` object if the identity was found, or
    /// - An `Error` object if an error was encountered
    ///
    pub fn find_identity(&self, subject: &str) -> Result<SecIdentity, Error> {
        let results = KeychainSearch::new()
            .class_identity()
            .subject_contains(subject)
            .with_refs()
            .execute()?;

        for result in results {
            if let SearchResult::Ref(Reference::Identity(identity)) = result {
                // Validate this identity has exact subject match
                if let Ok(cert) = self.get_certificate(&identity) {
                    unsafe {
                        let subject_summary = SecCertificateCopySubjectSummary(cert.as_concrete_TypeRef());
                        if !subject_summary.is_null() {
                            let cf_summary = CFString::wrap_under_create_rule(subject_summary);
                            if cf_summary.to_string() == subject {
                                return Ok(identity);
                            }
                        }
                    }
                }
            }
        }

        Err(Error::from_code(ERR_SEC_ITEM_NOT_FOUND))
    }

    ///
    /// get_certificate_data  
    /// Retrieves the certificate data (DER-encoded) from an identity.
    ///
    /// Returns:
    /// - A `Vec<u8>` containing the certificate bytes in DER format, or
    /// - An `Error` object if an error was encountered
    ///
    pub fn get_certificate_data(&self, identity: &SecIdentity) -> Result<Vec<u8>, Error> {
        let mut cert_ref = std::ptr::null_mut();
        unsafe {
            handle_os_status(SecIdentityCopyCertificate(
                identity.as_concrete_TypeRef(),
                &mut cert_ref,
            ))?;

            let certificate = SecCertificate::wrap_under_create_rule(cert_ref);
            let data_ref = SecCertificateCopyData(certificate.as_concrete_TypeRef());
            
            if data_ref.is_null() {
                return Err(Error::from_code(ERR_SEC_ITEM_NOT_FOUND));
            }

            let cf_data = CFData::wrap_under_create_rule(data_ref as *const _);
            Ok(cf_data.bytes().to_vec())
        }
    }

    ///
    /// get_certificate
    /// Retrieves the certificate object from an identity.
    ///
    /// Returns:
    /// - A `SecCertificate` object, or
    /// - An `Error` object if an error was encountered
    ///
    pub fn get_certificate(&self, identity: &SecIdentity) -> Result<SecCertificate, Error> {
        let mut cert_ref = std::ptr::null_mut();
        unsafe {
            handle_os_status(SecIdentityCopyCertificate(
                identity.as_concrete_TypeRef(),
                &mut cert_ref,
            ))?;

            Ok(SecCertificate::wrap_under_create_rule(cert_ref))
        }
    }

    ///
    /// get_private_key  
    /// Retrieves the private key reference from an identity (non-exportable).
    ///
    /// Returns:
    /// - A `SecKey` object representing the private key, or
    /// - An `Error` object if an error was encountered
    ///
    pub fn get_private_key(&self, identity: &SecIdentity) -> Result<SecKey, Error> {
        let mut key_ref = std::ptr::null_mut();
        unsafe {
            handle_os_status(SecIdentityCopyPrivateKey(
                identity.as_concrete_TypeRef(),
                &mut key_ref,
            ))?;

            Ok(SecKey::wrap_under_create_rule(key_ref))
        }
    }

    ///
    /// export_private_key_data
    /// Attempts to export the private key data in OpenSSL format.
    /// This will fail with errSecDataNotAvailable (-25316) if the key is non-exportable.
    ///
    /// Returns:
    /// - A `Vec<u8>` containing the private key data in OpenSSL format, or
    /// - An `Error` object if an error was encountered (including non-exportable keys)
    ///
    pub fn export_private_key_data(&self, key: &SecKey) -> Result<Vec<u8>, Error> {
        unsafe {
            let mut data_ref: core_foundation_sys::base::CFTypeRef = std::ptr::null_mut();
            let status = SecItemExport(
                key.as_CFTypeRef(),
                kSecFormatOpenSSL,
                0, // flags
                std::ptr::null(),
                &mut data_ref,
            );

            // Check if the key is non-exportable
            if status == errSecDataNotAvailable {
                return Err(Error::from_code(errSecDataNotAvailable));
            }

            handle_os_status(status)?;

            if data_ref.is_null() {
                return Err(Error::from_code(ERR_SEC_ITEM_NOT_FOUND));
            }

            let cf_data = CFData::wrap_under_create_rule(data_ref as *const _);
            Ok(cf_data.bytes().to_vec())
        }
    }
}
