use napi::{Env, Error, JsBoolean, JsUnknown, Result, Task};
use napi_derive::napi;

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
    pub account: String,
}

pub struct GetPrivateKey {
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

pub struct CreateTlsPipe {
    pub remote_host: String,
    pub remote_port: u16,
    pub cert_account: String,
    pub reject_unauthorized: bool,
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

#[cfg(any(target_os = "macos", target_os = "windows"))]
#[napi]
impl Task for GetCertificate {
    type Output = Option<Vec<u8>>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::get_certificate(&self.account) {
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

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
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

#[cfg(any(target_os = "macos", target_os = "windows"))]
#[napi]
impl Task for GetPrivateKey {
    type Output = Option<Vec<u8>>;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::get_private_key(&self.account) {
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

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
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

#[cfg(any(target_os = "macos", target_os = "windows"))]
#[napi]
impl Task for CreateTlsPipe {
    type Output = String;
    type JsValue = napi::JsString;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::create_tls_pipe(&self.remote_host, self.remote_port, &self.cert_account, self.reject_unauthorized) {
            Ok(path) => Ok(path),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
        }
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        env.create_string(output.as_str())
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
#[napi]
impl Task for CreateTlsPipe {
    type Output = String;
    type JsValue = napi::JsString;

    fn compute(&mut self) -> Result<Self::Output> {
        Err(napi::Error::from_reason("create_tls_pipe is not yet supported on this platform".to_owned()))
    }

    fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
        env.create_string(output.as_str())
    }

    fn reject(&mut self, _env: Env, err: Error) -> Result<Self::JsValue> {
        Err(err)
    }
}

