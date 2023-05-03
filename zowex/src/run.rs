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

/* Functions that run Zowe commands in the various ways that
 * our executable accomplishes desired operations.
 */

use std::env;
use std::io;
use std::io::prelude::*;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;

use base64::encode;
use is_terminal::IsTerminal;

#[cfg(target_family = "windows")]
extern crate fslock;
#[cfg(target_family = "windows")]
extern crate home;
#[cfg(target_family = "windows")]
use {fslock::LockFile, std::fs::File};

// Zowe daemon executable modules
use crate::comm::*;
use crate::defs::*;
use crate::proc::*;
use crate::util::*;

/**
 * Run a Zowe command. Some commands are run directly, some launch
 * a Node.js zowe command (sometimes in the background), some communicate
 * the command to a running daemon which runs the command.
 *
 * @param zowe_cmd_args
 *      The user-supplied command line arguments.
 *      Each argument is in its own vector element.
 *
 * @returns
 *      A successful exit code in Result's Ok option.
 *      A failure exit code in the Result's Err option.
 */
pub async fn run_zowe_command(zowe_cmd_args: &mut Vec<String>) -> Result<i32, i32> {
    // we want to display our executable version
    if !zowe_cmd_args.is_empty() && zowe_cmd_args[0] == "--version-exe" {
        println!("{}", env!("CARGO_PKG_VERSION"));
        return Ok(EXIT_CODE_SUCCESS);
    }

    // many of our remaining functions need the path to our node.js Zowe script
    let njs_zowe_path = util_get_nodejs_zowe_path();

    // we want to restart the daemon
    if zowe_cmd_args.len() >= 2 && zowe_cmd_args[0] == "daemon" && zowe_cmd_args[1] == "restart" {
        return run_restart_command(&njs_zowe_path).await;
    }

    // These commands must be run by a background script.
    if zowe_cmd_args.len() >= 2
        && zowe_cmd_args[0] == "daemon"
        && (zowe_cmd_args[1] == "enable" || zowe_cmd_args[1] == "disable")
    {
        return run_delayed_zowe_command(&njs_zowe_path, zowe_cmd_args);
    }

    let run_result: Result<i32, i32> = if user_wants_daemon() {
        // send command to the daemon
        run_daemon_command(&njs_zowe_path, zowe_cmd_args).await
    } else {
        // user wants to run classic NodeJS zowe
        run_nodejs_command(&njs_zowe_path, zowe_cmd_args)
    };
    run_result
}

/**
 * Run our daemon restart command, which is actually two actions:
 * a shutdown request followed by starting a new daemon.
 *
 * @param njs_zowe_path
 *      Path to our Node.js zowe command.
 *
 * @returns
 *      Our error code when we fail to the NodeJS zowe.
 *      Otherwise, the exit code of the NodeJs zowe command.
 */
pub async fn run_restart_command(njs_zowe_path: &str) -> Result<i32, i32> {
    if proc_get_daemon_info().is_running {
        println!("Shutting down the running daemon ...");
        let mut restart_cmd_args: Vec<String> = vec![SHUTDOWN_REQUEST.to_string()];
        if let Err(err_val) = run_daemon_command(njs_zowe_path, &mut restart_cmd_args).await {
            println!("Unable to communicate a command to the Zowe daemon.");
            return Err(err_val);
        }
    }

    // Start a new daemon. Note that proc_start_daemon() exits on failure.
    proc_start_daemon(njs_zowe_path);
    println!("A new daemon has started.");
    Ok(EXIT_CODE_SUCCESS)
}

/**
 * Run the classic NodeJS zowe command.
 *
 * @param njs_zowe_path
 *      Path to our Node.js zowe command.
 *
 * @param zowe_cmd_args
 *      The user-supplied command line arguments to the zowe command.
 *
 * @returns
 *      Our error code when we fail to the NodeJS zowe.
 *      Otherwise, the exit code of the NodeJs zowe command.
 */
fn run_nodejs_command(njs_zowe_path: &str, zowe_cmd_args: &mut Vec<String>) -> Result<i32, i32> {
    // launch classic NodeJS zowe and wait for it to complete.
    let exit_code: i32 = match Command::new(njs_zowe_path)
        .args(zowe_cmd_args.to_owned())
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .output()
    {
        Ok(new_proc) => new_proc.status.code().unwrap(),
        Err(error) => {
            println!("Failed to run the following command:");
            println!(
                "    Program = {}\n    arguments = {:?}",
                njs_zowe_path, zowe_cmd_args
            );
            println!("Due to this error:\n    {}", error);
            EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD
        }
    };

    Ok(exit_code)
}

