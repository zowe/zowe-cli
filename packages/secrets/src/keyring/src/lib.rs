use napi::bindgen_prelude::AsyncTask;
use napi_derive::napi;
use workers::{
    CreateTlsPipe, DeletePassword, FindCredentials, FindPassword, GetPassword, SetPassword,
};

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

#[napi(ts_return_type = "Promise<void>")]
fn set_password(
    service: String,
    account: String,
    password: String,
    persist_win32: Option<u32>,
) -> AsyncTask<SetPassword> {
    AsyncTask::new(SetPassword {
        service,
        account,
        password,
        persist_win32,
    })
}

#[napi(ts_return_type = "Promise<string>")]
fn create_tls_pipe(
    remote_host: String,
    remote_port: u16,
    cert_account: String,
    reject_unauthorized: bool,
) -> AsyncTask<CreateTlsPipe> {
    AsyncTask::new(CreateTlsPipe {
        remote_host,
        remote_port,
        cert_account,
        reject_unauthorized,
    })
}
