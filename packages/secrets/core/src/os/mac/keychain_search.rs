use crate::os::mac::error::{handle_os_status, Error};
use crate::os::mac::ffi::{
    kSecAttrAccount, kSecAttrLabel, kSecAttrService, kSecClass, kSecClassGenericPassword,
    kSecMatchLimit, kSecReturnAttributes, kSecReturnData, kSecReturnRef, SecItemCopyMatching,
};
use crate::os::mac::keychain_item::SecKeychainItem;
use crate::os::mac::misc::{SecCertificate, SecIdentity, SecKey};
use core_foundation::array::CFArray;
use core_foundation::base::{CFType, TCFType};
use core_foundation::boolean::CFBoolean;
use core_foundation::data::CFData;
use core_foundation::date::CFDate;
use core_foundation::dictionary::CFDictionary;
use core_foundation::number::CFNumber;
use core_foundation::string::CFString;
use core_foundation_sys::base::{CFCopyDescription, CFGetTypeID, CFRelease, CFTypeRef};
use std::collections::HashMap;

/// Keychain Search structure to reference when making searches within the keychain.
#[derive(Default)]
pub struct KeychainSearch {
    label: Option<CFString>,
    service: Option<CFString>,
    account: Option<CFString>,
    load_attrs: bool,
    load_data: bool,
    load_refs: bool,
}

/// Reference enum for categorizing search results based on item type.
pub enum Reference {
    Identity(SecIdentity),
    Certificate(SecCertificate),
    Key(SecKey),
    KeychainItem(SecKeychainItem),
}

/// Enum for organizing types of items found during the keychain search operation.
pub enum SearchResult {
    Ref(Reference),
    Dict(CFDictionary),
    Data(Vec<u8>),
}

impl SearchResult {
    ///
    /// parse_dict  
    /// Tries to parse a CFDictionary object into a hashmap of string pairs.
    ///
    /// Returns:
    /// - `Some(hash_map)` containing the attribute keys/values if parsed successfully
    /// - `None` otherwise
    #[must_use]
    pub fn parse_dict(&self) -> Option<HashMap<String, String>> {
        match *self {
            Self::Dict(ref d) => unsafe {
                // build map of attributes to return for this search result
                let mut retmap = HashMap::new();
                let (keys, values) = d.get_keys_and_values();
                for (k, v) in keys.iter().zip(values.iter()) {
                    // get key as CFString from pointer
                    let key_cfstr = CFString::wrap_under_get_rule((*k).cast());

                    // get value based on CFType
                    let val: String = match CFGetTypeID(*v) {
                        cfstring if cfstring == CFString::type_id() => {
                            format!("{}", CFString::wrap_under_get_rule((*v).cast()))
                        }
                        cfdata if cfdata == CFData::type_id() => {
                            let buf = CFData::wrap_under_get_rule((*v).cast());
                            let mut vec = Vec::new();
                            vec.extend_from_slice(buf.bytes());
                            format!("{}", String::from_utf8_lossy(&vec))
                        }
                        cfdate if cfdate == CFDate::type_id() => format!(
                            "{}",
                            CFString::wrap_under_create_rule(CFCopyDescription(*v))
                        ),
                        _ => String::from("unknown"),
                    };
                    retmap.insert(format!("{}", key_cfstr), val);
                }
                Some(retmap)
            },
            _ => None,
        }
    }
}