/**
 * Launch a zowe script in the background so that our EXE can exit before
 * the zowe node.js program (which we launch) writes (or deletes) our EXE.
 * On Windows We use ping to cause a delay since CMD.exe has no 'sleep'.
 *
 * When our EXE exits, the user will get a new prompt immediately, but the
 * background output will be displayed after that prompt.
 *
 * Under PowerShell, our script first displays some newlines to make some
 * space on the screen. When the user eventually presses ENTER, the prompt
 * will display in the space that we made. If the user presses ENTER enough
 * times, the prompts will overwrite the output of the background script.
 * That is harmless, but it is a little ugly. However, we have no means to
 * control this PowerShell behavior.
 *
 * @param zowe_cmd_args
 *      The user-supplied command line arguments to the zowe command.
 *
 * @param njs_zowe_path
 *      Path to our Node.js zowe command.
 *
 * @returns
 *      A successful exit code in Result's Ok option.
 *      A falure exit code in the Result's Err option.
 */
fn run_delayed_zowe_command(njs_zowe_path: &str, zowe_cmd_args: &[String]) -> Result<i32, i32> {
    // determine the command shell under which we are running
    let (curr_cmd_shell, cmd_shell_nm) = match proc_get_cmd_shell() {
        Ok((curr_cmd_shell, cmd_shell_nm)) => (curr_cmd_shell, cmd_shell_nm),
        Err(error) => {
            println!("{} Terminating.", error);
            return Err(EXIT_CODE_CANT_FIND_CMD_SHELL);
        }
    };
    if matches!(curr_cmd_shell, CmdShell::Unknown) {
        println!(
            "The command shell process named '{}' is unknown to the Zowe CLI. Terminating.",
            cmd_shell_nm
        );
        return Err(EXIT_CODE_UNKNOWN_CMD_SHELL);
    }

    /* Due to Rust variable lifetime requirements, these variables
     * must be declared here and passed into all lower functions.
     */
    let mut script_string: String = "".to_string();
    let mut script_arg_vec: Vec<&str> = vec![];

    // form the command script that we will launch
    let cmd_shell_to_launch: String = form_cmd_script_arg_vec(
        zowe_cmd_args,
        njs_zowe_path,
        &curr_cmd_shell,
        &mut script_string,
        &mut script_arg_vec,
    );

    // The following line gives useful debugging info when it is uncommented.
    // println!("script_arg_vec = {:?}", script_arg_vec);

    println!(
        "The '{}' command will run in the background ...",
        arg_vec_to_string(zowe_cmd_args)
    );
    let run_result: Result<i32, i32> = match Command::new(cmd_shell_to_launch)
        .args(script_arg_vec)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
    {
        Ok(..) => Ok(EXIT_CODE_SUCCESS),
        Err(err_val) => {
            println!("Failed to run the following command:");
            println!(
                "    cmd_shell_to_launch = {}\n    arguments = {:?}",
                njs_zowe_path, zowe_cmd_args
            );
            println!("Due to this error:\n    {}", err_val);
            Err(EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD)
        }
    };
    run_result
}

/**
 * Send a request to the daemon to run the zowe command.
 *
 * @param njs_zowe_path
 *      Path to our Node.js zowe command.
 *
 * @param zowe_cmd_args
 *      The user-supplied command line arguments.
 *      Each argument is in its own vector element.
 *
 * @returns
 *      An empty Result upon success. Otherwise an error Result.
 */
