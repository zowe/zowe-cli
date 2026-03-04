use super::https_client::{HttpsRequest, HttpsResponse};
use crate::os::error::KeyringError;
use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::ptr;

// FFI structures matching the Objective-C definitions
#[repr(C)]
struct HttpsRequestParams {
    hostname: *const c_char,
    port: u16,
    path: *const c_char,
    method: *const c_char,
    header_keys: *const *const c_char,
    header_values: *const *const c_char,
    header_count: usize,
    body: *const u8,
    body_length: usize,
    cert_account: *const c_char,
    reject_unauthorized: bool,
    timeout_ms: u64,
}

#[repr(C)]
struct HttpsResponseData {
    status_code: u16,
    header_keys: *mut *mut c_char,
    header_values: *mut *mut c_char,
    header_count: usize,
    body: *mut u8,
    body_length: usize,
    error_message: *mut c_char,
}

extern "C" {
    fn perform_nsurlsession_request(params: *const HttpsRequestParams) -> *mut HttpsResponseData;
    fn free_nsurlsession_response(response: *mut HttpsResponseData);
}

pub fn native_https_request_nsurlsession(request: &HttpsRequest) -> Result<HttpsResponse, KeyringError> {
    unsafe {
        // Convert strings to CStrings
        let hostname = CString::new(request.hostname.as_str()).map_err(|e| KeyringError::Library {
            name: "NSURLSession".to_owned(),
            details: format!("Invalid hostname: {}", e),
        })?;
        
        let path = CString::new(request.path.as_str()).map_err(|e| KeyringError::Library {
            name: "NSURLSession".to_owned(),
            details: format!("Invalid path: {}", e),
        })?;
        
        let method = CString::new(request.method.as_str()).map_err(|e| KeyringError::Library {
            name: "NSURLSession".to_owned(),
            details: format!("Invalid method: {}", e),
        })?;
        
        let cert_account = CString::new(request.cert_account.as_str()).map_err(|e| KeyringError::Library {
            name: "NSURLSession".to_owned(),
            details: format!("Invalid cert_account: {}", e),
        })?;
        
        // Convert headers to C arrays
        let mut header_keys_vec: Vec<CString> = Vec::new();
        let mut header_values_vec: Vec<CString> = Vec::new();
        let mut header_keys_ptrs: Vec<*const c_char> = Vec::new();
        let mut header_values_ptrs: Vec<*const c_char> = Vec::new();
        
        for (key, value) in &request.headers {
            let key_cstr = CString::new(key.as_str()).map_err(|e| KeyringError::Library {
                name: "NSURLSession".to_owned(),
                details: format!("Invalid header key: {}", e),
            })?;
            let value_cstr = CString::new(value.as_str()).map_err(|e| KeyringError::Library {
                name: "NSURLSession".to_owned(),
                details: format!("Invalid header value: {}", e),
            })?;
            
            header_keys_ptrs.push(key_cstr.as_ptr());
            header_values_ptrs.push(value_cstr.as_ptr());
            header_keys_vec.push(key_cstr);
            header_values_vec.push(value_cstr);
        }
        
        // Prepare body
        let (body_ptr, body_len) = match &request.body {
            Some(body) => (body.as_ptr(), body.len()),
            None => (ptr::null(), 0),
        };
        
        // Create request params
        let params = HttpsRequestParams {
            hostname: hostname.as_ptr(),
            port: request.port,
            path: path.as_ptr(),
            method: method.as_ptr(),
            header_keys: if header_keys_ptrs.is_empty() { ptr::null() } else { header_keys_ptrs.as_ptr() },
            header_values: if header_values_ptrs.is_empty() { ptr::null() } else { header_values_ptrs.as_ptr() },
            header_count: header_keys_ptrs.len(),
            body: body_ptr,
            body_length: body_len,
            cert_account: cert_account.as_ptr(),
            reject_unauthorized: request.reject_unauthorized,
            timeout_ms: request.timeout.unwrap_or(30000),
        };
        
        // Call Objective-C function
        let response_ptr = perform_nsurlsession_request(&params);
        
        if response_ptr.is_null() {
            return Err(KeyringError::Library {
                name: "NSURLSession".to_owned(),
                details: "Failed to perform request (null response)".to_owned(),
            });
        }
        
        let response_data = &*response_ptr;
        
        // Check for error
        if !response_data.error_message.is_null() {
            let error_cstr = CStr::from_ptr(response_data.error_message);
            let error_msg = error_cstr.to_string_lossy().to_string();
            free_nsurlsession_response(response_ptr);
            return Err(KeyringError::Library {
                name: "NSURLSession".to_owned(),
                details: error_msg,
            });
        }
        
        // Extract headers
        let mut headers = HashMap::new();
        if !response_data.header_keys.is_null() && !response_data.header_values.is_null() {
            for i in 0..response_data.header_count {
                let key_ptr = *response_data.header_keys.add(i);
                let value_ptr = *response_data.header_values.add(i);
                
                if !key_ptr.is_null() && !value_ptr.is_null() {
                    let key = CStr::from_ptr(key_ptr).to_string_lossy().to_string();
                    let value = CStr::from_ptr(value_ptr).to_string_lossy().to_string();
                    headers.insert(key, value);
                }
            }
        }
        
        // Extract body
        let body = if !response_data.body.is_null() && response_data.body_length > 0 {
            let mut body_vec = vec![0u8; response_data.body_length];
            ptr::copy_nonoverlapping(response_data.body, body_vec.as_mut_ptr(), response_data.body_length);
            body_vec
        } else {
            Vec::new()
        };
        
        let result = HttpsResponse {
            status_code: response_data.status_code,
            headers,
            body,
        };
        
        // Free the response
        free_nsurlsession_response(response_ptr);
        
        Ok(result)
    }
}
