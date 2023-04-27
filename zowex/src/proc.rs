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

// Functions related to the manipulation of processes.

use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::process::{Command, Stdio};

#[cfg(target_family = "windows")]
use std::os::windows::process::CommandExt;

extern crate sysinfo;
use sysinfo::{Pid, PidExt, ProcessExt, System, SystemExt};

extern crate simple_error;
use simple_error::SimpleError;

// Zowe daemon executable modules
use crate::defs::*;
use crate::util::*;

/**
 * Get the command shell under which we are running.
 *
 * @returns A Result, which upon success contains a tuple:
 *          The first item is the type of the command shell
 *          The second item is the name of the process for that command shell.
 *
 *          Upon failure the Result contains a SimpleError.
 */
pub fn proc_get_cmd_shell() -> Result<(CmdShell, String), SimpleError> {
    let mut cmd_shell_type: CmdShell = CmdShell::Unknown;
    let mut cmd_shell_nm: String = "UnknownCmdShell".to_string();
    let my_pid: Pid = Pid::from_u32(std::process::id());

    // establish the system process list
    let mut sys = System::new_all();
    sys.refresh_all();

    // loop though the process list to find our process ID
    let mut found_my_pid: bool = false;
    for (next_pid, process) in sys.processes() {
        if next_pid == &my_pid {
            found_my_pid = true;
            let my_parent_pid: Pid = match process.parent() {
                Some(parent_id) => parent_id,
                None => {
                    return Err(SimpleError::new(
                        "Got invalid parent process ID from the process list.",
                    ));
                }
            };

            // loop though the process list to find our parent process ID
            let mut found_parent_pid: bool = false;
            for (next_par_pid, par_process) in sys.processes() {
                if next_par_pid == &my_parent_pid {
                    found_parent_pid = true;
                    cmd_shell_nm = par_process.name().to_string();

                    // Set any known command shell name
                    if cmd_shell_nm.to_lowercase().starts_with("bash") {
                        cmd_shell_type = CmdShell::Bash;
                    } else if cmd_shell_nm.to_lowercase().starts_with("sh") {
                        cmd_shell_type = CmdShell::Sh;
                    } else if cmd_shell_nm.to_lowercase().starts_with("ksh") {
                        cmd_shell_type = CmdShell::Korn;
                    } else if cmd_shell_nm.to_lowercase().starts_with("zsh") {
                        cmd_shell_type = CmdShell::Zshell;
                    } else if cmd_shell_nm.to_lowercase().starts_with("csh") {
                        cmd_shell_type = CmdShell::Cshell;
                    } else if cmd_shell_nm.to_lowercase().starts_with("tcsh") {
                        cmd_shell_type = CmdShell::Tenex;
                    } else if cmd_shell_nm.to_lowercase().starts_with("pwsh") {
                        cmd_shell_type = CmdShell::PowerShellDotNet;
                    } else if cmd_shell_nm.to_lowercase().starts_with("powershell") {
                        cmd_shell_type = CmdShell::PowerShellExe;
                    } else if cmd_shell_nm.to_lowercase().starts_with("cmd") {
                        cmd_shell_type = CmdShell::WindowsCmd;
                    } else {
                        cmd_shell_type = CmdShell::Unknown;
                    }

                    // after we find our parent pid, stop seaching process list
                    break;
                } // end found our parent process ID
            } // end iteration of process list to find our parent

            if !found_parent_pid {
                return Err(SimpleError::new(
                    "Unable to find our parent process in the process list.",
                ));
            }

            // after we find my_pid, stop seaching process list
            break;
        } // end found our own process ID
    } // end iteration of process list to find our own process

    if !found_my_pid {
        return Err(SimpleError::new(
            "Unable to find our current process in the process list.",
        ));
    }

    Ok((cmd_shell_type, cmd_shell_nm))
}

/**
 * Get information about any daemon process that is running
 * for the current user ID.
 *
 * @returns A structure containing properties about the daemon process.
 *          It includes such information as:
 *          - Is a zowe daemon currently running?
 *          - Name of the process
 *          - Process ID
 *          - Command used to run the process
 */
pub fn proc_get_daemon_info() -> DaemonProcInfo {
    // get the pid if this user has an existing daemon
    let my_daemon_pid_opt: Option<Pid> = read_pid_for_user();

    // loop through the process list
    let mut sys = System::new_all();
    sys.refresh_all();
    for (next_pid, next_process) in sys.processes() {
        // is this a zowe daemon process?
        if next_process.name().to_lowercase().contains("node")
            && next_process.cmd().len() > 2
            && next_process.cmd()[1].to_lowercase().contains("zowe")
            && next_process.cmd()[2].to_lowercase() == LAUNCH_DAEMON_OPTION
        {
            // ensure we have found the daemon for the current user
            if my_daemon_pid_opt.is_some() && &my_daemon_pid_opt.unwrap() == next_pid {
                // convert the process's command line from a vector to a string
                let mut proc_cmd: String = String::new();
                for cmd_part in next_process.cmd() {
                    proc_cmd.push_str(cmd_part);
                    proc_cmd.push(' ');
                }

                // return the info for the daemon that belongs to the current user
                return DaemonProcInfo {
                    is_running: true,
                    name: next_process.name().to_string(),
                    pid: next_pid.to_string(),
                    cmd: proc_cmd,
                };
            }
        }
    }
    DaemonProcInfo {
        is_running: false,
        name: "no name".to_string(),
        pid: "no pid".to_string(),
        cmd: "no cmd".to_string(),
    }
}