pub async fn run_daemon_command(
    njs_zowe_path: &str,
    zowe_cmd_args: &mut Vec<String>,
) -> Result<i32, i32> {
    let cwd: PathBuf = match env::current_dir() {
        Ok(ok_val) => ok_val,
        Err(err_val) => {
            println!("Unable to get current directory\nDetails = {:?}", err_val);
            return Err(EXIT_CODE_ENV_ERROR);
        }
    };

    let mut stdin = Vec::new();
    if !std::io::stdin().is_terminal() {
        if let Err(err_val) = io::stdin().read_to_end(&mut stdin) {
            println!("Failed reading stdin\nDetails = {}", err_val);
            return Err(EXIT_CODE_COMM_IO_ERROR);
        }
    }

    let executor = util_get_username();

    // create the response structure for this message
    let response: DaemonResponse =
        if !zowe_cmd_args.is_empty() && zowe_cmd_args[0] == SHUTDOWN_REQUEST {
            // Sending Control-C shutdown request
            let control_c: String = "\x03".to_string();
            DaemonResponse {
                argv: None,
                cwd: None,
                env: None,
                stdinLength: Some(0),
                stdin: Some(control_c),
                user: Some(encode(executor)),
            }
        } else {
            DaemonResponse {
                argv: Some(zowe_cmd_args.to_vec()),
                cwd: Some(cwd.into_os_string().into_string().unwrap()),
                env: Some(util_get_zowe_env()),
                stdinLength: Some(stdin.len() as i32),
                stdin: None,
                user: Some(encode(executor)),
            }
        };

    let mut _resp: Vec<u8>;
    match serde_json::to_vec(&response) {
        Ok(ok_val) => {
            _resp = ok_val;
            if response.stdinLength.unwrap() > 0 {
                _resp.push(b'\x0c');
                _resp.append(&mut stdin);
            }
        }
        Err(err_val) => {
            println!("Failed convert response to JSON\nDetails = {}", err_val);
            return Err(EXIT_CODE_CANT_CONVERT_JSON);
        }
    }

    let mut tries = 0;
    let socket_string: String = match util_get_socket_string() {
        Ok(ok_val) => ok_val,
        Err(err_val) => return Err(err_val),
    };

    #[cfg(target_family = "windows")]
    let mut lock_file = get_win_lock_file()?;

    #[cfg(target_family = "windows")]
    let mut locked = false;
    loop {
        #[cfg(target_family = "windows")]
        if !locked {
            match lock_file.try_lock() {
                Ok(result) if !result => {
                    if tries > THREE_MIN_OF_RETRIES {
                        println!(
                            "Terminating after {} connection retries.",
                            THREE_MIN_OF_RETRIES
                        );
                        return Err(EXIT_CODE_TIMEOUT_CONNECT_TO_RUNNING_DAEMON);
                    }

                    tries += 1;
                    println!(
                        "The Zowe daemon is in use, retrying ({} of {})",
                        tries, THREE_MIN_OF_RETRIES
                    );

                    // pause between attempts to connect
                    thread::sleep(Duration::from_secs(THREE_SEC_DELAY));
                    continue;
                }
                Ok(_result) => {
                    locked = true;
                }
                Err(ref e) => {
                    println!("Problem acquiring lock: {:?}", e);
                    return Err(EXIT_CODE_CANNOT_ACQUIRE_LOCK);
                }
            }
        }

        let mut stream;
        match comm_establish_connection(njs_zowe_path, &socket_string).await {
            Ok(ok_val) => stream = ok_val,
            Err(err_val) => {
                println!(
                    "Unable to establish communication with daemon.\nDetails = {}",
                    err_val
                );
                return Err(EXIT_CODE_COMM_IO_ERROR);
            }
        }

        match comm_talk(&_resp, &mut stream).await {
            Ok(ok_val) => {
                return Ok(ok_val);
            }
            Err(ref err_val) => {
                if err_val.kind() == io::ErrorKind::ConnectionReset {
                    if tries > THREE_MIN_OF_RETRIES {
                        println!(
                            "Terminating after {} connection retries.",
                            THREE_MIN_OF_RETRIES
                        );
                        return Err(EXIT_CODE_TIMEOUT_CONNECT_TO_RUNNING_DAEMON);
                    }

                    tries += 1;
                    println!(
                        "The Zowe daemon is in use, retrying ({} of {})",
                        tries, THREE_MIN_OF_RETRIES
                    );

                    // pause between attempts to connect
                    thread::sleep(Duration::from_secs(THREE_SEC_DELAY));
                } else {
                    println!(
                        "I/O error during daemon communication.\nDetails = {}",
                        err_val
                    );
                    return Err(EXIT_CODE_COMM_IO_ERROR);
                }
            }
        }
    }
}

/**
 * Convert a vector of command line arguments into a single string of arguments.
 * @param arg_vec
 *      The user-supplied command line arguments.
 *      Each argument is in its own vector element.
 * @returns
 *      A String containing all of the command line arguments.
 */
