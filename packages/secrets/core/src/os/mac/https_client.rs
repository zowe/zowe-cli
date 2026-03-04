use std::collections::HashMap;

/// Request structure for HTTPS operations with client certificate authentication
pub struct HttpsRequest {
    pub hostname: String,
    pub port: u16,
    pub path: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<Vec<u8>>,
    pub cert_account: String,
    pub reject_unauthorized: bool,
    pub timeout: Option<u64>,
}

/// Response structure for HTTPS operations
pub struct HttpsResponse {
    pub status_code: u16,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
}
