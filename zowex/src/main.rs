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
use std::ffi::OsString;
use std::io;
use std::io::prelude::*;
use std::io::BufReader;
use std::net::Shutdown;
use std::net::TcpStream;
use std::process::{Command, Stdio};
use std::str;
use std::thread;
use std::time::Duration;

extern crate atty;
use atty::Stream;

extern crate pathsearch;
use pathsearch::PathSearcher;

extern crate rpassword;
use rpassword::read_password;

extern crate serde;
use serde::{Deserialize, Serialize};

extern crate sysinfo;
use sysinfo::{ProcessExt, System, SystemExt};

extern crate whoami;
use whoami::username;

const DEFAULT_PORT: i32 = 4000;

const EXIT_CODE_CANNOT_CONNECT_TO_RUNNING_DAEMON: i32 = 100;
const EXIT_CODE_CANNOT_GET_MY_PATH: i32 = 101;
const EXIT_CODE_NO_NODEJS_ZOWE_ON_PATH: i32 = 102;
const EXIT_CODE_CANNOT_START_DAEMON: i32 = 103;
const EXIT_CODE_DAEMON_NOT_RUNNING_AFTER_START: i32 = 104;
const EXIT_CODE_DAEMON_FAILED_TO_RUN_CMD: i32 = 105;
const EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD: i32 = 106;

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

// TODO(Kelosky): performance tests, `time for i in {1..10}; do zowe -h >/dev/null; done`
// 0.8225 zowex vs 1.6961 zowe average over 10 run sample = .8736 sec faster on linux

// PS C:\Users\...\Desktop> 1..10 | ForEach-Object {
//     >>     Measure-Command {
//     >>         zowex -h
//     >>     }
//     >> } | Measure-Object -Property TotalSeconds -Average
// 3.6393932 and 0.76156812 zowe average over 10 run sample = 2.87782508 sec faster on windows

fn main() -> std::io::Result<()> {
    // turn args into vector
    let mut _args: Vec<String> = env::args().collect();

    _args.drain(..1); // remove first (exe name)

    let cmd_result: Result<i32, i32>;
    if user_wants_daemon() {
        // send command to the daemon
        match run_daemon_command(&mut _args) {
            Ok(_value) => {
                /* todo: Change run_daemon_command() to return an exit code.
                 * We can then process its cmd_result return value just like
                 * we do for run_nodejs_command(). As it stands now, our
                 * exit code is always zero, regardless of the exit code of
                 * the command run by the daemon.
                 */
                cmd_result = Ok(0);
            }
            Err(error) => {
                println!(
                    "The daemon failed to run your command due to this error:\n{}",
                    error
                );
                cmd_result = Ok(EXIT_CODE_DAEMON_FAILED_TO_RUN_CMD);
            }
        }
    } else {
        // user wants to run classic NodeJS zowe
        cmd_result = run_nodejs_command(&mut _args);
    }

    // stupid rust does not enable main() to return an exit code. This is the work-around.
    match cmd_result {
        Ok(value) => {
            std::process::exit(value);
        }
        Err(error) => {
            println!(
                "NodeJS zowe failed to run your command due to this error:\n{}",
                error
            );
            std::process::exit(EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD);
        }
    }
}

/**
 * Convert a vector of command line arguments into a single string of arguments.
 * @param cmd_line_args
 *      The user-supplied command line arguments to the zowe command.
 *      Each argument is in its own vector element.
 * @returns
 *      A String containing all of the command line arguments.
 */
fn arg_vec_to_string(arg_vec: Vec<String>) -> String {
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
        if next_arg.contains(' ') || next_arg.len() == 0 {
            arg_string.push('"');
            arg_string.push_str(next_arg);
            arg_string.push('"');
        } else {
            arg_string.push_str(next_arg);
        }

        arg_count = arg_count + 1;
    }

    return arg_string;
}

fn get_zowe_env() -> HashMap<String, String> {
    env::vars().filter(|&(ref k, _)|
        k.starts_with("ZOWE_")
    ).collect()
}

fn run_daemon_command(args: &mut Vec<String>) -> std::io::Result<()> {
    let cwd = env::current_dir()?;
    let mut stdin = Vec::new();
    if !atty::is(Stream::Stdin) {
        io::stdin().read_to_end(&mut stdin)?;
    }
    let response: DaemonResponse = DaemonResponse {
        argv: Some(args.to_vec()),
        cwd: Some(cwd.into_os_string().into_string().unwrap()),
        env: Some(get_zowe_env()),
        stdinLength: Some(stdin.len() as i32),
        stdin: None,
        user: Some(username()),
    };
    let mut _resp = serde_json::to_vec(&response)?;
    if response.stdinLength.unwrap() > 0 {
        _resp.push(b'\x0c');
        _resp.append(&mut stdin);
    }

    // form our host, port, and connection strings
    let daemon_host = "127.0.0.1".to_owned();
    let port_string = get_port_string();

    let mut stream = establish_connection(daemon_host, port_string)?;
    Ok(talk(&_resp, &mut stream)?)
}

