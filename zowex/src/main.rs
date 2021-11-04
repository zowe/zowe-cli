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
use std::io::prelude::*;
use std::io::BufReader;
use std::io::{self, Write};
use std::net::Shutdown;
use std::net::TcpStream;
use std::process::{Command, Stdio};
use std::str;
use std::thread;
use std::time::Duration;

extern crate pathsearch;
use pathsearch::PathSearcher;

extern crate rpassword;
use rpassword::read_password;

extern crate sysinfo;
use sysinfo::{ProcessExt, System, SystemExt};


// NOTE(Kelosky): these sync with imperative header values
const X_ZOWE_DAEMON_HEADERS: &str = "x-zowe-daemon-headers";
const X_ZOWE_DAEMON_EXIT: &str = "x-zowe-daemon-exit";
const X_ZOWE_DAEMON_END: &str = "x-zowe-daemon-end";
const X_ZOWE_DAEMON_PROGRESS: &str = "x-zowe-daemon-progress";
const X_ZOWE_DAEMON_PROMPT: &str = "x-zowe-daemon-prompt";
const X_ZOWE_DAEMON_VERSION: &str = "x-zowe-daemon-version";
const X_HEADERS_VERSION_ONE_LENGTH: usize = 8;
const DEFAULT_PORT: i32 = 4000;

const X_ZOWE_DAEMON_REPLY: &str = "x-zowe-daemon-reply:";

const EXIT_CODE_CANNOT_CONNECT_TO_RUNNING_DAEMON: i32 = 100;
const EXIT_CODE_CANNOT_GET_MY_PATH: i32 = 101;
const EXIT_CODE_NO_NODEJS_ZOWE_ON_PATH: i32 = 102;
const EXIT_CODE_CANNOT_START_DAEMON: i32 = 103;
const EXIT_CODE_DEAMON_NOT_RUNNING_AFTER_START: i32 = 104;
const EXIT_CODE_DAEMON_FAILED_TO_RUN_CMD: i32 = 105;
const EXIT_CODE_FAILED_TO_RUN_NODEJS_CMD: i32 = 106;

struct DaemonProcInfo {
    is_running: bool,
    name: String,
    pid: String,
    cmd: String
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
        /* Convert our vector of arguments into a single string of arguments
         * for transmittal to the daemon.
         */
        let arg_string = arg_vec_to_string(_args);

        // send command to the daemon
        match run_daemon_command(arg_string) {
            Ok(_value) => {
                /* todo: Change run_daemon_command() to return an exit code.
                 * We can then process its cmd_result return value just like
                 * we do for run_nodejs_command(). As it stands now, our
                 * exit code is always zero, regardless of the exit code of
                 * the command run by the daemon.
                 */
                cmd_result = Ok(0);
            },
            Err(error) => {
                println!("The daemon failed to run your command due to this error:\n{}", error);
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
        },
        Err(error) => {
            println!("NodeJS zowe failed to run your command due to this error:\n{}", error);
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

        /* An argument that contains a space must be enclosed in double quotes
         * when it is placed into a single argument string.
         */
        if next_arg.contains(' ') {
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

fn run_daemon_command(mut args: String) -> std::io::Result<()> {
    args.push_str(" --dcd ");
    let path = env::current_dir()?;
    args.push_str(path.to_str().unwrap());
    args.push_str("/");
    let mut _resp = args.as_bytes(); // as utf8 bytes

    if _resp.is_empty() {
        _resp = b" ";
    }

    // form our host, port, and connection strings
    let daemon_host = "127.0.0.1".to_owned();
    let port_string = get_port_string();
    let host_port_conn_str = format!("{}:{}", daemon_host, port_string);

    /* Attempt to make a TCP connection to the daemon.
     * Iterate to enable a slow system to start the daemon.
     */
    let mut conn_attempt = 1;
    let mut we_started_daemon = false;
    let mut cmd_to_show: String = String::new();
    let mut stream = loop {
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
                        daemon_host, port_string
                    );
                    println!("Command used to start the Zowe daemon was:\n    {}\nTerminating.",
                        cmd_to_show
                    );
                    std::process::exit(EXIT_CODE_DEAMON_NOT_RUNNING_AFTER_START);
                }
            }
        }

        if conn_attempt == 5 {
            println!("\nUnable to connect to Zowe daemon with name = {} and pid = {} on host = {} and port = {}.",
                daemon_proc_info.name, daemon_proc_info.pid, daemon_host, port_string
            );
            println!("Command = {}\nTerminating after maximum retries.", daemon_proc_info.cmd);
             std::process::exit(EXIT_CODE_CANNOT_CONNECT_TO_RUNNING_DAEMON);
        }

        // pause between attempts to connect
        thread::sleep(Duration::from_secs(3));
        if conn_attempt == 1 && we_started_daemon == false || conn_attempt > 1 {
            println!("Attempting to connect to Zowe daemon again ...");
        }
        conn_attempt = conn_attempt + 1;
    };

