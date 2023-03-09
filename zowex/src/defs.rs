/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

// Constants, structures, and enums used by the Zowe EXE

use std::collections::HashMap;

use serde::{Deserialize, Serialize};

pub const EXIT_CODE_SUCCESS: i32 = 0;
pub const EXIT_CODE_CANNOT_CONNECT_TO_RUNNING_DAEMON: i32 = 100;
pub const EXIT_CODE_CANNOT_GET_MY_PATH: i32 = 101;
pub const EXIT_CODE_NO_NODEJS_ZOWE_ON_PATH: i32 = 102;
pub const EXIT_CODE_CANNOT_START_DAEMON: i32 = 103;
pub const EXIT_CODE_TIMEOUT_CONNECT_TO_RUNNING_DAEMON: i32 = 104;
pub const EXIT_CODE_DAEMON_NOT_RUNNING_AFTER_START: i32 = 105;
pub const EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD: i32 = 106;
pub const EXIT_CODE_CANT_FIND_CMD_SHELL: i32 = 107;
pub const EXIT_CODE_UNKNOWN_CMD_SHELL: i32 = 108;
#[cfg(target_family = "windows")]
pub const EXIT_CODE_CANNOT_ACQUIRE_LOCK: i32 = 109;
pub const EXIT_CODE_COMM_IO_ERROR: i32 = 110;
pub const EXIT_CODE_FILE_IO_ERROR: i32 = 111;
pub const EXIT_CODE_ENV_ERROR: i32 = 112;
pub const EXIT_CODE_CANT_CONVERT_JSON: i32 = 113;

pub const LAUNCH_DAEMON_OPTION: &str = "--daemon";
pub const SHUTDOWN_REQUEST: &str = "shutdown";
pub const THREE_SEC_DELAY: u64 = 3;
pub const THREE_MIN_OF_RETRIES: i32 = 60;

pub struct DaemonProcInfo {
    pub is_running: bool,
    pub name: String,
    pub pid: String,
    pub cmd: String,
}

#[derive(Deserialize)]
#[allow(non_snake_case)]
pub struct DaemonRequest {
    pub stdout: Option<String>,
    pub stderr: Option<String>,
    pub exitCode: Option<i32>,
    pub progress: Option<bool>,
    pub prompt: Option<String>,
    pub securePrompt: Option<String>,
}

#[derive(Serialize)]
#[allow(non_snake_case)]
pub struct DaemonResponse {
    pub argv: Option<Vec<String>>,
    pub cwd: Option<String>,
    pub env: Option<HashMap<String, String>>,
    pub stdinLength: Option<i32>,
    pub stdin: Option<String>,
    pub user: Option<String>,
}

#[derive(Deserialize)]
pub struct DaemonPidForUser {
    pub user: String,
    pub pid: i32,
}

pub enum CmdShell {
    Bash,             // Bourne Again SHell
    Sh,               // Standard Linux shell
    Korn,             // Korn shell
    Zshell,           // Z shell
    Cshell,           // C shell
    Tenex,            // TENEX C shell
    PowerShellDotNet, // Newer cross-platform .NET Core PowerShell
    PowerShellExe,    // Legacy Windows executable PowerShell (version 5.x)
    WindowsCmd,       // Classic Windows CMD shell
    Unknown,          // A command shell that we do not yet understand
}
