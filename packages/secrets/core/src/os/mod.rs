pub mod error;

cfg_if::cfg_if! {
    if #[cfg(target_os = "windows")] {
        pub mod win;
        pub use win::{delete_password, find_credentials, find_password, get_password, set_password, set_password_with_persistence, PERSIST_ENTERPRISE};
    } else if #[cfg(target_os = "macos")] {
        pub mod mac;
        pub use mac::{create_identity_context, delete_password, find_credentials, find_password, get_certificate, get_password, get_private_key, native_https_request, release_identity_context, set_password, sign_with_identity};
    } else if #[cfg(any(target_os = "freebsd", target_os = "linux"))] {
        pub mod unix;
        pub use unix::{delete_password, find_credentials, find_password, get_password, set_password};
    }
}