    stream.write(_resp).unwrap(); // write it
    let mut stream_clone = stream.try_clone().expect("clone failed");

    let mut reader = BufReader::new(&mut stream);
    let mut headers: HashMap<String, i32> = HashMap::new();

    loop {
        let mut line = String::new();

        if reader.read_line(&mut line).unwrap() > 0 {
            // first break if identified headers exist on it
            let pieces = get_beg(&line);
            let new_headers: HashMap<std::string::String, i32>;

            // println!("@debug {}", line);

            // if headers include other data on the same line, isolate them
            if pieces.len() > 1 {
                new_headers = parse_headers(&pieces[0]);
            // println!("@debug data on pieces");
            // otherwise, get raw headers
            } else {
                new_headers = parse_headers(&line);
            }
            let mut got_new_headers = false;

            // adjust so that `headers` always contains the last sent headers
            if new_headers.len() > 0 {
                headers = new_headers;
                got_new_headers = true;
            // println!("@debug got new headers");
            } else {
                // do nothing
                // println!("@debug did not got new headers");
            }

            // if no headers, print the line as it comes in
            // TODO(Kelosky): if stderr, print stderr
            if headers.len() == 0 {
                print!("{}", line);
                io::stdout().flush().unwrap();
            } else {
                // we have headers but this statement that we read does not contain new header values
                if got_new_headers == false {
                    let &progress = headers.get(X_ZOWE_DAEMON_PROGRESS).unwrap();

                    // if progress bar is in place, strip off the newline character
                    if progress == 1i32 {
                        print!("{}", &line[0..(line.len() - 1)]);
                        io::stdout().flush().unwrap();
                    } else {
                        print!("{}", line);
                        io::stdout().flush().unwrap();
                    }
                // else, we received headers and may need to print extraneous data on the same line
                } else {
                    if pieces.len() > 1 {
                        print!("{}", pieces[1]);
                        io::stdout().flush().unwrap();
                        let &prompt = headers.get(X_ZOWE_DAEMON_PROMPT).unwrap();

                        if prompt > 0i32 {
                            // prompt
                            let mut reply = String::new();

                            // type 2 indicates secure fields
                            if prompt == 2i32 {
                                reply = read_password().unwrap();
                            // else regular prompting
                            } else {
                                io::stdin().read_line(&mut reply).unwrap();
                            }

                            // append response to header
                            let mut full_reply = X_ZOWE_DAEMON_REPLY.to_owned();
                            full_reply.push_str(&reply);

                            // adjust our state that prompting has been resolved
                            headers.insert(X_ZOWE_DAEMON_PROMPT.to_string(), 0i32);

                            // write response
                            stream_clone.write(full_reply.as_bytes()).unwrap();

                            // else, just write this line
                        }
                    }
                }
            }
        } else {
            // end of reading
            break;
        }
    }

    stream.shutdown(Shutdown::Both)?; // terminate connection

    if headers.contains_key(X_ZOWE_DAEMON_EXIT) {
        let &exit = headers.get(X_ZOWE_DAEMON_EXIT).unwrap();
        if exit == 1i32 {
            std::process::exit(exit);
        }
    }

    Ok(())
}

fn parse_headers(buf: &String) -> HashMap<String, i32> {
    let mut headers: HashMap<String, i32> = HashMap::new();

    // break response on newline
    let mut lines = buf.lines();
    let first = lines.next().unwrap();

    let raw_headers: Vec<&str> = first.split(';').collect();
    // must match minimum length
    if raw_headers.len() >= X_HEADERS_VERSION_ONE_LENGTH {
        // first and last headers must be as expected
        if raw_headers[0].contains(X_ZOWE_DAEMON_HEADERS)
            && raw_headers[X_HEADERS_VERSION_ONE_LENGTH - 1].contains(X_ZOWE_DAEMON_END)
        {
            for raw_header in raw_headers.iter() {
                let parts: Vec<&str> = raw_header.split(':').collect();
                let key = parts[0].to_owned();
                let char_value = parts[1].trim();
                let int_value = char_value.parse::<i32>().unwrap();
                headers.insert(key, int_value);
            }
        }
    }

    // we have a version header
    if headers.contains_key(X_ZOWE_DAEMON_VERSION) {
        let &version = headers.get(X_ZOWE_DAEMON_VERSION).unwrap();

        // version is not an int
        if version != 1i32 {
            headers.clear();
        }
    // else, new version, clear data
    } else {
        headers.clear();
    }

    headers
}

