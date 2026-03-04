use napi::{Env, Error, JsBoolean, JsUnknown, Result, Task};
use napi_derive::napi;
use std::collections::HashMap;

use secrets_core::os;

pub struct SetPassword {
    pub service: String,
    pub account: String,
    pub password: String,
    pub persist_win32: Option<u32>
}

pub struct GetPassword {
    pub service: String,
    pub account: String,
}

pub struct GetCertificate {
    pub service: String,
    pub account: String,
}

pub struct GetPrivateKey {
    pub service: String,
    pub account: String,
}

pub struct DeletePassword {
    pub service: String,
    pub account: String,
}

pub struct FindCredentials {
    pub service: String,
}
pub struct FindPassword {
    pub service: String,
}

pub struct CreateIdentityContext {
    pub service: String,
    pub account: String,
}

pub struct SignWithIdentity {
    pub handle_id: String,
    pub algorithm: String,
    pub data: Vec<u8>,
}

pub struct ReleaseIdentityContext {
    pub handle_id: String,
}

pub struct NativeHttpsRequest {
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

#[napi(object)]
pub struct HttpsResponse {
    pub status_code: u16,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
}

#[napi(object)]
pub struct Credential {
    pub account: String,
    pub password: String,
}

#[napi]
impl Task for GetPassword {
    type Output = Option<String>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::get_password(&self.service, &self.account) {
            Ok(pw) => Ok(pw),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(pw) => env.create_string(pw.as_str())?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(target_os = "macos")]
#[napi]
impl Task for GetCertificate {
    type Output = Option<Vec<u8>>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::get_certificate(&self.service, &self.account) {
            Ok(cert) => Ok(cert),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(bytes) => env.create_buffer_with_data(bytes)?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(not(target_os = "macos"))]
#[napi]
impl Task for GetCertificate {
    type Output = Option<Vec<u8>>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        Err(napi::Error::from_reason("get_certificate is not yet supported on this platform".to_owned()))
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(bytes) => env.create_buffer_with_data(bytes)?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(target_os = "macos")]
#[napi]
impl Task for GetPrivateKey {
    type Output = Option<Vec<u8>>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::get_private_key(&self.service, &self.account) {
            Ok(key) => Ok(key),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(bytes) => env.create_buffer_with_data(bytes)?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(not(target_os = "macos"))]
#[napi]
impl Task for GetPrivateKey {
    type Output = Option<Vec<u8>>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        Err(napi::Error::from_reason("get_private_key is not yet supported on this platform".to_owned()))
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(bytes) => env.create_buffer_with_data(bytes)?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[napi]
impl Task for SetPassword {
    type Output = bool;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        #[cfg(target_os = "windows")]
        let res = os::set_password_with_persistence(
            &self.service,
            &self.account,
            &mut self.password,
            self.persist_win32
                .unwrap_or(os::PERSIST_ENTERPRISE),
        );

        #[cfg(not(target_os = "windows"))]
        let res = os::set_password(&self.service, &self.account, &mut self.password);

        match res {
            Ok(result) => Ok(result),
            Err(err) => Err(napi::Error::from_reason(err.to_string()))
        }
    }

    fn resolve(&mut self, env: Env, _output: Self::Output) -> Result<Self::JsValue> {
        Ok(env.get_null()?.into_unknown())
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[napi]
impl Task for DeletePassword {
    type Output = bool;
    type JsValue = JsBoolean;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::delete_password(&self.service, &self.account) {
            Ok(result) => Ok(result),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        env.get_boolean(output)
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[napi]
impl Task for FindCredentials {
    type Output = Vec<(String, String)>;
    type JsValue = Vec<Credential>;

    fn compute(&mut self) -> Result<Self::Output> {
        let mut credentials: Self::Output = Vec::new();
        match os::find_credentials(&self.service, &mut credentials) {
            Ok(_result) => Ok(credentials),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        let mut creds = Vec::new();
        for cred in output {
            creds.push(Credential {
                account: cred.0,
                password: cred.1,
            })
        }

        Ok(creds)
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[napi]
impl Task for FindPassword {
    type Output = Option<String>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::find_password(&self.service) {
            Ok(pw) => Ok(pw),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(pw) => env.create_string(pw.as_str())?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(target_os = "macos")]
#[napi]
impl Task for CreateIdentityContext {
    type Output = Option<String>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::create_identity_context(&self.service, &self.account) {
            Ok(handle_id) => Ok(handle_id),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(handle) => env.create_string(handle.as_str())?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(not(target_os = "macos"))]
#[napi]
impl Task for CreateIdentityContext {
    type Output = Option<String>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        Err(napi::Error::from_reason("create_identity_context is not yet supported on this platform".to_owned()))
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(handle) => env.create_string(handle.as_str())?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(target_os = "macos")]
#[napi]
impl Task for SignWithIdentity {
    type Output = Option<Vec<u8>>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::sign_with_identity(&self.handle_id, &self.algorithm, &self.data) {
            Ok(signature) => Ok(signature),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(sig) => env.create_buffer_with_data(sig)?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(not(target_os = "macos"))]
#[napi]
impl Task for SignWithIdentity {
    type Output = Option<Vec<u8>>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        Err(napi::Error::from_reason("sign_with_identity is not yet supported on this platform".to_owned()))
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(match output {
            Some(sig) => env.create_buffer_with_data(sig)?.into_unknown(),
            None => env.get_null()?.into_unknown(),
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(target_os = "macos")]
#[napi]
impl Task for ReleaseIdentityContext {
    type Output = bool;
    type JsValue = JsBoolean;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::release_identity_context(&self.handle_id) {
            Ok(released) => Ok(released),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        env.get_boolean(output)
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(not(target_os = "macos"))]
#[napi]
impl Task for ReleaseIdentityContext {
    type Output = bool;
    type JsValue = JsBoolean;

    fn compute(&mut self) -> Result<Self::Output> {
        Err(napi::Error::from_reason("release_identity_context is not yet supported on this platform".to_owned()))
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        env.get_boolean(output)
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(target_os = "macos")]
#[napi]
impl Task for NativeHttpsRequest {
    type Output = secrets_core::os::mac::https_client::HttpsResponse;
    type JsValue = HttpsResponse;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::native_https_request(
            &self.hostname,
            self.port,
            &self.path,
            &self.method,
            self.headers.clone(),
            self.body.clone(),
            &self.cert_account,
            self.reject_unauthorized,
            self.timeout,
        ) {
            Ok(response) => Ok(response),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(HttpsResponse {
            status_code: output.status_code,
            headers: output.headers,
            body: output.body,
        })
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(not(target_os = "macos"))]
#[napi]
impl Task for NativeHttpsRequest {
    type Output = HttpsResponse;
    type JsValue = HttpsResponse;

    fn compute(&mut self) -> Result<Self::Output> {
        Err(napi::Error::from_reason("native_https_request is not yet supported on this platform".to_owned()))
    }

    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(output)
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}
