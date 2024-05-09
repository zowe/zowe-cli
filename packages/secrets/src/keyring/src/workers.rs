use napi::{Env, Error, JsBoolean, JsUnknown, Result, Task};
use napi_derive::napi;

use secrets_core::os;

pub struct SetPassword {
    pub service: String,
    pub account: String,
    pub password: String,
}

pub struct GetPassword {
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

#[napi]
impl Task for SetPassword {
    type Output = bool;
    type JsValue = JsUnknown;

    fn compute(&mut self) -> Result<Self::Output> {
        match os::set_password(&self.service, &self.account, &mut self.password) {
            Ok(result) => Ok(result),
            Err(err) => Err(napi::Error::from_reason(err.to_string())),
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
