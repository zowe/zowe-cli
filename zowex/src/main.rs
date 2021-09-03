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

const CANNOT_CONNECT_TO_RUNNING_DAEMON_EXIT_CODE: i32 = 100;
const CANNOT_GET_MY_PATH_EXIT_CODE: i32 = 101;
const NO_NODEJS_ZOWE_ON_PATH_EXIT_CODE: i32 = 102;
const CANNOT_START_DAEMON_EXIT_CODE: i32 = 103;
const DEAMON_NOT_RUNNING_AFTER_START_EXIT_CODE: i32 = 104;

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

    if user_wants_daemon() {
        // interact with the daemon
        let args = _args.join(" ");
        run_zowe_command(args).unwrap();
        return Ok(())
    }

    // user wants to run classic NodeJS zowe
    run_classic_zowe(&mut _args);
    return Ok(());
}

fn run_zowe_command(mut args: String) -> std::io::Result<()> {
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
    let mut cmd_to_show: String = "No value was set".to_string();
    let mut stream = loop {
        let conn_result = TcpStream::connect(&host_port_conn_str);
        if let Ok(good_stream) = conn_result {
            // We made our connection. Break with the actual stram value
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
                    std::process::exit(DEAMON_NOT_RUNNING_AFTER_START_EXIT_CODE);
                }
            }
        }

        if conn_attempt == 5 {
            println!("\nUnable to connect to Zowe daemon with name = {} and pid = {} on host = {} and port = {}.",
                daemon_proc_info.name, daemon_proc_info.pid, daemon_host, port_string
            );
            println!("Command = {}\nTerminating after maximum retries.", daemon_proc_info.cmd);
             std::process::exit(CANNOT_CONNECT_TO_RUNNING_DAEMON_EXIT_CODE);
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
    // get the path name to my own zowe rust executable
    let my_exe_result = env::current_exe();
    if my_exe_result.is_err() {
        println!("Unable to get path to my own executable. Terminating.");
        std::process::exit(CANNOT_GET_MY_PATH_EXIT_CODE);
    }
    let my_exe_path_buf = my_exe_result.unwrap();
    let my_exe_path = my_exe_path_buf.to_string_lossy();

    // we want a program file name that would execute a 'zowe' command
    let mut zowe_file = "zowe";
    if env::consts::OS == "windows" {
        zowe_file = "zowe.cmd";
    }

    // find every program in our path that would execute a 'zowe' command
    const NOT_FOUND: &str = "notFound";
    let mut njs_zowe_path: String = NOT_FOUND.to_string();
    let path = env::var_os("PATH");
    let path_ext = env::var_os("PATHEXT");
    for njs_zowe_path_buf in PathSearcher::new(
        zowe_file,
        path.as_ref().map(OsString::as_os_str),
        path_ext.as_ref().map(OsString::as_os_str),
    ) {
        njs_zowe_path = njs_zowe_path_buf.to_string_lossy().to_string();
        if njs_zowe_path.to_lowercase().eq(&my_exe_path.to_lowercase()) {
            // We do not want our own rust executable. Keep searching.
            njs_zowe_path = NOT_FOUND.to_string();
            continue;
        }

        // use the first zowe command on our path that is not our own executable
        break;
    }
    if njs_zowe_path == NOT_FOUND {
        println!("Could not find a NodeJS zowe command on your path.");
        println!("Cannot launch Zowe daemon. Terminating.");
        std::process::exit(NO_NODEJS_ZOWE_ON_PATH_EXIT_CODE);
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
           process.cmd()[1].to_lowercase().contains("@zowe") &&
           process.cmd()[1].to_lowercase().contains("cli") &&
           process.cmd()[2].to_lowercase() == "--daemon"
        {
            // convert the process command from a vector to a string
            let mut proc_cmd: String = "".to_string();
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

    if env_var_val.to_lowercase() == "true" || env_var_val.to_lowercase() == "yes" {
        return true
    }
    return false;
}

/**
 * Run the classic NodeJS zowe command.
 * @param cmd_line_args
 *      The user-supplied command line arguments to the zowe command.
 */
fn run_classic_zowe(cmd_line_args: &mut Vec<String>) {
   let njs_zowe_path = get_nodejs_zowe_path();

    // The command to launch varies by OS
    let shell_pgm;
    let mut pgm_args = vec![];
    if env::consts::OS == "windows" {
        shell_pgm = "cmd";
        pgm_args.push("/C".to_string());
        pgm_args.push(njs_zowe_path.to_string());
    } else {
        shell_pgm = &njs_zowe_path;
    }

    // form the command that we show in an error message.
    let mut cmd_to_show: String = (&shell_pgm).to_string();

    // add user-supplied arguments to both the command to show and to launch
    for next_arg in cmd_line_args.iter() {
        cmd_to_show.push_str(" ");
        cmd_to_show.push_str(next_arg);
        pgm_args.push(next_arg.to_string());
    }

    /* We cannot use pgm_args after any error due to rust's stupid string ownership.
     * The following statement can show individual arguments more precisely for debugging.
     * println!("\nrun_classic_zowe: shell_pgm = {}  pgm_args = {:?}", shell_pgm, pgm_args);
     */

    // launch classic zowe and wait for it to complete.
    let new_proc = Command::new(shell_pgm)
        .args(pgm_args)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .output();
    if new_proc.is_err() {
        println!("Error = {:?}", new_proc);
        println!("Failed to run the following command:\n    {}", cmd_to_show);
    }
}

/**
 * Start the zowe daemon.
 * @param njs_zowe_path
 *      Full path to the NodeJS zowe command.
 * @returns
 *      The command that was used to start the daemon (for display purposes).
 */
fn start_daemon(njs_zowe_path: &str) -> String {
    println!("Starting a background process to increase performance ...");

    // set OS-specific options
    let shell_pgm;
    let cmd_to_run;
    let stdout_val;
    let stderr_val;

    // must be declared outside of the "if" scope. Thanks a lot Rust!
    let mut zowe_cmd_linux: String = "".to_string();

    if env::consts::OS == "windows" {
        shell_pgm = "cmd";
        cmd_to_run = vec!["/C", njs_zowe_path, "--daemon", "&&", "exit"];
        /*
        The following has no window, no color and no escape characters.
        The 'exit' command hangs. You must type exit AND control-C, or
        click the X button on your original command window.
        When you do terminate your command window, the daemon automatically terminates.
            cmd_to_run = vec!["/C", njs_zowe_path, "--daemon", "&&", "exit"];

        The following has no window, no color, no escape characters
        The 'exit' command hangs. You must click the X button on your original command window.
        When you do terminate your command window, the daemon automatically terminates.
        Anything other than an empty title in the start command fails.
            cmd_to_run = vec!["/C", "start", "", "/b", njs_zowe_path, "--daemon"];

        The following launches a minimized window on the task bar.
        CMD.exe and PowerShell show escape characters for color.
        All shells look fine in ConEmu.
        You must separately exit the daemon window.
        Anything other than an empty title in the start command fails.
            cmd_to_run = vec!["/C", "start", "", "/MIN", njs_zowe_path, "--daemon"];
        */

        /*
        If you inherit stdout, CMD and PowerShell show escape characters for color.
        If use use null, you get no color.
            stdout_val = Stdio::inherit();
            stderr_val = Stdio::inherit();
        */
        stdout_val = Stdio::null();
        stderr_val = Stdio::null();

        /* Windows CMD and Powershell terminal windows show escape characters
        * instead of colors in daemon-mode. A more elegant solution may exist,
        * but for now we just turn off color in daemon mode on Windows.
        */
        env::set_var("FORCE_COLOR", "0");
    } else {
        // the whole command must be supplied as one parm to "sh -c" command.
        zowe_cmd_linux.push_str(njs_zowe_path);
        zowe_cmd_linux.push_str(" --daemon &");
        shell_pgm = "sh";
        cmd_to_run = vec!["-c", &zowe_cmd_linux];

        // If you inherit stdout, you get double output. If use use null, you get no color.
        stdout_val = Stdio::null();
        stderr_val = Stdio::null();
    }

    // record the command that we run (for display purposes)
    let mut cmd_to_show: String = (&shell_pgm).to_string();
    for next_arg in cmd_to_run.iter() {
        cmd_to_show.push_str(" ");
        cmd_to_show.push_str(next_arg);
    }

    // spawn the zowe daemon process and do not wait for termination
    let new_proc = Command::new(shell_pgm)
        .args(cmd_to_run)
        .stdout(stdout_val)
        .stderr(stderr_val)
        .spawn();
    if new_proc.is_err() {
        println!("Error = {:?}", new_proc);
        println!("Failed to start the following process.\n    {}\nTerminating.", cmd_to_show);
        std::process::exit(CANNOT_START_DAEMON_EXIT_CODE);
    }
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