/**
 * Read the process ID for a daemon running for the current user from
 * the pid file of the current user.
 *
 * @returns The Pid of the daemon for the current user.
 *          Returns None if no daemon is running for the user.
 */
fn read_pid_for_user() -> Option<sysinfo::Pid> {
    // form that path name for the daemon pid file
    let mut pid_file_path: PathBuf;
    match util_get_daemon_dir() {
        Ok(ok_val) => pid_file_path = ok_val,
        Err(_err_val) => {
            return None;
        }
    }
    pid_file_path.push("daemon_pid.json");

    if !pid_file_path.exists() {
        // A daemon pid file does not exist, but that is ok.
        return None;
    }

    // read in the pid file contents
    let pid_file: File = match File::open(&pid_file_path) {
        Ok(ok_val) => ok_val,
        Err(err_val) => {
            // we should not continue if we cannot open an existing pid file
            println!(
                "Unable to open file = {}\nDetails = {}",
                pid_file_path.display(),
                err_val
            );
            std::process::exit(EXIT_CODE_FILE_IO_ERROR);
        }
    };
    let pid_reader = BufReader::new(pid_file);
    let daemon_pid_for_user: DaemonPidForUser = match serde_json::from_reader(pid_reader) {
        Ok(ok_val) => ok_val,
        Err(err_val) => {
            // we should not continue if we cannot read an existing pid file
            println!(
                "Unable to read file = {}\nDetails = {}",
                pid_file_path.display(),
                err_val
            );
            std::process::exit(EXIT_CODE_FILE_IO_ERROR);
        }
    };

    let executor = util_get_username();

    if daemon_pid_for_user.user != executor {
        // our pid file should only contain our own user name
        println!(
            "User name of '{}' in file '{}' does not match current user = '{}'.",
            daemon_pid_for_user.user,
            pid_file_path.display(),
            executor
        );
        std::process::exit(EXIT_CODE_CANT_CONVERT_JSON);
    }
    Some(Pid::from_u32(daemon_pid_for_user.pid as u32))
}

/**
 * Start the zowe daemon.
 *
 * @param njs_zowe_path
 *      Full path to the NodeJS zowe command.
 *
 * @returns
 *      The command that was used to start the daemon (for display purposes).
 *
 * Here are alternate programming options for implementing this function that have been tried.
 *
 * On windows:
 *      If we run cmd with vec!["/C", njs_zowe_path, "--daemon", "&&", "exit"]
 *      we get no window, no color, and no escape characters.
 *      The 'exit' command hangs. You must type exit AND control-C, or
 *      click the X button on your original command window.
 *      When you do terminate your command window, the daemon automatically terminates.
 *
 *      If we run cmd with vec!["/C", "start", "", "/b", njs_zowe_path, "--daemon"];
 *      we get no window, no color, and no escape characters.
 *      The 'exit' command hangs. You must click the X button on your original command window.
 *      When you do terminate your command window, the daemon automatically terminates.
 *      Anything other than an empty title in the start command fails.
 *
 *      If we run cmd with vec!["/C", "start", "", "/MIN", njs_zowe_path, "--daemon"];
 *      we launch a minimized window on the task bar.
 *      CMD.exe and PowerShell show escape characters for color.
 *      All shells look fine in ConEmu.
 *      You must separately exit the daemon window.
 *      Anything other than an empty title in the start command fails.
 *
 *      If you use Stdio::inherit(), CMD and PowerShell show escape characters for color.
 *      If use use Stdio::null(), you get no color. Some commands still show color on windows,
 *      which produce escape characters. That is why we use the FORCE_COLOR=0 env variable on windows.
 *
 * On Linux:
 *      If you use Stdio::inherit(), you get double output. If use use Stdio::null(), you get no color.
 */

pub fn proc_start_daemon(njs_zowe_path: &str) -> String {
    println!("Starting a background process to increase performance ...");

    let daemon_arg = LAUNCH_DAEMON_OPTION;
    let mut cmd = Command::new(njs_zowe_path);
    
    // Uses creation flags from https://learn.microsoft.com/en-us/windows/win32/procthread/process-creation-flags
    // Flags are CREATE_NO_WINDOW, CREATE_NEW_PROCESS_GROUP, and CREATE_UNICODE_ENVIRONMENT
    #[cfg(target_family = "windows")]
    cmd.creation_flags(0x08000600);

    cmd.arg(daemon_arg)
       .stdout(Stdio::null())
       .stderr(Stdio::null());

    match cmd.spawn()
    {
        Ok(_unused) => { /* nothing to do */ }
        Err(error) => {
            println!(
                "Failed to start the following process:\n    {} {}",
                njs_zowe_path, daemon_arg
            );
            println!("Due to this error:\n    {}", error);
            std::process::exit(EXIT_CODE_CANNOT_START_DAEMON);
        }
    };

    // return the command that we run (for display purposes)
    let mut cmd_to_show: String = njs_zowe_path.to_owned();
    cmd_to_show.push(' ');
    cmd_to_show.push_str(daemon_arg);
    cmd_to_show
}
