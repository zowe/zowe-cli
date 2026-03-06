//! Windows HTTPS client using WinHTTP with client certificate authentication
//!
//! This module provides HTTPS request functionality using Windows native WinHTTP API
//! with support for client certificate authentication using non-exportable keys.

use crate::os::error::KeyringError;
use super::identity_cache;
use std::collections::HashMap;
use std::ffi::c_void;
use std::ptr;
use windows_sys::Win32::Foundation::GetLastError;
use windows_sys::Win32::Networking::WinHttp::*;
use windows_sys::Win32::Security::Cryptography::*;

/// Helper function to encode a string as a null-terminated UTF-16 string
fn encode_utf16(s: &str) -> Vec<u16> {
    let mut chars: Vec<u16> = s.encode_utf16().collect();
    chars.push(0);
    chars
}

/// Helper function to decode UTF-16 to String
fn decode_utf16(wide: &[u16]) -> String {
    let end = wide.iter().position(|&c| c == 0).unwrap_or(wide.len());
    String::from_utf16_lossy(&wide[..end])
}

/// Response from an HTTPS request
#[derive(Debug)]
pub struct HttpsResponse {
    pub status_code: u16,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
}

/// Parse URL into components
fn parse_url(url: &str) -> Result<(String, String, u16, String), KeyringError> {
    let url_lower = url.to_lowercase();
    if !url_lower.starts_with("https://") {
        return Err(KeyringError::InvalidArg {
            argument: "url".to_owned(),
            details: "URL must use HTTPS protocol".to_owned(),
        });
    }
    
    let without_protocol = &url[8..];
    let (host_port, path) = match without_protocol.find('/') {
        Some(pos) => {
            let host_port = &without_protocol[..pos];
            let path = &without_protocol[pos..];
            (host_port, path.to_owned())
        }
        None => (without_protocol, "/".to_owned()),
    };
    
    let (host, port) = match host_port.find(':') {
        Some(pos) => {
            let host = &host_port[..pos];
            let port_str = &host_port[pos + 1..];
            let port = port_str.parse::<u16>().map_err(|_| KeyringError::InvalidArg {
                argument: "url".to_owned(),
                details: "Invalid port number".to_owned(),
            })?;
            (host.to_owned(), port)
        }
        None => (host_port.to_owned(), 443),
    };
    
    Ok((host, path, port, url.to_owned()))
}

