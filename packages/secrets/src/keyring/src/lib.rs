use napi::bindgen_prelude::AsyncTask;
use napi_derive::napi;
use std::collections::HashMap;
use workers::{CreateIdentityContext, DeletePassword, FindCredentials, FindPassword, GetCertificate, GetPassword, GetPrivateKey, NativeHttpsRequest, ReleaseIdentityContext, SetPassword, SignWithIdentity};

extern crate secrets_core;

mod workers;

#[napi]
fn delete_password(service: String, account: String) -> AsyncTask<DeletePassword> {
    AsyncTask::new(DeletePassword { service, account })
}

#[napi]
fn find_credentials(service: String) -> AsyncTask<FindCredentials> {
    AsyncTask::new(FindCredentials { service })
}

#[napi(ts_return_type = "Promise<string | null>")]
fn find_password(service: String) -> AsyncTask<FindPassword> {
    AsyncTask::new(FindPassword { service })
}

#[cfg(target_os = "macos")]
#[napi(ts_return_type = "Promise<Buffer | null>")]
fn get_certificate(service: String, account: String) -> AsyncTask<GetCertificate> {
    AsyncTask::new(GetCertificate { service, account })
}

#[cfg(target_os = "macos")]
#[napi(ts_return_type = "Promise<Buffer | null>")]
fn get_private_key(service: String, account: String) -> AsyncTask<GetPrivateKey> {
    AsyncTask::new(GetPrivateKey { service, account })
}

#[napi(ts_return_type = "Promise<string | null>")]
fn get_password(service: String, account: String) -> AsyncTask<GetPassword> {
    AsyncTask::new(GetPassword { service, account })
}

#[napi(ts_return_type = "Promise<void>")]
fn set_password(
    service: String, 
    account: String, 
    password: String,
    persist_win32: Option<u32>
) -> AsyncTask<SetPassword> {
    AsyncTask::new(SetPassword {
        service,
        account,
        password,
        persist_win32
    })
}

#[cfg(target_os = "macos")]
#[napi(ts_return_type = "Promise<string | null>")]
fn create_identity_context(service: String, account: String) -> AsyncTask<CreateIdentityContext> {
    AsyncTask::new(CreateIdentityContext { service, account })
}

#[cfg(target_os = "macos")]
#[napi(ts_return_type = "Promise<Buffer | null>")]
fn sign_with_identity(handle_id: String, algorithm: String, data: Vec<u8>) -> AsyncTask<SignWithIdentity> {
    AsyncTask::new(SignWithIdentity { handle_id, algorithm, data })
}

#[cfg(target_os = "macos")]
#[napi(ts_return_type = "Promise<boolean>")]
fn release_identity_context(handle_id: String) -> AsyncTask<ReleaseIdentityContext> {
    AsyncTask::new(ReleaseIdentityContext { handle_id })
}

#[cfg(target_os = "macos")]
#[napi(object)]
pub struct NativeHttpsRequestOptions {
    pub hostname: String,
    pub port: u16,
    pub path: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<Vec<u8>>,
    pub cert_account: String,
    pub reject_unauthorized: bool,
    pub timeout: Option<i64>,
}

#[cfg(target_os = "macos")]
#[napi]
fn native_https_request(options: NativeHttpsRequestOptions) -> AsyncTask<NativeHttpsRequest> {
    AsyncTask::new(NativeHttpsRequest {
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        method: options.method,
        headers: options.headers,
        body: options.body,
        cert_account: options.cert_account,
        reject_unauthorized: options.reject_unauthorized,
        timeout: options.timeout.map(|t| t as u64),
    })
}
