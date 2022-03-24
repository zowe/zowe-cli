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

/* Utility functions.
* Public functions are prefixed with util_.
*/

use std::collections::HashMap;
use std::env;

extern crate pathsearch;
use pathsearch::PathSearcher;

extern crate whoami;
use whoami::username;

// Zowe daemon executable modules
use crate::defs::*;

// Get the file path to the command that runs the NodeJS version of Zowe
pub fn util_get_nodejs_zowe_path() -> String {
    /* On Linux/Mac both our executable and shell script are named 'zowe'.
     * First get the path name to my own zowe rust executable.
     */
    let my_exe_result = env::current_exe();
    if my_exe_result.is_err() {
        println!("Unable to get path to my own executable. Terminating.");
        std::process::exit(EXIT_CODE_CANNOT_GET_MY_PATH);
    }
    let my_exe_path_buf = my_exe_result.unwrap();
    let my_exe_path = my_exe_path_buf.to_string_lossy();

    let zowe_cmd;
    if env::consts::OS == "windows" {
        zowe_cmd = "zowe.cmd";
    } else {
        zowe_cmd = "zowe";
    }

    // find every program in our path that would execute a 'zowe' command
    const NOT_FOUND: &str = "notFound";
    let mut njs_zowe_path: String = NOT_FOUND.to_string();
    let path = env::var_os("PATH");
    let path_ext = env::var_os("PATHEXT");
    for njs_zowe_path_buf in PathSearcher::new(
        zowe_cmd,
        path.as_deref(),
        path_ext.as_deref(),
    ) {
        njs_zowe_path = njs_zowe_path_buf.to_string_lossy().to_string();
        if njs_zowe_path.to_lowercase().eq(&my_exe_path.to_lowercase()) {
            // We do not want our own rust executable. Keep searching.
            njs_zowe_path = NOT_FOUND.to_string();
            continue;
        }

        // use the first 'zowe' command on our path that is not our own executable
        break;
    }
    if njs_zowe_path == NOT_FOUND {
        println!("Could not find a NodeJS zowe command on your path.");
        println!("Will not be able to run Zowe commands. Terminating.");
        std::process::exit(EXIT_CODE_NO_NODEJS_ZOWE_ON_PATH);
    }

    njs_zowe_path
}

#[cfg(target_family = "unix")]
pub fn util_get_socket_string() -> String {
    let mut _socket = format!("{}/{}", home_dir().unwrap().to_string_lossy(), ".zowe-daemon.sock");

    if let Ok(socket_path) = env::var("ZOWE_DAEMON") {
        _socket = socket_path;
    }

    _socket
}

#[cfg(target_family = "windows")]
pub fn util_get_socket_string() -> String {
    let mut _socket = format!("\\\\.\\pipe\\{}\\{}", username(), "ZoweDaemon");

    if let Ok(pipe_name) = env::var("ZOWE_DAEMON") {
        _socket = format!("\\\\.\\pipe\\{}", pipe_name);
    }

    _socket
}

pub fn util_get_zowe_env() -> HashMap<String, String> {
    env::vars().filter(|&(ref k, _)|
        k.starts_with("ZOWE_")
    ).collect()
}