fn establish_connection(host: String, port: String) -> io::Result<TcpStream> {
    /* Attempt to make a TCP connection to the daemon.
     * Iterate to enable a slow system to start the daemon.
     */
    let host_port_conn_str = format!("{}:{}", host, port);
    let mut conn_attempt = 1;
    let mut we_started_daemon = false;
    let mut cmd_to_show: String = String::new();
    let stream = loop {
        let conn_result = TcpStream::connect(&host_port_conn_str);
        if let Ok(good_stream) = conn_result {
            // We made our connection. Break with the actual stream value
            break good_stream;
        }

        // determine if daemon is running
        let daemon_proc_info = is_daemon_running();

        // when not running, start it.
        if daemon_proc_info.is_running == false {
            if conn_attempt == 1 {
                // start the daemon and continue trying to connect
                let njs_zowe_path = get_nodejs_zowe_path();
                we_started_daemon = true;
                cmd_to_show = start_daemon(&njs_zowe_path);
            } else {
                if we_started_daemon {
                    println!("The Zowe daemon that we started is not running on host = {} with port = {}.",
                        host, port
                    );
                    println!(
                        "Command used to start the Zowe daemon was:\n    {}\nTerminating.",
                        cmd_to_show
                    );
                    std::process::exit(EXIT_CODE_DAEMON_NOT_RUNNING_AFTER_START);
                }
            }
        }

        if conn_attempt == 5 {
            println!("\nUnable to connect to Zowe daemon with name = {} and pid = {} on host = {} and port = {}.",
                daemon_proc_info.name, daemon_proc_info.pid, host, port
            );
            println!(
                "Command = {}\nTerminating after maximum retries.",
                daemon_proc_info.cmd
            );
            std::process::exit(EXIT_CODE_CANNOT_CONNECT_TO_RUNNING_DAEMON);
        }

        // pause between attempts to connect
        thread::sleep(Duration::from_secs(3));
        if conn_attempt == 1 && we_started_daemon == false || conn_attempt > 1 {
            println!("Attempting to connect to Zowe daemon again ...");
        }
        conn_attempt = conn_attempt + 1;
    };

    Ok(stream)
}

fn talk(message: &[u8], stream: &mut TcpStream) -> io::Result<()> {
    /*
     * Send the command line arguments to the daemon and await responses.
     */
    stream.write(message).unwrap(); // write it
    let mut stream_clone = stream.try_clone().expect("clone failed");

    let mut reader = BufReader::new(&*stream);

    let mut exit_code = 0;
    let mut _progress = false;

    loop {
        let mut u_payload: Vec<u8> = Vec::new();
        let payload: String;

        // read until form feed (\f)
        if reader.read_until(0xC, &mut u_payload).unwrap() > 0 {
            // remove form feed and convert to a string
            u_payload.pop(); // remove the 0xC
            payload = str::from_utf8(&u_payload).unwrap().to_string();

            let p: DaemonRequest = match serde_json::from_str(&payload) {
                Ok(p) => p,
                Err(_e) => {
                    // TODO(Kelosky): handle this only if progress bar mode is active
                    if atty::is(Stream::Stderr) {
                        eprint!("{}", payload);
                        io::stderr().flush().unwrap();
                    }
                    DaemonRequest {
                        stdout: None,
                        stderr: None,
                        exitCode: Some(0i32),
                        progress: None,
                        prompt: None,
                        securePrompt: None,
                    }
                }
            };

            match p.stdout {
                Some(s) => {
                    print!("{}", s);
                    io::stdout().flush().unwrap();
                }
                None => (), // do nothing
            }

            match p.stderr {
                Some(s) => {
                    eprint!("{}", s);
                    io::stderr().flush().unwrap();
                }
                None => (), // do nothing
            }

            match p.prompt {
                Some(s) => {
                    print!("{}", s);
                    io::stdout().flush().unwrap();
                    let mut reply = String::new();
                    io::stdin().read_line(&mut reply).unwrap();
                    let response: DaemonResponse = DaemonResponse {
                        argv: None,
                        cwd: None,
                        env: None,
                        stdinLength: None,
                        stdin: Some(reply),
                        user: Some(username()),
                    };
                    let v = serde_json::to_string(&response)?;

                    stream_clone.write(v.as_bytes()).unwrap();
                }
                None => (), // do nothing
            }

            match p.securePrompt {
                Some(s) => {
                    print!("{}", s);
                    io::stdout().flush().unwrap();
                    let reply;
                    reply = read_password().unwrap();
                    let response: DaemonResponse = DaemonResponse {
                        argv: None,
                        cwd: None,
                        env: None,
                        stdinLength: None,
                        stdin: Some(reply),
                        user: Some(username()),
                    };
                    let v = serde_json::to_string(&response)?;
                    stream_clone.write(v.as_bytes()).unwrap();
                }
                None => (), // do nothing
            }

            exit_code = match p.exitCode {
                Some(s) => s,
                None => 0, // do nothing
            };

            _progress = match p.progress {
                Some(s) => s,
                None => false, // do nothing
            };
        } else {
            // end of reading
            break;
        }
    }

    // Terminate connection. Ignore NotConnected errors returned on macOS.
    // https://doc.rust-lang.org/std/net/struct.TcpStream.html#method.shutdown
    match stream.shutdown(Shutdown::Read) {
        Err(ref e) if e.kind() == io::ErrorKind::NotConnected => (),
        result => result?,
    }
    match stream.shutdown(Shutdown::Write) {
        Err(ref e) if e.kind() == io::ErrorKind::NotConnected => (),
        result => result?,
    }

    // TODO(Kelosky): maybe this should just be a `return Err`
    if exit_code != 0 {
        std::process::exit(exit_code);
    }

    Ok(())
}

