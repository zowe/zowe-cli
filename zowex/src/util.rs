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

// Utility functions.

use std::collections::HashMap;
use std::env;
use std::path::{Path, PathBuf};

extern crate home;
use home::home_dir;

extern crate pathsearch;
use pathsearch::PathSearcher;

extern crate supports_color;
use supports_color::Stream;

extern crate yansi;
use yansi::Paint;

extern crate whoami;
use whoami::username;

// Zowe daemon executable modules
use crate::defs::*;

/**
 * Get the file path to the command that runs the NodeJS version of Zowe.
 *
 * @returns File path to the NodeJS zowe script.
 */
pub fn util_get_nodejs_zowe_path() -> String {
    /* On Linux/Mac both our executable and shell script are named 'zowe'.
     * First get the path name to my own zowe rust executable.
     */
    let my_exe_result = env::current_exe();
    if my_exe_result.is_err() {
        eprintln!("Unable to get path to my own executable. Terminating.");
        std::process::exit(EXIT_CODE_CANNOT_GET_MY_PATH);
    }
    let my_exe_path_buf = my_exe_result.unwrap();
    let my_exe_path = my_exe_path_buf.to_string_lossy();

    let zowe_cmd = if env::consts::OS == "windows" {
        "zowe.cmd"
    } else {
        "zowe"
    };

    // find every program in our path that would execute a 'zowe' command
    const NOT_FOUND: &str = "notFound";
    let mut njs_zowe_path: String = NOT_FOUND.to_string();
    let path = env::var_os("PATH");
    let path_ext = env::var_os("PATHEXT");
    for njs_zowe_path_buf in PathSearcher::new(zowe_cmd, path.as_deref(), path_ext.as_deref()) {
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
        eprintln!("Could not find a NodeJS zowe command on your path.");
        eprintln!("Will not be able to run Zowe commands. Terminating.");
        std::process::exit(EXIT_CODE_NO_NODEJS_ZOWE_ON_PATH);
    }

    njs_zowe_path
}

/**
 * Get the path to the zowe daemon directory (defaults to ~/.zowe/daemon).
 * Ensures that the directory exists, or we create it.
 *
 * @returns The path to the zowe daemon directory.
 */
pub fn util_get_daemon_dir() -> Result<PathBuf, i32> {
    let mut daemon_dir: PathBuf;
    if let Ok(ok_val) = env::var("ZOWE_DAEMON_DIR") {
        daemon_dir = PathBuf::new();
        daemon_dir.push(ok_val);
    } else {
        match home_dir() {
            Some(path_buf_val) => daemon_dir = path_buf_val,
            None => {
                eprintln!("Unable to get user's home directory.");
                return Err(EXIT_CODE_ENV_ERROR);
            }
        }
        daemon_dir.push(".zowe");
        daemon_dir.push("daemon");
    }

    if !daemon_dir.exists() {
        if let Err(err_val) = std::fs::create_dir_all(&daemon_dir) {
            eprintln!(
                "Unable to create zowe daemon directory = {}.",
                &daemon_dir.display()
            );
            eprintln!("Reason = {}.", err_val);
            return Err(EXIT_CODE_FILE_IO_ERROR);
        }
    }

    // Restrict the daemon directory to the current user only, since it can hold
    // sensitive runtime artifacts (pid file, socket, lock file). We do this for
    // existing directories too, in case one was previously created with
    // permissions that allow group/other access.
    util_restrict_path_to_owner(&daemon_dir)?;

    Ok(daemon_dir)
}

/**
 * Read the secret daemon token from the owner-only pid file in the supplied
 * daemon directory.
 *
 * The daemon stores a freshly generated token in `daemon_pid.json` (which is
 * restricted to the owner) every time it starts. We echo this token back to the
 * daemon on every request to prove that we are the user that owns the daemon.
 * Only the owner can read the pid file, so only the owner can learn the token.
 *
 * This must be called only after we have established a connection to the daemon,
 * because the daemon writes the pid file (with the token) as it starts up. If we
 * read it too early we could get a stale token from a previous daemon.
 *
 * @param daemon_dir The daemon directory that contains `daemon_pid.json`.
 *
 * @returns The token on success, or None if it could not be read (e.g. when
 *          talking to an older daemon that does not write a token).
 */
pub(crate) fn util_get_daemon_token_from_dir(daemon_dir: &Path) -> Option<String> {
    let mut pid_file_path = daemon_dir.to_path_buf();
    pid_file_path.push("daemon_pid.json");

    let pid_file = std::fs::File::open(&pid_file_path).ok()?;
    let pid_reader = std::io::BufReader::new(pid_file);
    let daemon_pid_for_user: DaemonPidForUser = serde_json::from_reader(pid_reader).ok()?;
    daemon_pid_for_user.token
}