///
/// get_item
///
/// item: The item reference to convert to a SearchResult
/// Returns:
/// - a SearchResult enum variant based on the item reference provided.
///
unsafe fn get_item(item: CFTypeRef) -> SearchResult {
    let type_id = CFGetTypeID(item);

    // if type is a raw buffer, return Vec of bytes based on item size
    if type_id == CFData::type_id() {
        let data = CFData::wrap_under_get_rule(item as *mut _);
        let mut buf = Vec::new();
        buf.extend_from_slice(data.bytes());
        return SearchResult::Data(buf);
    }

    // if type is dictionary of items, cast as CFDictionary object
    if type_id == CFDictionary::<*const u8, *const u8>::type_id() {
        return SearchResult::Dict(CFDictionary::wrap_under_get_rule(item as *mut _));
    }

    // if type is a single Keychain item, return it as a reference
    if type_id == SecKeychainItem::type_id() {
        return SearchResult::Ref(Reference::KeychainItem(
            SecKeychainItem::wrap_under_get_rule(item as *mut _),
        ));
    }

    // handle certificate, cryptographic key, and identity types as
    // they can also appear in search results for the keychain
    let reference = match type_id {
        r if r == SecCertificate::type_id() => {
            Reference::Certificate(SecCertificate::wrap_under_get_rule(item as *mut _))
        }
        r if r == SecKey::type_id() => Reference::Key(SecKey::wrap_under_get_rule(item as *mut _)),
        r if r == SecIdentity::type_id() => {
            Reference::Identity(SecIdentity::wrap_under_get_rule(item as *mut _))
        }
        _ => panic!("Bad type received from SecItemCopyMatching: {}", type_id),
    };

    SearchResult::Ref(reference)
}

impl KeychainSearch {
    #[inline(always)]
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn label(&mut self, label: &str) -> &mut Self {
        self.label = Some(CFString::new(label));
        self
    }

    pub fn with_attrs(&mut self) -> &mut Self {
        self.load_attrs = true;
        self
    }

    pub fn with_data(&mut self) -> &mut Self {
        self.load_data = true;
        self
    }

    pub fn with_refs(&mut self) -> &mut Self {
        self.load_refs = true;
        self
    }

    /// Executes a search within the keychain, factoring in the set search options.
    ///
    /// Returns:
    /// - If successful, a `Vec<SearchResult>` containing a list of search results
    /// - an `Error` object otherwise
    pub fn execute(&self) -> Result<Vec<SearchResult>, Error> {
        let mut params = vec![];

        unsafe {
            params.push((
                CFString::wrap_under_get_rule(kSecClass),
                CFType::wrap_under_get_rule(kSecClassGenericPassword.cast()),
            ));

            // Handle any parameters that were configured before execution (label, service, account)
            if let Some(ref label) = self.label {
                params.push((
                    CFString::wrap_under_get_rule(kSecAttrLabel),
                    label.as_CFType(),
                ));
            }
            if let Some(ref service) = self.service {
                params.push((
                    CFString::wrap_under_get_rule(kSecAttrService),
                    service.as_CFType(),
                ));
            }
            if let Some(ref acc) = self.account {
                params.push((
                    CFString::wrap_under_get_rule(kSecAttrAccount),
                    acc.as_CFType(),
                ));
            }

            // Add params to fetch data, attributes, and/or refs if requested from search options
            if self.load_data {
                params.push((
                    CFString::wrap_under_get_rule(kSecReturnData),
                    CFBoolean::true_value().into_CFType(),
                ));
            }
            if self.load_attrs {
                params.push((
                    CFString::wrap_under_get_rule(kSecReturnAttributes),
                    CFBoolean::true_value().into_CFType(),
                ));
            }
            if self.load_refs {
                params.push((
                    CFString::wrap_under_get_rule(kSecReturnRef),
                    CFBoolean::true_value().into_CFType(),
                ));
            }

            // Remove the default limit of 0 by requesting all items that match the search
            params.push((
                CFString::wrap_under_get_rule(kSecMatchLimit),
                CFNumber::from(i32::MAX).into_CFType(),
            ));

            let params = CFDictionary::from_CFType_pairs(&params);
            let mut ret = std::ptr::null();

            // handle copy operation status and get type ID based on return value
            handle_os_status(SecItemCopyMatching(params.as_concrete_TypeRef(), &mut ret))?;
            if ret.is_null() {
                return Ok(vec![]);
            }
            let type_id = CFGetTypeID(ret);

            // Build vector of items based on return reference type
            let mut items = vec![];
            if type_id == CFArray::<CFType>::type_id() {
                let array: CFArray<CFType> = CFArray::wrap_under_create_rule(ret as *mut _);
                for item in array.iter() {
                    items.push(get_item(item.as_CFTypeRef()));
                }
            } else {
                items.push(get_item(ret));

                CFRelease(ret);
            }

            Ok(items)
        }
    }
}
