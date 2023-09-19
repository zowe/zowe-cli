use std::fmt::{Debug, Display, Formatter};
use std::num::NonZeroI32;
use core_foundation::base::TCFType;
use core_foundation::string::CFString;
use core_foundation_sys::base::OSStatus;
use crate::os::mac::ffi::SecCopyErrorMessageString;

#[derive(Copy, Clone)]
pub struct Error(NonZeroI32);

impl Error {
    #[inline]
    #[must_use]
    pub fn from_code(code: OSStatus) -> Self {
        Self(NonZeroI32::new(code).unwrap_or_else(|| NonZeroI32::new(1).unwrap()))
    }

    pub fn code(self) -> i32 {
        self.0.get() as _
    }

    pub fn message(&self) -> Option<String> {
        unsafe {
            let s = SecCopyErrorMessageString(self.code(), std::ptr::null_mut());
            if s.is_null() {
                None
            } else {
                Some(CFString::wrap_under_create_rule(s).to_string())
            }
        }
    }
}

impl Debug for Error {
    fn fmt(&self, fmt: &mut Formatter<'_>) -> std::fmt::Result {
        let mut builder = fmt.debug_struct("Error");
        builder.field("code", &self.0);
        if let Some(message) = self.message() {
            builder.field("message", &message);
        }
        builder.finish()
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self.message() {
            Some(msg) => write!(f, "{}", msg),
            None => write!(f, "code: {}", self.code())
        }
    }
}

#[inline(always)]
pub fn handle_os_status(err: OSStatus) -> Result<(), Error> {
    match err {
        // errSecSuccess
        0 => Ok(()),
        // TODO: better error handling
        err => Err(Error::from_code(err))
    }
}