fn get_port_string() -> String {
    let mut _port = DEFAULT_PORT;

    match env::var("ZOWE_DAEMON") {
        // TODO(Kelosky): handle unwrap properly
        Ok(val) => _port = val.parse::<i32>().unwrap(),
        Err(_e) => _port = DEFAULT_PORT,
    }
    let port_string = _port.to_string();
    return port_string;
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
        path.as_ref().map(OsString::as_os_str),
        path_ext.as_ref().map(OsString::as_os_str),
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

    return njs_zowe_path;
}

/**
 * Is the zowe daemon currently running?
 * @returns A structure that indicates if the daemon is running, and if so
 *          properties about that running process.
 */
fn is_daemon_running() -> DaemonProcInfo {
    let mut sys = System::new_all();
    sys.refresh_all();
    for (pid, process) in sys.processes() {
        if process.name().to_lowercase().contains("node") &&
           process.cmd().len() > 2 &&
           process.cmd()[1].to_lowercase().contains("@zowe") &&
           process.cmd()[1].to_lowercase().contains("cli") &&
           process.cmd()[2].to_lowercase() == "--daemon"
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
    return DaemonProcInfo {
        is_running: false,
        name: "no name".to_string(),
        pid: "no pid".to_string(),
        cmd: "no cmd".to_string(),
    };
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
    return true;
}

/**
 * Run the classic NodeJS zowe command.
 * @param cmd_line_args
 *      The user-supplied command line arguments to the zowe command.
 * @returns
 *      Our error code when we fail to the NodeJS zowe.
 *      Otherwise, the exit code of the NodeJs zowe command.
 */
fn run_nodejs_command(cmd_line_args: &mut Vec<String>) -> Result<i32, i32> {
    let njs_zowe_path = get_nodejs_zowe_path();

    // launch classic NodeJS zowe and wait for it to complete.
    let exit_code: i32;
    match Command::new(njs_zowe_path.to_owned())
        .args(cmd_line_args.to_owned())
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
                njs_zowe_path, cmd_line_args
            );
            println!("Due to this error:\n    {}", error);
            exit_code = EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD;
        }
    };

    return Ok(exit_code);
}

/**
 * Start the zowe daemon.
 *
 * @param njs_zowe_path
 *      Full path to the NodeJS zowe command.
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

    let daemon_arg = "--daemon";
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
    cmd_to_show.push_str(" ");
    cmd_to_show.push_str(daemon_arg);
    return cmd_to_show;
}

//
// Unit tests
//

#[cfg(test)]
mod tests {

    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_parse_headers_get_total_length() {
        assert_eq!(8, 8);
    }

    #[test]
    fn test_get_port_string() {
        // expect default port with no env
        let port_string = get_port_string();
        assert_eq!("4000", port_string);

        // expect override port with env
        env::set_var("ZOWE_DAEMON", "777");
        let port_string = get_port_string();
        assert_eq!("777", port_string);
    }
}
