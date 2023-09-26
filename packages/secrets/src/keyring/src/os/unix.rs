extern crate glib_sys;
extern crate libsecret;
use glib::translate::{FromGlibPtrContainer, ToGlibPtr};
use glib_sys::g_hash_table_unref;
use libsecret::{
    prelude::CollectionExtManual, traits::ItemExt, SearchFlags, Service, ServiceFlags,
};
use std::collections::HashMap;

use super::error::KeyringError;

impl From<glib::error::Error> for KeyringError {
    fn from(err: glib::error::Error) -> Self {
        KeyringError::Library {
            name: "glib".to_owned(),
            details: format!("{:?}", err.message().to_owned()),
        }
    }
}

///
/// Returns the libsecret schema that corresponds to service and account attributes.
///
fn get_schema() -> libsecret::Schema {
    libsecret::Schema::new(
        "org.freedesktop.Secret.Generic",
        libsecret::SchemaFlags::NONE,
        HashMap::from([
            ("service", libsecret::SchemaAttributeType::String),
            ("account", libsecret::SchemaAttributeType::String),
        ]),
    )
}

///
/// Builds an attribute map with the given service and account names.
///
/// Returns:
/// - A `HashMap` built with the `service` and `account` values provided. Used for attribute functions.
///
fn get_attribute_map<'a>(service: &'a str, account: &'a str) -> HashMap<&'a str, &'a str> {
    HashMap::from([("service", service), ("account", account)])
}

///
/// Attempts to set a password for a given service and account.
///
/// - `service`: The service name for the new credential
/// - `account`: The account name for the new credential
///
/// Returns:
/// - `true` if the credential was stored successfully
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn set_password(
    service: &String,
    account: &String,
    password: &String,
) -> Result<bool, KeyringError> {
    let attributes = get_attribute_map(service.as_str(), account.as_str());

    let collection = libsecret::COLLECTION_DEFAULT;
    match libsecret::password_store_sync(
        Some(&get_schema()),
        attributes,
        Some(collection),
        format!("{}/{}", service, account).as_str(),
        password.as_str(),
        gio::Cancellable::NONE,
    ) {
        Ok(_) => Ok(true),
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Returns a password contained in the given service and account, if found.
///
/// - `service`: The service name that matches the credential of interest
/// - `account`: The account name that matches the credential of interest
///
/// Returns:
/// - `Some(password)` if a matching credential was found; `None` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn get_password(service: &String, account: &String) -> Result<Option<String>, KeyringError> {
    let attributes = get_attribute_map(service.as_str(), account.as_str());

    match libsecret::password_lookup_sync(Some(&get_schema()), attributes, gio::Cancellable::NONE) {
        Ok(pw) => match pw {
            Some(pass) => Ok(Some(pass.to_string())),
            None => Ok(None),
        },
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Returns the first password (if any) that matches the given service pattern.
///
/// - `service`: The service pattern that matches the credential of interest
///
/// Returns:
/// - `Some(password)` if a matching credential was found; `None` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn find_password(service: &String) -> Result<Option<String>, KeyringError> {
    let attributes = if service.contains("/") && service.len() > 1 {
        // In format "service/account"
        let values: Vec<&str> = service.split("/").collect();
        get_attribute_map(values[0], values[1])
    } else {
        HashMap::from([("service", service.as_str())])
    };

    match libsecret::password_lookup_sync(Some(&get_schema()), attributes, gio::Cancellable::NONE) {
        Ok(pw) => match pw {
            Some(pass) => Ok(Some(pass.to_string())),
            None => Ok(None),
        },
        Err(err) => Err(KeyringError::from(err)),
    }
}

///
/// Attempts to delete the password associated with a given service and account.
///
/// - `service`: The service name of the credential to delete
/// - `account`: The account name of the credential to delete
///
/// Returns:
/// - `true` if a matching credential was deleted; `false` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn delete_password(service: &String, account: &String) -> Result<bool, KeyringError> {
    match libsecret::password_clear_sync(
        Some(&get_schema()),
        get_attribute_map(service.as_str(), account.as_str()),
        gio::Cancellable::NONE,
    ) {
        Ok(_) => Ok(true),
        Err(err) => match err.kind() {
            Some(glib::KeyFileError::NotFound) => Ok(false),
            _ => Err(KeyringError::from(err)),
        },
    }
}

///
/// Builds a vector of all credentials matching the given service pattern.
///
/// - `service`: The service pattern that matches the credential(s) of interest
/// - `credentials`: The vector consisting of (username, password) pairs for each credential that matches
///
/// Returns:
/// - `true` if at least 1 credential was found, `false` otherwise
/// - A `KeyringError` if there were any issues interacting with the credential vault
///
pub fn find_credentials(
    service: &String,
    credentials: &mut Vec<(String, String)>,
) -> Result<bool, KeyringError> {
    let secret_service = Service::sync(
        ServiceFlags::OPEN_SESSION | ServiceFlags::LOAD_COLLECTIONS,
        gio::Cancellable::NONE,
    )?;
    let collection = match libsecret::Collection::for_alias_sync(
        Some(&secret_service),
        "default",
        libsecret::CollectionFlags::LOAD_ITEMS,
        gio::Cancellable::NONE,
    )? {
        Some(col) => col,
        None => {
            return Err(KeyringError::Os(
                "Unable to open libsecret collection".to_owned(),
            ))
        }
    };

    match collection.search_sync(
        Some(&get_schema()),
        HashMap::from([("service", service.as_str())]),
        SearchFlags::ALL | SearchFlags::UNLOCK | SearchFlags::LOAD_SECRETS,
        gio::Cancellable::NONE,
    ) {
        Ok(vec) => {
            let valid_creds: Vec<(String, String)> = vec
                .iter()
                .filter_map(|item| match item.secret() {
                    Some(secret) => {
                        let attrs: HashMap<String, String> = unsafe {
                            let attrs =
                                libsecret_sys::secret_item_get_attributes(item.to_glib_none().0);
                            FromGlibPtrContainer::from_glib_full(attrs)
                        };
                        let bytes = secret.get();
                        let pw = String::from_utf8(bytes).unwrap_or("".to_string());

                        let acc = attrs.get("account").unwrap().clone();
                        unsafe {
                            g_hash_table_unref(attrs.to_glib_full());
                        }
                        Some((acc, pw))
                    }
                    None => None,
                })
                .collect();
            *credentials = valid_creds;

            Ok(true)
        }
        Err(err) => {
            if err.message().contains("No such secret item at path") {
                Ok(false)
            } else {
                Err(KeyringError::Os(err.message().to_owned()))
            }
        }
    }
}