#[cfg(target_family = "unix")]
pub fn util_get_socket_string() -> Result<String, i32> {
    let mut socket_path: PathBuf;
    match util_get_daemon_dir() {
        Ok(ok_val) => socket_path = ok_val,
        Err(err_val) => return Err(err_val),
    }
    socket_path.push("daemon.sock");
    Ok(socket_path.into_os_string().into_string().unwrap())
}

#[cfg(target_family = "windows")]
pub fn util_get_socket_string() -> Result<String, i32> {
    let mut _socket = format!("\\\\.\\pipe\\{}\\{}", util_get_username(), "ZoweDaemon");

    if let Ok(pipe_name) = env::var("ZOWE_DAEMON_PIPE") {
        _socket = format!("\\\\.\\pipe\\{}", pipe_name);
    }
    Ok(_socket)
}

pub fn util_get_zowe_env() -> HashMap<String, String> {
    let mut environment: HashMap<String, String> = env::vars()
        .filter(|(k, _)| k.starts_with("ZOWE_"))
        .collect();

    match env::var("FORCE_COLOR") {
        Ok(val) => {environment.insert(String::from("FORCE_COLOR"), val);},
        Err(_val) => {environment.insert(String::from("FORCE_COLOR"), util_terminal_supports_color().to_string());}
    }

    // Make sure ansi is enabled for the response
    if !Paint::enable_windows_ascii() {
        #[cfg(not(test))] // Because this is a problem during GitHub Actions CI builds
        environment.insert(String::from("FORCE_COLOR"), String::from("0"));
    }

    environment
}

#[cfg(target_family = "windows")]
pub fn util_get_username() -> String {
    username().to_lowercase()
}

#[cfg(not(target_family = "windows"))]
pub fn util_get_username() -> String {
    username()
}

pub fn util_terminal_supports_color() -> i32 {
    if let Some(support) = supports_color::on(Stream::Stdout) {
        if support.has_16m {
            return 3;
        } else if support.has_256 {
            return 2;
        } else if support.has_basic {
            return 1;
        }
    }

    0
}

/**
 * Restrict the ~/.zowe/bin directory and the zowe executable within it so that
 * only the current user has access. The running executable resides in that bin
 * directory, so we derive both paths from our own executable path.
 *
 * This is best-effort: any failure is reported as a warning and ignored so that
 * a daemon restart is never prevented by a permission-change error.
 */
pub fn util_restrict_zowe_bin_to_owner() {
    let my_exe_path = match env::current_exe() {
        Ok(ok_val) => ok_val,
        Err(err_val) => {
            eprintln!("Warning: unable to determine the path to the zowe executable.");
            eprintln!("Reason = {}.", err_val);
            return;
        }
    };

    // restrict the zowe executable itself (owner-only, retains execute on POSIX)
    let _ = util_restrict_path_to_owner(&my_exe_path);

    // restrict the bin directory that contains the executable
    if let Some(bin_dir) = my_exe_path.parent() {
        let _ = util_restrict_path_to_owner(bin_dir);
    }
}

/**
 * Restrict access to a file or directory so that only the current user can
 * access it. On POSIX systems this sets the mode to 0o700 (rwx for the owner,
 * which retains execute access required for directories and executables). On
 * Windows it uses icacls to grant full control to only the current user
 * (best-effort).
 *
 * @param fs_path The path to the file or directory to secure.
 *
 * @returns Ok on success, or a failure exit code on a POSIX permission error.
 */
#[cfg(target_family = "unix")]
pub(crate) fn util_restrict_path_to_owner(fs_path: &Path) -> Result<(), i32> {
    use std::os::unix::fs::PermissionsExt;
    if let Err(err_val) =
        std::fs::set_permissions(fs_path, std::fs::Permissions::from_mode(0o700))
    {
        eprintln!(
            "Unable to restrict access to path = {}.",
            fs_path.display()
        );
        eprintln!("Reason = {}.", err_val);
        return Err(EXIT_CODE_FILE_IO_ERROR);
    }
    Ok(())
}

#[cfg(target_family = "windows")]
pub(crate) fn util_restrict_path_to_owner(fs_path: &Path) -> Result<(), i32> {
    use std::process::Command;
    // Best-effort: remove inherited permissions and grant full control only to the
    // current user. We only warn on failure so that a missing/locked-down icacls
    // does not prevent the daemon from functioning.
    let grant_arg = format!("{}:(OI)(CI)F", util_get_username());
    if let Err(err_val) = Command::new("icacls")
        .arg(fs_path)
        .arg("/inheritancelevel:r")
        .arg("/grant:r")
        .arg(grant_arg)
        .arg("/c")
        .output()
    {
        eprintln!(
            "Warning: unable to restrict access to path = {}.",
            fs_path.display()
        );
        eprintln!("Reason = {}.", err_val);
    }
    Ok(())
}