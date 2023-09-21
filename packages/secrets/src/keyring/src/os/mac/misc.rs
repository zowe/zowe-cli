use core_foundation::{declare_TCFType, impl_TCFType};
use crate::os::mac::ffi::{_SecCertificateGetTypeID, SecIdentityGetTypeID, SecKeyGetTypeID};
use core_foundation::base::TCFType;

pub enum OpaqueSecIdentityRef {}

pub type SecIdentityRef = *mut OpaqueSecIdentityRef;

declare_TCFType!(
    Identity,
    SecIdentityRef
);
impl_TCFType!(
    Identity,
    SecIdentityRef,
    SecIdentityGetTypeID
);

pub enum OpaqueSecCertificateRef {}
pub type SecCertificateRef = *mut OpaqueSecCertificateRef;

declare_TCFType!(
    Certificate,
    SecCertificateRef
);
impl_TCFType!(
    Certificate,
    SecCertificateRef,
    _SecCertificateGetTypeID
);

pub enum OpaqueSecKeyRef {}
pub type SecKeyRef = *mut OpaqueSecKeyRef;

declare_TCFType!(
    Key,
    SecKeyRef
);
impl_TCFType!(
    Key,
    SecKeyRef,
    SecKeyGetTypeID
);