pub fn native_https_request(
    url: &String,
    method: &String,
    headers: &Vec<(String, String)>,
    body: &Option<Vec<u8>>,
    handle_id: &Option<String>,
    timeout_ms: u32,
    reject_unauthorized: bool,
) -> Result<HttpsResponse, KeyringError> {
    let (host, path, port, _) = parse_url(url)?;
    
    unsafe {
        // Initialize WinHTTP session
        let user_agent = encode_utf16("Zowe-Secrets/1.0");
        let h_session = WinHttpOpen(
            user_agent.as_ptr(),
            WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
            ptr::null(),
            ptr::null(),
            0,
        );
        
        if h_session.is_null() {
            return Err(KeyringError::Os("Failed to open WinHTTP session".to_owned()));
        }
        
        // Connect to server
        let host_wide = encode_utf16(&host);
        let h_connect = WinHttpConnect(h_session, host_wide.as_ptr(), port, 0);
        
        if h_connect.is_null() {
            WinHttpCloseHandle(h_session);
            return Err(KeyringError::Os("Failed to connect to server".to_owned()));
        }
        
        // Open request
        let method_wide = encode_utf16(method);
        let path_wide = encode_utf16(&path);
        let h_request = WinHttpOpenRequest(
            h_connect,
            method_wide.as_ptr(),
            path_wide.as_ptr(),
            ptr::null(),
            ptr::null(),
            ptr::null_mut(),
            WINHTTP_FLAG_SECURE,
        );
        
        if h_request.is_null() {
            WinHttpCloseHandle(h_connect);
            WinHttpCloseHandle(h_session);
            return Err(KeyringError::Os("Failed to open request".to_owned()));
        }
        
        // Set timeout
        if timeout_ms > 0 {
            WinHttpSetTimeouts(h_request, timeout_ms as i32, timeout_ms as i32, timeout_ms as i32, timeout_ms as i32);
        }
        
        // Set client certificate if handle_id provided (must be done before setting security flags)
        if let Some(ref handle_id_str) = handle_id {
            let identity = identity_cache::get_cached_identity(handle_id_str).map_err(|err| {
                KeyringError::Library {
                    name: "Identity cache".to_owned(),
                    details: err,
                }
            })?;
            
            // Set the client certificate context
            // WINHTTP_OPTION_CLIENT_CERT_CONTEXT expects the CERT_CONTEXT pointer directly
            let result = WinHttpSetOption(
                h_request,
                WINHTTP_OPTION_CLIENT_CERT_CONTEXT,
                identity.cert_context as *mut c_void,
                std::mem::size_of::<CERT_CONTEXT>() as u32,
            );
            
            if result == 0 {
                let error = GetLastError();
                WinHttpCloseHandle(h_request);
                WinHttpCloseHandle(h_connect);
                WinHttpCloseHandle(h_session);
                return Err(KeyringError::Os(format!("Failed to set client certificate. Error code: {}", error)));
            }
        }
        
        // Configure TLS validation
        if !reject_unauthorized {
            let mut flags: u32 = SECURITY_FLAG_IGNORE_UNKNOWN_CA
                | SECURITY_FLAG_IGNORE_CERT_CN_INVALID
                | SECURITY_FLAG_IGNORE_CERT_DATE_INVALID
                | SECURITY_FLAG_IGNORE_CERT_WRONG_USAGE;
            
            WinHttpSetOption(
                h_request,
                WINHTTP_OPTION_SECURITY_FLAGS,
                &mut flags as *mut _ as *mut c_void,
                std::mem::size_of::<u32>() as u32,
            );
        }
        
        // Add custom headers
        if !headers.is_empty() {
            let mut header_string = String::new();
            for (key, value) in headers {
                header_string.push_str(&format!("{}: {}\r\n", key, value));
            }
            let headers_wide = encode_utf16(&header_string);
            
            let result = WinHttpAddRequestHeaders(
                h_request,
                headers_wide.as_ptr(),
                headers_wide.len() as u32 - 1,
                WINHTTP_ADDREQ_FLAG_ADD,
            );
            
            if result == 0 {
                WinHttpCloseHandle(h_request);
                WinHttpCloseHandle(h_connect);
                WinHttpCloseHandle(h_session);
                return Err(KeyringError::Os("Failed to add request headers".to_owned()));
            }
        }
        
        // Send request
        let (body_ptr, body_len, total_len) = match body {
            Some(ref data) => {
                let len = data.len() as u32;
                (data.as_ptr() as *const c_void, len, len)
            },
            None => (ptr::null(), 0, 0),
        };
        
        let result = WinHttpSendRequest(
            h_request,
            ptr::null(),
            0,
            body_ptr as *mut c_void,
            body_len,
            total_len,
            0,
        );
        
        if result == 0 {
            let error = GetLastError();
            WinHttpCloseHandle(h_request);
            WinHttpCloseHandle(h_connect);
            WinHttpCloseHandle(h_session);
            return Err(KeyringError::Os(format!("Failed to send request. Error code: {}", error)));
        }
        
        // Receive response
        let result = WinHttpReceiveResponse(h_request, ptr::null_mut());
        if result == 0 {
            let error = GetLastError();
            WinHttpCloseHandle(h_request);
            WinHttpCloseHandle(h_connect);
            WinHttpCloseHandle(h_session);
            return Err(KeyringError::Os(format!("Failed to receive response. Error code: {}", error)));
        }
        
        // Get status code
        let mut status_code: u32 = 0;
        let mut status_code_size: u32 = std::mem::size_of::<u32>() as u32;
        
        let result = WinHttpQueryHeaders(
            h_request,
            WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
            ptr::null(),
            &mut status_code as *mut _ as *mut c_void,
            &mut status_code_size,
            ptr::null_mut(),
        );
        
        if result == 0 {
            WinHttpCloseHandle(h_request);
            WinHttpCloseHandle(h_connect);
            WinHttpCloseHandle(h_session);
            return Err(KeyringError::Os("Failed to query status code".to_owned()));
        }
        
        // Get response headers
        let mut headers_size: u32 = 0;
        WinHttpQueryHeaders(
            h_request,
            WINHTTP_QUERY_RAW_HEADERS_CRLF,
            ptr::null(),
            ptr::null_mut(),
            &mut headers_size,
            ptr::null_mut(),
        );
        
        let mut response_headers = HashMap::new();
        if headers_size > 0 {
            let mut headers_buffer = vec![0u16; (headers_size / 2) as usize];
            let result = WinHttpQueryHeaders(
                h_request,
                WINHTTP_QUERY_RAW_HEADERS_CRLF,
                ptr::null(),
                headers_buffer.as_mut_ptr() as *mut c_void,
                &mut headers_size,
                ptr::null_mut(),
            );
            
            if result != 0 {
                let headers_str = decode_utf16(&headers_buffer);
                for line in headers_str.lines() {
                    if let Some(pos) = line.find(':') {
                        let key = line[..pos].trim().to_owned();
                        let value = line[pos + 1..].trim().to_owned();
                        response_headers.insert(key, value);
                    }
                }
            }
        }
        
        // Read response body
        let mut response_body = Vec::new();
        loop {
            let mut bytes_available: u32 = 0;
            let result = WinHttpQueryDataAvailable(h_request, &mut bytes_available);
            
            if result == 0 || bytes_available == 0 {
                break;
            }
            
            let mut buffer = vec![0u8; bytes_available as usize];
            let mut bytes_read: u32 = 0;
            
            let result = WinHttpReadData(
                h_request,
                buffer.as_mut_ptr() as *mut c_void,
                bytes_available,
                &mut bytes_read,
            );
            
            if result == 0 {
                break;
            }
            
            response_body.extend_from_slice(&buffer[..bytes_read as usize]);
        }
        
        // Cleanup
        WinHttpCloseHandle(h_request);
        WinHttpCloseHandle(h_connect);
        WinHttpCloseHandle(h_session);
        
        Ok(HttpsResponse {
            status_code: status_code as u16,
            headers: response_headers,
            body: response_body,
        })
    }
}
