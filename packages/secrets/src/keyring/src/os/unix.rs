extern crate libsecret;
use glib::translate::{FromGlibPtrContainer, ToGlibPtr};
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

fn get_attribute_map<'a>(service: &'a str, account: &'a str) -> HashMap<&'a str, &'a str> {
    HashMap::from([("service", service), ("account", account)])
}

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
        SearchFlags::ALL | SearchFlags::LOAD_SECRETS,
        gio::Cancellable::NONE,
    ) {
        Ok(vec) => {
            let valid_creds: Vec<(String, String)> = vec
                .iter()
                .filter_map(|item| {
                    let attrs: HashMap<String, String> = unsafe {
                        let attrs =
                            libsecret_sys::secret_item_get_attributes(item.to_glib_none().0);
                        FromGlibPtrContainer::from_glib_full(attrs)
                    };
                    match item.secret() {
                        Some(secret) => {
                            let bytes = secret.get();
                            unsafe {
                                libsecret_sys::secret_value_unref(secret.as_ptr() as *mut _);
                            }

                            let acc = attrs.get("account").unwrap().clone();
                            let pw = String::from_utf8(bytes).unwrap_or("".to_string());

                            Some((acc, pw))
                        }
                        None => None,
                    }
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