fn arg_vec_to_string(arg_vec: &[String]) -> String {
    let mut arg_string = String::new();
    let mut arg_count = 1;
    for next_arg in arg_vec.iter() {
        if arg_count > 1 {
            arg_string.push(' ');
        }

        /* An argument that contains a space, or is an empty string, must be
         * enclosed in double quotes when it is placed into a single argument
         * string.
         */
        if next_arg.contains(' ') || next_arg.is_empty() {
            arg_string.push('"');
            arg_string.push_str(next_arg);
            arg_string.push('"');
        } else {
            arg_string.push_str(next_arg);
        }

        arg_count += 1;
    }

    arg_string
}

/**
 * Form the argument vector required to launch deamon enable and disable commands.
 *
 * @param zowe_cmd_args
 *      The user-supplied command line arguments to the zowe command.
 *
 * @param njs_zowe_path
 *      Path to our Node.js zowe command.
 *
 * @param curr_cmd_shell
 *      The current command shell under which we are running.
 *
 * @param script_string
 *      A string into which we can place all of the command names and parameters.
 *
 * @param script_arg_vec
 *      An empty vector into which we place command script arguments.
 *
 * @returns The command shell program that we will launch in the
 *          background to run our script.
 */
fn form_cmd_script_arg_vec<'a>(
    zowe_cmd_args: &'a [String],
    njs_zowe_path: &'a str,
    curr_cmd_shell: &CmdShell,
    script_string: &'a mut String,
    script_arg_vec: &mut Vec<&'a str>,
) -> String {
    const SCRIPT_WAIT_MSG: &str = "echo Wait to see the results below ... ";
    const SCRIPT_PROMPT_MSG_FIXED: &str = "echo Now press ENTER to see your command ";

    if env::consts::OS == "windows" {
        return form_win_cmd_script_arg_vec(
            zowe_cmd_args,
            njs_zowe_path,
            curr_cmd_shell,
            SCRIPT_WAIT_MSG,
            SCRIPT_PROMPT_MSG_FIXED,
            script_arg_vec,
        );
    }

    form_bash_cmd_script_arg_vec(
        zowe_cmd_args,
        njs_zowe_path,
        script_string,
        SCRIPT_WAIT_MSG,
        SCRIPT_PROMPT_MSG_FIXED,
        script_arg_vec,
    )
}

/**
 * Form the argument vector required to launch deamon enable and disable commands
 * on Bash systems (Linux and MacOs). For Bash, all items on the script's command
 * line (after the "-c" flag) go into one script_arg_vec argument.
 *
 * @param zowe_cmd_args
 *      The user-supplied command line arguments to the zowe command.
 *
 * @param njs_zowe_path
 *      Path to our Node.js zowe command.
 *
 * @param script_string
 *      A string into which we can place all of the command names and parameters.
 *
 * @param script_wait_msg
 *      A text message telling the user to wait for our background process.
 *
 * @param script_prompt_msg_fixed
 *      The fixed part of text message telling the user to press ENTER to get a prompt.
 *
 * @param script_arg_vec
 *      An empty vector into which we place command script arguments.
 *
 * @returns The command shell program that we will launch in the
 *          background to run our script.
 */
fn form_bash_cmd_script_arg_vec<'a>(
    zowe_cmd_args: &'a [String],
    njs_zowe_path: &'a str,
    script_string: &'a mut String,
    script_wait_msg: &'a str,
    script_prompt_msg_fixed: &'a str,
    script_arg_vec: &mut Vec<&'a str>,
) -> String {
    // -c goes into the first argument
    script_arg_vec.push("-c");

    // all remaining commands and parameters go into a big string.
    script_string.push_str("echo \"\" && ");

    // make script delay so the EXE can exit
    script_string.push_str(script_wait_msg);
    script_string.push_str(" && sleep 1 && ");

    // add our Zowe command
    script_string.push_str(njs_zowe_path);
    for next_arg in zowe_cmd_args {
        script_string.push(' ');
        script_string.push_str(next_arg);
    }
    script_string.push_str(" ; ");

    // add a message after the script is done
    script_string.push_str(script_prompt_msg_fixed);
    script_string.push_str("prompt.");

    // put our big string into the second script argument
    script_arg_vec.push(script_string);

    // return the shell program that we will launch
    "bash".to_string()
}

