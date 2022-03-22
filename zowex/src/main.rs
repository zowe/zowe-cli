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

use std::collections::HashMap;
use std::env;
use std::io;
use std::io::BufReader;
use std::io::prelude::*;
use std::process::{Command, Stdio};
use std::str;
use std::thread;
use std::time::Duration;

extern crate atty;
use atty::Stream;

extern crate base64;
use base64::encode;

extern crate home;
use home::home_dir;

extern crate pathsearch;
use pathsearch::PathSearcher;

extern crate rpassword;
use rpassword::read_password;

extern crate serde;
use serde::{Deserialize, Serialize};

extern crate sysinfo;
use sysinfo::{PidExt, Pid, ProcessExt, System, SystemExt};

extern crate whoami;
use whoami::username;

extern crate simple_error;
use simple_error::SimpleError;

#[cfg(target_family = "unix")]
use std::net::Shutdown;
#[cfg(target_family = "unix")]
use std::os::unix::net::UnixStream;

#[cfg(target_family = "windows")]
extern crate named_pipe;
#[cfg(target_family = "windows")]
use named_pipe::PipeClient;
#[cfg(target_family = "windows")]
extern crate fslock;
#[cfg(target_family = "windows")]
use fslock::LockFile;
#[cfg(target_family = "windows")]
use std::fs::File;

const EXIT_CODE_SUCCESS: i32 = 0;
const EXIT_CODE_CANNOT_CONNECT_TO_RUNNING_DAEMON: i32 = 100;
const EXIT_CODE_CANNOT_GET_MY_PATH: i32 = 101;
const EXIT_CODE_NO_NODEJS_ZOWE_ON_PATH: i32 = 102;
const EXIT_CODE_CANNOT_START_DAEMON: i32 = 103;
const EXIT_CODE_TIMEOUT_CONNECT_TO_RUNNING_DAEMON: i32 = 104;
const EXIT_CODE_DAEMON_NOT_RUNNING_AFTER_START: i32 = 105;
const EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD: i32 = 106;
const EXIT_CODE_CANT_FIND_CMD_SHELL: i32 = 107;
const EXIT_CODE_UNKNOWN_CMD_SHELL: i32 = 108;
#[cfg(target_family = "windows")]
const EXIT_CODE_CANNOT_FIND_LOCK: i32 = 109;
#[cfg(target_family = "windows")]
const EXIT_CODE_CANNOT_ACQUIRE_LOCK: i32 = 110;
const EXIT_CODE_COMM_IO_ERROR: i32 = 111;
const EXIT_CODE_ENV_ERROR: i32 = 112;
const EXIT_CODE_CANT_CONVERT_JSON: i32 = 113;

struct DaemonProcInfo {
    is_running: bool,
    name: String,
    pid: String,
    cmd: String,
}

#[derive(Deserialize)]
#[allow(non_snake_case)]
struct DaemonRequest {
    stdout: Option<String>,
    stderr: Option<String>,
    exitCode: Option<i32>,
    progress: Option<bool>,
    prompt: Option<String>,
    securePrompt: Option<String>,
}

#[derive(Serialize)]
#[allow(non_snake_case)]
struct DaemonResponse {
    argv: Option<Vec<String>>,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
    stdinLength: Option<i32>,
    stdin: Option<String>,
    user: Option<String>,
}

enum CmdShell {
    Bash,               // Bourne Again SHell
    Sh,                 // Standard Linux shell
    Korn,               // Korn shell
    Zshell,             // Z shell
    Cshell,             // C shell
    Tenex,              // TENEX C shell
    PowerShellDotNet,   // Newer cross-platform .NET Core PowerShell
    PowerShellExe,      // Legacy Windows executable PowerShell (version 5.x)
    WindowsCmd,         // Classic Windows CMD shell
    Unknown             // A command shell that we do not yet understand
}

const SHUTDOWN_REQUEST: &str = "shutdown";
const LAUNCH_DAEMON_OPTION: &str = "--daemon";

