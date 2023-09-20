use std::collections::HashMap;
use core_foundation::array::CFArray;
use core_foundation::base::{CFType, TCFType};
use core_foundation::boolean::CFBoolean;
use core_foundation::data::CFData;
use core_foundation::date::CFDate;
use core_foundation::dictionary::CFDictionary;
use core_foundation::number::CFNumber;
use core_foundation::string::CFString;
use core_foundation_sys::base::{CFCopyDescription, CFGetTypeID, CFRelease, CFTypeRef};
use crate::os::mac::error::{Error, handle_os_status};
use crate::os::mac::ffi::{kSecAttrAccount, kSecAttrLabel, kSecAttrService, kSecClass, kSecClassGenericPassword, kSecMatchLimit, kSecReturnAttributes, kSecReturnData, kSecReturnRef, SecItemCopyMatching};
use crate::os::mac::misc::{Certificate, Identity, Key};
use crate::os::mac::keychain_item::KeychainItem;

#[derive(Default)]
pub struct KeychainSearch {
    label: Option<CFString>,
    service: Option<CFString>,
    account: Option<CFString>,
    load_attrs: bool,
    load_data: bool,
    load_refs: bool,
}

pub enum Reference {
    Identity(Identity),
    Certificate(Certificate),
    Key(Key),
    KeychainItem(KeychainItem),
}

pub enum SearchResult {
    Ref(Reference),
    Dict(CFDictionary),
    Data(Vec<u8>),
    Other,
}

impl SearchResult {
    #[must_use]
    pub fn simplify_dict(&self) -> Option<HashMap<String, String>> {
        match *self {
            Self::Dict(ref d) => unsafe {
                let mut retmap = HashMap::new();
                let (keys, values) = d.get_keys_and_values();
                for (k, v) in keys.iter().zip(values.iter()) {
                    let key_cfstr = CFString::wrap_under_get_rule((*k).cast());
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
                        cfdate if cfdate == CFDate::type_id() => format!("{}", CFString::wrap_under_create_rule(CFCopyDescription(*v))),
                        _ => String::from("unknown")
                    };
                    retmap.insert(format!("{}", key_cfstr), val);
                }
                Some(retmap)
            }
            _ => None
        }
    }
}

unsafe fn get_item(item: CFTypeRef) -> SearchResult {
    let type_id = CFGetTypeID(item);
    if type_id == CFData::type_id() {
        let data = CFData::wrap_under_get_rule(item as *mut _);
        let mut buf = Vec::new();
        buf.extend_from_slice(data.bytes());
        return SearchResult::Data(buf);
    }

    if type_id == CFDictionary::<*const u8, *const u8>::type_id() {
        return SearchResult::Dict(CFDictionary::wrap_under_get_rule(item as *mut _));
    }

    if type_id == KeychainItem::type_id() {
        return SearchResult::Ref(Reference::KeychainItem(
            KeychainItem::wrap_under_get_rule(item as *mut _)
        ));
    }

    let reference = match type_id {
        r if r == Certificate::type_id() => Reference::Certificate(Certificate::wrap_under_get_rule(item as *mut _)),
        r if r == Key::type_id() => Reference::Key(Key::wrap_under_get_rule(item as *mut _)),
        r if r == Identity::type_id() => Reference::Identity(Identity::wrap_under_get_rule(item as *mut _)),
        _ => panic!("Bad type received from SecItemCopyMatching: {}", type_id)
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

    pub fn execute(&self) -> Result<Vec<SearchResult>, Error> {
        let mut params = vec![];

        unsafe {
            params.push((CFString::wrap_under_get_rule(kSecClass), CFType::wrap_under_get_rule(kSecClassGenericPassword.cast())));

            if let Some(ref label) = self.label {
                params.push((CFString::wrap_under_get_rule(kSecAttrLabel), label.as_CFType()));
            }

            if let Some(ref service) = self.service {
                params.push((CFString::wrap_under_get_rule(kSecAttrService), service.as_CFType()));
            }

            if let Some(ref acc) = self.account {
                params.push((CFString::wrap_under_get_rule(kSecAttrAccount), acc.as_CFType()));
            }

            if self.load_data {
                params.push((
                    CFString::wrap_under_get_rule(kSecReturnData),
                    CFBoolean::true_value().into_CFType()
                ));
            }
            if self.load_attrs {
                params.push((
                    CFString::wrap_under_get_rule(kSecReturnAttributes),
                    CFBoolean::true_value().into_CFType()
                ));
            }
            if self.load_refs {
                params.push((
                    CFString::wrap_under_get_rule(kSecReturnRef),
                    CFBoolean::true_value().into_CFType()
                ));
            }

            params.push((CFString::wrap_under_get_rule(kSecMatchLimit), CFNumber::from(i32::MAX).into_CFType()));

            let params = CFDictionary::from_CFType_pairs(&params);
            let mut ret = std::ptr::null();

            handle_os_status(SecItemCopyMatching(params.as_concrete_TypeRef(), &mut ret))?;
            if ret.is_null() {
                return Ok(vec![]);
            }
            let type_id = CFGetTypeID(ret);

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