/**
 * Form the argument vector required to launch deamon enable and disable commands
 * on Windows. For Windows, each space-separated item on the script's command
 * line goes into a separate script_arg_vec element.
 *
 * @param zowe_cmd_args
 *      The user-supplied command line arguments to the zowe command.
 *
 * @param njs_zowe_path
 *      Path to our Node.js zowe command.
 *
 * @param curr_cmd_shell
 *      The current command shell under which we are running.
 *
 * @param script_wait_msg
 *      A text message telling the user to wait for our background process.
 *
 * @param script_prompt_msg_fixed
 *      The fixed part of text message telling the user to press ENTER to get a prompt.
 *
 * @param script_arg_vec
 *      An empty vector into which we place command script arguments.
 *
 * @returns The command shell program that we will launch in the
 *          background to run our script.
 */
fn form_win_cmd_script_arg_vec<'a>(
    zowe_cmd_args: &'a [String],
    njs_zowe_path: &'a str,
    curr_cmd_shell: &CmdShell,
    script_wait_msg: &'a str,
    script_prompt_msg_fixed: &'a str,
    script_arg_vec: &mut Vec<&'a str>,
) -> String {
    // add any required newlines to create some space
    script_arg_vec.push("/C");
    script_arg_vec.push("echo.");
    script_arg_vec.push("&&");

    if matches!(
        curr_cmd_shell,
        CmdShell::PowerShellDotNet | CmdShell::PowerShellExe
    ) {
        // PowerShell needs extra newlines before the background process output to create space
        for _count in [1, 2, 3, 4, 5, 6] {
            script_arg_vec.push("echo.");
            script_arg_vec.push("&&");
        }
    } else if matches!(curr_cmd_shell, CmdShell::Bash | CmdShell::Sh) {
        // Bash shell on windows needs a delay and a newline in its spacing
        for next_arg in "sleep 1 && echo. &&".split_whitespace() {
            script_arg_vec.push(next_arg);
        }
    }

    // add our wait message
    for next_arg in script_wait_msg.split_whitespace() {
        script_arg_vec.push(next_arg);
    }
    script_arg_vec.push("&&");

    // make script delay so the EXE can exit
    for next_arg in "ping 127.0.0.1 -n 1 >nul &&".split_whitespace() {
        script_arg_vec.push(next_arg);
    }

    // add our Zowe command to the script
    script_arg_vec.push(njs_zowe_path);
    for next_arg in zowe_cmd_args {
        script_arg_vec.push(next_arg);
    }
    script_arg_vec.push("&");

    // add a message after the script is done
    for next_arg in script_prompt_msg_fixed.split_whitespace() {
        script_arg_vec.push(next_arg);
    }
    if matches!(
        curr_cmd_shell,
        CmdShell::PowerShellDotNet | CmdShell::PowerShellExe
    ) {
        // tell user that prompt will appear in the provided space
        for next_arg in "prompt in the space above.".split_whitespace() {
            script_arg_vec.push(next_arg);
        }
    } else {
        script_arg_vec.push("prompt.");
    }

    // return the shell program that we will launch
    "CMD".to_string()
}

#[cfg(target_family = "windows")]
fn get_win_lock_file() -> Result<LockFile, i32> {
    let mut lock_path: PathBuf;
    match util_get_daemon_dir() {
        Ok(ok_val) => lock_path = ok_val,
        Err(err_val) => return Err(err_val),
    }
    lock_path.push("daemon.lock");

    if let Err(err_val) = File::create(&lock_path) {
        println!(
            "Unable to create zowe daemon lock file = {}.",
            &lock_path.display()
        );
        println!("Reason = {}.", err_val);
        return Err(EXIT_CODE_FILE_IO_ERROR);
    }
    let lock_file: LockFile = match LockFile::open(&lock_path) {
        Ok(ok_val) => ok_val,
        Err(err_val) => {
            println!(
                "Unable to open zowe daemon lock file = {}.",
                &lock_path.display()
            );
            println!("Reason = {}.", err_val);
            return Err(EXIT_CODE_FILE_IO_ERROR);
        }
    };
    Ok(lock_file)
}

/**
 * Should we use daemon mode? The user controls this with an environment variable.
 * @returns true or false.
 */
fn user_wants_daemon() -> bool {
    const DAEMON_ENV_VAR_NM: &str = "ZOWE_USE_DAEMON";
    let env_var_val = match env::var(DAEMON_ENV_VAR_NM) {
        Ok(val) => val,
        Err(_e) => "NoDaemon".to_string(),
    };

    if env_var_val.to_lowercase() == "false"
        || env_var_val.to_lowercase() == "no"
        || env_var_val == "0"
    {
        return false;
    }
    true
}
