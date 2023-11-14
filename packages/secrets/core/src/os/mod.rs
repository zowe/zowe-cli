pub mod error;

cfg_if::cfg_if! {
    if #[cfg(target_os = "windows")] {
        pub mod win;
        pub use win::{delete_password, find_credentials, find_password, get_password, set_password};
    } else if #[cfg(target_os = "macos")] {
        pub mod mac;
        pub use mac::{delete_password, find_credentials, find_password, get_password, set_password};
    } else if #[cfg(any(target_os = "freebsd", target_os = "linux"))] {
        pub mod unix;
        pub use unix::{delete_password, find_credentials, find_password, get_password, set_password};
    }
}
