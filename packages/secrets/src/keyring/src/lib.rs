use napi::bindgen_prelude::AsyncTask;
use napi::{Env, JsUnknown};
use napi_derive::napi;
use workers::{DeletePassword, FindCredentials, FindPassword, GetPassword, SetPassword};
use workers::GetCertificate;

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

#[napi(ts_return_type = "Promise<string | null>")]
fn get_password(service: String, account: String) -> AsyncTask<GetPassword> {
    AsyncTask::new(GetPassword { service, account })
}

#[napi(ts_return_type = "Promise<Buffer | null>")]
fn get_certificate(service: String, account: String) -> AsyncTask<GetCertificate> {
    AsyncTask::new(GetCertificate { service, account })
}

// Synchronous wrapper for consumers that need a blocking call.
// Returns Buffer | null synchronously.
#[napi(ts_return_type = "Buffer | null")]
fn get_certificate_sync(env: Env, service: String, account: String) -> napi::Result<JsUnknown> {
    // call into secrets_core OS layer directly
    match secrets_core::os::get_certificate(&service, &account) {
        Ok(Some(bytes)) => {
            // create a buffer from Vec<u8>
            let buf = env.create_buffer_with_data(bytes)?.into_unknown();
            Ok(buf)
        }
        Ok(None) => Ok(env.get_null()?.into_unknown()),
        Err(err) => Err(napi::Error::from_reason(err.to_string())),
    }
}

#[napi(ts_return_type = "Promise<void>")]
fn set_password(service: String, account: String, password: String) -> AsyncTask<SetPassword> {
    AsyncTask::new(SetPassword {
        service,
        account,
        password,
    })
}