const THREE_SEC_DELAY: u64 = 3;
const THREE_MIN_OF_RETRIES: i32 = 60;

// TODO(Kelosky): performance tests, `time for i in {1..10}; do zowe -h >/dev/null; done`
// 0.8225 zowex vs 1.6961 zowe average over 10 run sample = .8736 sec faster on linux

// PS C:\Users\...\Desktop> 1..10 | ForEach-Object {
//     >>     Measure-Command {
//     >>         zowex -h
//     >>     }
//     >> } | Measure-Object -Property TotalSeconds -Average
// 3.6393932 and 0.76156812 zowe average over 10 run sample = 2.87782508 sec faster on windows

fn main() -> io::Result<()> {
    // turn args into vector
    let mut cmd_line_args: Vec<String> = env::args().collect();

    cmd_line_args.drain(..1); // remove first (exe name)

    /* Run the desired command.
     * The Ok branch represents when we successfully run a command, and that
     * command succeeds, or the command fails and "successfully" returns a
     * failure exit code. Alternatively, our Err branch represents when we
     * fail to run the command.
     */
    let exit_code: i32;
    match run_zowe_command(&mut cmd_line_args) {
        Ok(ok_val) => exit_code = ok_val,
        Err(err_val) => exit_code = err_val
    }

    /* Rust does not enable main() to return an exit code.
     * Thus, we explicitly exit the process with our desired exit code.
     */
    std::process::exit(exit_code);
}

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
fn run_zowe_command(zowe_cmd_args: &mut Vec<String>) -> Result<i32, i32> {
    // we want to display our executable version
    if !zowe_cmd_args.is_empty() && zowe_cmd_args[0] == "--version-exe" {
        println!("{}", env!("CARGO_PKG_VERSION"));
        return Ok(EXIT_CODE_SUCCESS);
    }

    // many of our remaining functions need the path to our node.js Zowe script
    let njs_zowe_path = get_nodejs_zowe_path();

    // we want to restart the daemon
    if zowe_cmd_args.len() >= 2 && zowe_cmd_args[0] == "daemon" && zowe_cmd_args[1] == "restart" {
        return run_restart_command(&njs_zowe_path);
    }

    // These commands must be run by a background script.
    if zowe_cmd_args.len() >= 2       &&
       zowe_cmd_args[0]  == "daemon"  &&
       (zowe_cmd_args[1] == "enable"  ||  zowe_cmd_args[1] == "disable")
    {
        return run_delayed_zowe_command(&njs_zowe_path, zowe_cmd_args);
    }

    let run_result: Result<i32, i32>;
    if user_wants_daemon() {
        // send command to the daemon
        run_result = run_daemon_command(&njs_zowe_path, zowe_cmd_args);
    } else {
        // user wants to run classic NodeJS zowe
        run_result = run_nodejs_command(&njs_zowe_path, zowe_cmd_args);
    }
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
fn run_restart_command(njs_zowe_path: &str) -> Result<i32, i32> {
    if get_daemon_process_info().is_running {
        println!("Shutting down the running daemon ...");
        let mut restart_cmd_args: Vec<String> = vec![SHUTDOWN_REQUEST.to_string()];
        if let Err(err_val) = run_daemon_command(njs_zowe_path, &mut restart_cmd_args) {
            println!("Unable to communicate a command to the Zowe daemon.");
            return Err(err_val);
        }
    }

    // Start a new daemon. Note that start_daemon() exits on failure.
    start_daemon(njs_zowe_path);
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
    let exit_code: i32;
    match Command::new(njs_zowe_path.to_owned())
        .args(zowe_cmd_args.to_owned())
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .output()
    {
        Ok(new_proc) => {
            exit_code = new_proc.status.code().unwrap();
        }
        Err(error) => {
            println!("Failed to run the following command:");
            println!(
                "    Program = {}\n    arguments = {:?}",
                njs_zowe_path, zowe_cmd_args
            );
            println!("Due to this error:\n    {}", error);
            exit_code = EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD;
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
    let (curr_cmd_shell, cmd_shell_nm) = match get_cmd_shell() {
        Ok((curr_cmd_shell, cmd_shell_nm)) => (curr_cmd_shell, cmd_shell_nm),
        Err(error) => {
            println!("{} Terminating.", error);
            return Err(EXIT_CODE_CANT_FIND_CMD_SHELL);
        }

    };
    if matches!(curr_cmd_shell, CmdShell::Unknown) {
        println!("The command shell process named '{}' is unknown to the Zowe CLI. Terminating.", cmd_shell_nm);
        return Err(EXIT_CODE_UNKNOWN_CMD_SHELL);
    }

    /* Due to Rust variable lifetime requirements, these variables
     * must be declared here and passed into all lower functions.
     */
    let mut script_string: String = "".to_string();
    let mut script_arg_vec: Vec<&str> = vec![];

    // form the command script that we will launch
    let cmd_shell_to_launch: String = form_cmd_script_arg_vec(
        zowe_cmd_args, njs_zowe_path, & curr_cmd_shell,
        &mut script_string, &mut script_arg_vec
    );

    // The following line gives useful debugging info when it is uncommented.
    // println!("script_arg_vec = {:?}", script_arg_vec);

    println!("The '{}' command will run in the background ...", arg_vec_to_string(zowe_cmd_args));
    let run_result: Result<i32, i32>;
    match Command::new(cmd_shell_to_launch)
        .args(script_arg_vec)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
    {
        Ok(..) => {
            run_result = Ok(EXIT_CODE_SUCCESS);
        }
        Err(err_val) => {
            println!("Failed to run the following command:");
            println!(
                "    cmd_shell_to_launch = {}\n    arguments = {:?}",
                njs_zowe_path, zowe_cmd_args
            );
            println!("Due to this error:\n    {}", err_val);
            run_result = Err(EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD);
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

fn run_daemon_command(njs_zowe_path: &str, zowe_cmd_args: &mut Vec<String>) -> Result<i32, i32> {
    let cwd: std::path::PathBuf;
    match env::current_dir() {
        Ok(ok_val) => cwd = ok_val,
        Err(err_val) => {
            println!("Unable to get current directory\nDetails = {:?}", err_val);
            return Err(EXIT_CODE_ENV_ERROR);
        }
    }

    let mut stdin = Vec::new();
    if !atty::is(Stream::Stdin) {
        if let Err(err_val) = io::stdin().read_to_end(&mut stdin) {
            println!("Failed reading stdin\nDetails = {}", err_val);
            return Err(EXIT_CODE_COMM_IO_ERROR);
        }
    }

    // create the response structure for this message
    let response: DaemonResponse;
    if !zowe_cmd_args.is_empty()  &&  zowe_cmd_args[0] == SHUTDOWN_REQUEST {
        // Sending Control-C shutdown request
        let control_c: String = "\x03".to_string();
        response = DaemonResponse {
            argv: None,
            cwd: None,
            env: None,
            stdinLength: Some(0),
            stdin: Some(control_c),
            user: Some(encode(username())),
        };
    } else {
        response = DaemonResponse {
            argv: Some(zowe_cmd_args.to_vec()),
            cwd: Some(cwd.into_os_string().into_string().unwrap()),
            env: Some(get_zowe_env()),
            stdinLength: Some(stdin.len() as i32),
            stdin: None,
            user: Some(encode(username())),
        };
    }

    let mut _resp: Vec<u8>;
    match serde_json::to_vec(&response) {
        Ok(ok_val) => {
            _resp = ok_val;
            if response.stdinLength.unwrap() > 0 {
                _resp.push(b'\x0c');
                _resp.append(&mut stdin);
            }
        },
        Err(err_val) => {
            println!("Failed convert response to JSON\nDetails = {}", err_val);
            return Err(EXIT_CODE_CANT_CONVERT_JSON);
        }
    }

    let mut tries = 0;
    let socket_string = get_socket_string();
    #[cfg(target_family = "windows")]
    let mut lock_file;
    #[cfg(target_family = "windows")]
    match get_lock_file() {
        Ok(result) => { lock_file = result; },
        Err(err_val) => {
            println!("Could not find or create the lock file. Check your ZOWE_DAEMON_LOCK variable.\nDetails = {}", err_val);
            return Err(EXIT_CODE_CANNOT_FIND_LOCK);
        }
    }
    #[cfg(target_family = "windows")]
    let mut locked = false;
    loop {
        #[cfg(target_family = "windows")]
        if !locked {
            match lock_file.try_lock() {
                Ok(result) if !result => {
                    if tries > THREE_MIN_OF_RETRIES {
                        println!("Terminating after {} connection retries.", THREE_MIN_OF_RETRIES);
                        return Err(EXIT_CODE_TIMEOUT_CONNECT_TO_RUNNING_DAEMON);
                    }

                    tries += 1;
                    println!("The Zowe daemon is in use, retrying ({} of {})", tries, THREE_MIN_OF_RETRIES);

                    // pause between attempts to connect
                    thread::sleep(Duration::from_secs(THREE_SEC_DELAY));
                    continue;
                },
                Ok(_result) => { locked = true; },
                Err (ref e) => {
                    println!("Problem acquiring lock: {:?}", e);
                    return Err(EXIT_CODE_CANNOT_ACQUIRE_LOCK);
                }
            }
        }

        let mut stream;
        match establish_connection(njs_zowe_path, &socket_string) {
            Ok(ok_val) => stream = ok_val,
            Err(err_val) => {
                println!("Unable to establish communication with daemon.\nDetails = {}", err_val);
                return Err(EXIT_CODE_COMM_IO_ERROR);
            }
        }

        match talk(&_resp, &mut stream) {
            Ok(ok_val) => {
                return Ok(ok_val);
            },
            Err(ref err_val) => {
                if err_val.kind() == io::ErrorKind::ConnectionReset {
                    if tries > THREE_MIN_OF_RETRIES {
                        println!("Terminating after {} connection retries.", THREE_MIN_OF_RETRIES);
                        return Err(EXIT_CODE_TIMEOUT_CONNECT_TO_RUNNING_DAEMON);
                    }

                    tries += 1;
                    println!("The Zowe daemon is in use, retrying ({} of {})", tries, THREE_MIN_OF_RETRIES);

                    // pause between attempts to connect
                    thread::sleep(Duration::from_secs(THREE_SEC_DELAY));
                } else {
                    println!("I/O error during daemon communication.\nDetails = {}", err_val);
                    return Err(EXIT_CODE_COMM_IO_ERROR);
                }
            }
        }
    }
}

#[cfg(target_family = "unix")]
type DaemonClient = UnixStream;

#[cfg(target_family = "windows")]
type DaemonClient = PipeClient;

/**
 * Attempt to make a TCP connection to the daemon.
 * Iterate to enable a slow system to start the daemon.
 *
 * @param njs_zowe_path
 *      Path to our Node.js zowe command.
 *
 * @param daemon_socket
 *      The communication channel with which we talk to the daemon.
 *
 * @returns
 *      A Result containing a stream upon success.
 *      This function exits the process upon error.
 */
fn establish_connection(njs_zowe_path: &str, daemon_socket: &str) -> io::Result<DaemonClient> {
    const RETRY_TO_SHOW_DIAG: i32 = 5;

    let mut conn_retries = 0;
    let mut we_started_daemon = false;
    let mut cmd_to_show: String = String::new();

    let stream = loop {
        let conn_result = DaemonClient::connect(&daemon_socket);
        if let Ok(good_stream) = conn_result {
            // We made our connection. Break with the actual stream value
            break good_stream;
        }

        // determine if daemon is running
        let daemon_proc_info = get_daemon_process_info();

        // when not running, start it.
        if !daemon_proc_info.is_running {
            if conn_retries == 0 {
                // start the daemon and continue trying to connect
                we_started_daemon = true;
                cmd_to_show = start_daemon(njs_zowe_path);
            } else if we_started_daemon {
                println!("The Zowe daemon that we started is not running on socket: {}.",
                    daemon_socket
                );
                println!(
                    "Command used to start the Zowe daemon was:\n    {}\nTerminating.",
                    cmd_to_show
                );
                std::process::exit(EXIT_CODE_DAEMON_NOT_RUNNING_AFTER_START);
            }
        }

        if conn_retries > THREE_MIN_OF_RETRIES {
            println!("Terminating after {} connection retries.", THREE_MIN_OF_RETRIES);
            std::process::exit(EXIT_CODE_CANNOT_CONNECT_TO_RUNNING_DAEMON);
        }

        // pause between attempts to connect
        thread::sleep(Duration::from_secs(THREE_SEC_DELAY));

        // before we wait too long, show diagnostics
        if conn_retries == RETRY_TO_SHOW_DIAG {
            println!("\nThe Zowe daemon was started with these options:");
            if we_started_daemon {
                println!("Command = {}", cmd_to_show);
            } else {
                println!("Command = {}", daemon_proc_info.cmd);
            }
            println!("Process name = {}  pid = {}  socket = {}\n",
                daemon_proc_info.name, daemon_proc_info.pid, daemon_socket
            );
        }

        let retry_msg;
        if we_started_daemon {
            retry_msg = "Waiting for the Zowe daemon to start";
        } else {
            retry_msg = "Attempting to connect to the Zowe daemon";
        }
        if conn_retries > 0 {
            println!("{} ({} of {})", retry_msg, conn_retries, THREE_MIN_OF_RETRIES);
        }
        conn_retries += 1;
    };

    Ok(stream)
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
fn start_daemon(njs_zowe_path: &str) -> String {
    println!("Starting a background process to increase performance ...");

    if env::consts::OS == "windows" {
        /* Windows CMD and Powershell terminal windows show escape characters
         * instead of colors in daemon-mode. A more elegant solution may exist,
         * but for now we just turn off color in daemon mode on Windows.
         */
        env::set_var("FORCE_COLOR", "0");
    }

    let daemon_arg = LAUNCH_DAEMON_OPTION;
    match Command::new(njs_zowe_path.to_owned())
        .arg(daemon_arg)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
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

/**
 * Send a request to the server and optionally read a response.
 *
 * @param message
 *      A reference to a JSON [u8] buffer containing the request.
 *
 * @param stream
 *      A stream over which we perform our communication to the server.
 *
 * @returns
 *      On success, a Result containing the exit code of the command
 *      run by the daemon.
 *      On failure, an error result.
 */
fn talk(message: &[u8], stream: &mut DaemonClient) -> io::Result<i32> {
    /*
     * Send the command line arguments to the daemon and await responses.
     */
    // write request to daemon
    stream.write_all(message)?;

    #[cfg(target_family = "unix")]
    let mut writer = stream.try_clone().expect("clone failed");
    #[cfg(target_family = "unix")]
    let mut reader = BufReader::new(&*stream);
    #[cfg(target_family = "windows")]
    let mut reader = BufReader::new(stream);

    let mut exit_code = EXIT_CODE_SUCCESS;
    let mut _progress = false;

    loop {
        let mut reply: Option<String> = None;
        let mut u_payload: Vec<u8> = Vec::new();
        let payload: String;

        // read until form feed (\f)
        match reader.read_until(0xC, &mut u_payload) {
            Ok(size) => {
                if size > 0 {
                    // remove form feed and convert to a string
                    u_payload.pop(); // remove the 0xC
                    payload = str::from_utf8(&u_payload).unwrap().to_string();

                    let p: DaemonRequest;
                    match serde_json::from_str(&payload) {
                        Err(_e) if _progress => {
                            if atty::is(Stream::Stderr) {
                                eprint!("{}", payload);
                                io::stderr().flush().unwrap();
                            }
                            continue;
                        },
                        result => {
                            match result {
                                Ok(ok_val) => {
                                    p = ok_val;
                                },
                                Err(err_val) => {
                                    eprintln!("You may be running mismatched versions of Zowe executable and Zowe daemon.");
                                    return Err(std::io::Error::new(std::io::ErrorKind::Other, err_val))
                                }
                            }
                        }
                    };

                    if let Some(s) = p.stdout {
                        print!("{}", s);
                        io::stdout().flush().unwrap();
                    }

                    if let Some(s) = p.stderr {
                        eprint!("{}", s);
                        io::stderr().flush().unwrap();
                    }

                    if let Some(s) = p.prompt {
                        print!("{}", s);
                        io::stdout().flush().unwrap();
                        let mut input = String::new();
                        io::stdin().read_line(&mut input).unwrap();
                        reply = Some(input);
                    }

                    if let Some(s) = p.securePrompt {
                        print!("{}", s);
                        io::stdout().flush().unwrap();
                        reply = Some(read_password().unwrap());
                    }

                    if let Some(s) = reply {
                        let response: DaemonResponse = DaemonResponse {
                            argv: None,
                            cwd: None,
                            env: None,
                            stdinLength: None,
                            stdin: Some(s),
                            user: Some(encode(username())),
                        };
                        let v = serde_json::to_string(&response)?;
                        #[cfg(target_family = "unix")]
                        writer.write_all(v.as_bytes())?;
                        #[cfg(target_family = "windows")]
                        reader.get_mut().write_all(v.as_bytes())?;
                    }

                    exit_code = p.exitCode.unwrap_or(EXIT_CODE_SUCCESS);
                    _progress = p.progress.unwrap_or(false);
                } else {
                    // end of reading
                    break;
                }
            },
            Err(err_val) => { return Err(err_val) }
        } // end match on read
    } // end loop

    // Terminate connection. Ignore NotConnected errors returned on macOS.
    // https://doc.rust-lang.org/std/net/struct.TcpStream.html#method.shutdown
    #[cfg(target_family = "unix")]
    match stream.shutdown(Shutdown::Read) {
        Err(ref e) if e.kind() == io::ErrorKind::NotConnected => (),
        result => result?,
    }
    #[cfg(target_family = "unix")]
    match stream.shutdown(Shutdown::Write) {
        Err(ref e) if e.kind() == io::ErrorKind::NotConnected => (),
        result => result?,
    }

    // return the exit code of the command exucuted by the daemon
    Ok(exit_code)
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
    curr_cmd_shell: & CmdShell,
    script_string: &'a mut String,
    script_arg_vec: &mut Vec<&'a str>
) -> String {
    const SCRIPT_WAIT_MSG: &str = "echo Wait to see the results below ... ";
    const SCRIPT_PROMPT_MSG_FIXED: &str = "echo Now press ENTER to see your command ";

    if env::consts::OS == "windows"
    {
        return form_win_cmd_script_arg_vec(
            zowe_cmd_args, njs_zowe_path, curr_cmd_shell,
            SCRIPT_WAIT_MSG, SCRIPT_PROMPT_MSG_FIXED,
            script_arg_vec
        );
    }

    form_bash_cmd_script_arg_vec(
        zowe_cmd_args, njs_zowe_path, script_string,
        SCRIPT_WAIT_MSG, SCRIPT_PROMPT_MSG_FIXED,
        script_arg_vec
    )
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
    curr_cmd_shell: & CmdShell,
    script_wait_msg: &'a str,
    script_prompt_msg_fixed: &'a str,
    script_arg_vec: &mut Vec<&'a str>
) -> String {
    // add any required newlines to create some space
    script_arg_vec.push("/C");
    script_arg_vec.push("echo.");
    script_arg_vec.push("&&");

    if matches!(curr_cmd_shell, CmdShell::PowerShellDotNet | CmdShell::PowerShellExe) {
        // PowerShell needs extra newlines before the background process output to create space
        for _count in [1,2,3,4,5,6] {
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
    if matches!(curr_cmd_shell, CmdShell::PowerShellDotNet | CmdShell::PowerShellExe) {
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
    script_arg_vec: &mut Vec<&'a str>
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
 * Get the command shell under which we are running.
 *
 * @returns A Result, which upon success contains a tuple:
 *          The first item is the type of the command shell
 *          The second item is the name of the process for that command shell.
 *
 *          Upon failure the Result contains a SimpleError.
 */
fn get_cmd_shell() -> Result<(CmdShell, String), SimpleError> {
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
            let my_parent_pid: Pid;
            match process.parent() {
                Some(parent_id) => my_parent_pid = parent_id,
                None => {
                    return Err(SimpleError::new("Got invalid parent process ID from the process list."));
                }
            }

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
                return Err(SimpleError::new("Unable to find our parent process in the process list."));
            }

            // after we find my_pid, stop seaching process list
            break;

        } // end found our own process ID
    }  // end iteration of process list to find our own process

    if !found_my_pid {
        return Err(SimpleError::new("Unable to find our current process in the process list."));
    }

    Ok((cmd_shell_type, cmd_shell_nm))
}

/**
 * Get information about our running daemon process.
 *
 * @returns A structure containing properties about the daemon process.
 *      It includes such information as:
 *          Is the zowe daemon currently running?
 *          Name of the process
 *          Process ID
 *          Command used to run the process
 */
fn get_daemon_process_info() -> DaemonProcInfo {
    let mut sys = System::new_all();
    sys.refresh_all();
    for (pid, process) in sys.processes() {
        if process.name().to_lowercase().contains("node") &&
           process.cmd().len() > 2 &&
           process.cmd()[1].to_lowercase().contains("zowe") &&
           process.cmd()[2].to_lowercase() == LAUNCH_DAEMON_OPTION
        {
            // convert the process command from a vector to a string
            let mut proc_cmd: String = String::new();
            for cmd_part in process.cmd() {
                proc_cmd.push_str(cmd_part);
                proc_cmd.push(' ');
            }
            return DaemonProcInfo {
                is_running: true,
                name: process.name().to_string(),
                pid: pid.to_string(),
                cmd: proc_cmd,
            };
        }
    }
    DaemonProcInfo {
        is_running: false,
        name: "no name".to_string(),
        pid: "no pid".to_string(),
        cmd: "no cmd".to_string(),
    }
}

#[cfg(target_family = "windows")]
fn get_lock_file() -> io::Result<LockFile> {
    let lock_file_name = get_lock_string();
    let _lock_file_created = File::create(&lock_file_name);
    LockFile::open(&lock_file_name)
}

#[cfg(target_family = "windows")]
fn get_lock_string() -> String {
    let mut _lock = format!("{}\\{}", home_dir().unwrap().to_string_lossy(), ".zowe-daemon.lock");

    if let Ok(lock_name) = env::var("ZOWE_DAEMON_LOCK") {
        _lock = lock_name;
    }

    _lock
}

// Get the file path to the command that runs the NodeJS version of Zowe
fn get_nodejs_zowe_path() -> String {
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
fn get_socket_string() -> String {
    let mut _socket = format!("{}/{}", home_dir().unwrap().to_string_lossy(), ".zowe-daemon.sock");

    if let Ok(socket_path) = env::var("ZOWE_DAEMON") {
        _socket = socket_path;
    }

    _socket
}

#[cfg(target_family = "windows")]
fn get_socket_string() -> String {
    let mut _socket = format!("\\\\.\\pipe\\{}\\{}", username(), "ZoweDaemon");

    if let Ok(pipe_name) = env::var("ZOWE_DAEMON") {
        _socket = format!("\\\\.\\pipe\\{}", pipe_name);
    }

    _socket
}

fn get_zowe_env() -> HashMap<String, String> {
    env::vars().filter(|&(ref k, _)|
        k.starts_with("ZOWE_")
    ).collect()
}

/**
 * Should we use daemon mode? The user controls this with an environment variable.
 * @returns true or false.
 */
fn user_wants_daemon() -> bool {
    const DAEMON_ENV_VAR_NM: &str = "ZOWE_USE_DAEMON";
    let env_var_val;
    match env::var(DAEMON_ENV_VAR_NM) {
        Ok(val) => env_var_val = val,
        Err(_e) => env_var_val = "NoDaemon".to_string(),
    }

    if env_var_val.to_lowercase() == "false"
        || env_var_val.to_lowercase() == "no"
        || env_var_val == "0"
    {
        return false;
    }
    true
}

//
// Unit tests
//

#[cfg(test)]
mod tests {

    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn unit_test_get_socket_string() {
        // expect default port with no env
        let socket_string = get_socket_string();
        assert!(!socket_string.contains("NotADaemon"));

        // expect override port with env
        env::set_var("ZOWE_DAEMON", "NotADaemon");
        let socket_string = get_socket_string();
        assert!(socket_string.contains("NotADaemon"));
        env::remove_var("ZOWE_DAEMON");
    }

    #[test]
    fn unit_test_get_zowe_env() {
        let env = get_zowe_env();
        assert_eq!(env.get("ZOWE_EDITOR"), None);

        env::set_var("ZOWE_EDITOR", "nano");
        let env = get_zowe_env();
        assert_eq!(env.get("ZOWE_EDITOR"), Some(&"nano".to_owned()));

        env::remove_var("ZOWE_EDITOR");
    }

    #[test]
    // test daemon restart
    fn integration_test_restart() {
        let njs_zowe_path = get_nodejs_zowe_path();

        let mut daemon_proc_info = get_daemon_process_info();
        if daemon_proc_info.is_running {
            println!("--- test_restart: To initializes test, stop a running daemon.");
            let mut restart_cmd_args: Vec<String> = vec![SHUTDOWN_REQUEST.to_string()];
            if let Err(err_val) = run_daemon_command(&njs_zowe_path, &mut restart_cmd_args) {
                assert_eq!("Shutdown should have worked", "Shutdown failed", "exit code = {}", err_val);
            }

            // confirm that the daemon has stopped
            daemon_proc_info = get_daemon_process_info();
            assert_eq!(daemon_proc_info.is_running, false, "The daemon did not stop.");
        }

        // now try the restart
        println!("--- test_restart: Run a restart when no daemon is running.");
        let result = run_restart_command(&njs_zowe_path);
        assert_eq!(result.unwrap(), 0, "The run_restart_command failed.");

        // confirm that the daemon is running
        thread::sleep(Duration::from_secs(THREE_SEC_DELAY));
        daemon_proc_info = get_daemon_process_info();
        assert_eq!(daemon_proc_info.is_running, true, "The daemon is not running after restart.");
        let first_daemon_pid = daemon_proc_info.pid;

        println!("--- test_restart: Run a restart with a daemon already running.");
        let result = run_restart_command(&njs_zowe_path);
        assert_eq!(result.unwrap(), 0, "The run_restart_command failed.");

        // confirm that a new and different daemon is running
        thread::sleep(Duration::from_secs(THREE_SEC_DELAY));
        daemon_proc_info = get_daemon_process_info();
        assert_eq!(daemon_proc_info.is_running, true, "A daemon should be running now.");
        assert_ne!(daemon_proc_info.pid, first_daemon_pid,
            "Last pid = {} should not equal current PID = {}", first_daemon_pid, daemon_proc_info.pid,
        );

        // As a cleanup step, stop the daemon
        println!("--- test_restart: To cleanup, stop the running daemon.");
        let mut restart_cmd_args: Vec<String> = vec![SHUTDOWN_REQUEST.to_string()];
        if let Err(_err_val) = run_daemon_command(&njs_zowe_path, &mut restart_cmd_args) {
            assert_eq!("Shutdown should have worked", "Shutdown failed");
        }

        // confirm that the daemon has stopped
        daemon_proc_info = get_daemon_process_info();
        assert_eq!(daemon_proc_info.is_running, false, "The daemon should have stopped for the end of the test.");
    }
}
