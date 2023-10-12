use crate::os::mac::ffi::{
    SecCertificateGetTypeID, SecCertificateRef, SecIdentityGetTypeID, SecIdentityRef,
    SecKeyGetTypeID, SecKeyRef,
};
use core_foundation::base::TCFType;
use core_foundation::{declare_TCFType, impl_TCFType};

// Structure that represents identities within the keychain
// https://developer.apple.com/documentation/security/secidentity
declare_TCFType!(SecIdentity, SecIdentityRef);
impl_TCFType!(SecIdentity, SecIdentityRef, SecIdentityGetTypeID);

// Structure that represents certificates within the keychain
// https://developer.apple.com/documentation/security/seccertificate
declare_TCFType!(SecCertificate, SecCertificateRef);
impl_TCFType!(SecCertificate, SecCertificateRef, SecCertificateGetTypeID);

// Structure that represents cryptographic keys within the keychain
// https://developer.apple.com/documentation/security/seckey
declare_TCFType!(SecKey, SecKeyRef);
impl_TCFType!(SecKey, SecKeyRef, SecKeyGetTypeID);