fn get_port_string() -> String {
    let mut _port = DEFAULT_PORT;

    match env::var("ZOWE_DAEMON") {
        Ok(val) => _port = val.parse::<i32>().unwrap(),
        Err(_e) => _port = DEFAULT_PORT,
    }
    let port_string = _port.to_string();
    return port_string;
}

fn get_beg(buf: &str) -> Vec<String> {
    let mut parts: Vec<String> = Vec::new();

    let ss: Vec<char> = buf.chars().collect();

    // if this line is long enough to contain headers
    if ss.len() >= 2 {
        // if this line begins with header info, just return and parse it.  there is no extraneous data at the beginning
        if ss[0] == 'x' && ss[1] == '-' {
            parts.push(buf.to_owned());
        // else, if we find we have some data in the string and a header, e.g. `}x-zowe-...` parse of the beginning data and header
        // into two pieces to pass back
        } else {
            for (i, x) in ss.iter().enumerate() {
                if *x == 'x' && ss[i + 1] == '-' {
                    let first: String = ss.iter().skip(0).take(i).collect();
                    let second: String = ss.iter().skip(i).take(ss.len() - 1).collect();
                    parts.push(second);
                    parts.push(first);
                    break;
                }
            }
        }
    // line cannot have headers, just return the line
    } else {
        parts.push(buf.to_owned());
    }

    return parts;
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
           process.cmd().len() > 0 &&
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
                cmd: proc_cmd
            };
        }
    }
    return DaemonProcInfo {
        is_running: false,
        name: "no name".to_string(),
        pid: "no pid".to_string(),
        cmd: "no cmd".to_string()
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

    if env_var_val.to_lowercase() == "false" || env_var_val.to_lowercase() == "no" {
        return false
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
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .output()
    {
        Ok(new_proc) => {
            exit_code = new_proc.status.code().unwrap();
        },
        Err(error) => {
            println!("Failed to run the following command:");
            println!("    Program = {}\n    arguments = {:?}", njs_zowe_path, cmd_line_args);
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
        Ok(_unused) => { /* nothing to do */ },
        Err(error) => {
            println!("Failed to start the following process:\n    {} {}", njs_zowe_path, daemon_arg);
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
        let headers = "x-zowe-daemon-headers:8;x-zowe-daemon-version:1;x-zowe-daemon-exit:1;x-zowe-daemon-stdout:1;x-zowe-daemon-stderr:0;x-zowe-daemon-prompt:0;x-zowe-daemon-progress:0;x-zowe-daemon-end:0".to_string();
        let headers_map = parse_headers(&headers);

        // expect 8 entries in the map
        assert_eq!(8, headers_map.len());
    }

    #[test]
    fn test_parse_headers_get_length() {
        let headers = "x-zowe-daemon-headers:8;x-zowe-daemon-version:1;x-zowe-daemon-exit:1;x-zowe-daemon-stdout:1;x-zowe-daemon-stderr:0;x-zowe-daemon-prompt:0;x-zowe-daemon-progress:0;x-zowe-daemon-end:0".to_string();
        let headers_map = parse_headers(&headers);

        let &len = headers_map
            .get(&("x-zowe-daemon-headers".to_string()))
            .unwrap();

        // expect len code set from header
        assert_eq!(8, len);
    }

    #[test]
    fn test_parse_headers_get_version() {
        let headers = "x-zowe-daemon-headers:8;x-zowe-daemon-version:1;x-zowe-daemon-exit:1;x-zowe-daemon-stdout:1;x-zowe-daemon-stderr:0;x-zowe-daemon-prompt:0;x-zowe-daemon-progress:0;x-zowe-daemon-end:0".to_string();
        let headers_map = parse_headers(&headers);

        let &len = headers_map
            .get(&("x-zowe-daemon-version".to_string()))
            .unwrap();

        // expect version code set from header
        assert_eq!(1, len);
    }

    #[test]
    fn test_parse_headers_get_exit() {
        let headers = "x-zowe-daemon-headers:8;x-zowe-daemon-version:1;x-zowe-daemon-exit:1;x-zowe-daemon-stdout:1;x-zowe-daemon-stderr:0;x-zowe-daemon-prompt:0;x-zowe-daemon-progress:0;x-zowe-daemon-end:0".to_string();
        let headers_map = parse_headers(&headers);

        let &exit = headers_map
            .get(&("x-zowe-daemon-exit".to_string()))
            .unwrap();

        // expect exit code set from header
        assert_eq!(1, exit);
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
