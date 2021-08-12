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
extern crate rpassword;
use rpassword::read_password;

use std::collections::HashMap;
use std::env;
use std::io::prelude::*;
use std::io::BufReader;
use std::io::{self, Write};
use std::net::Shutdown;
use std::net::TcpStream;
use std::str;

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

    let port_string = get_port_string();
    let mut daemon_host = "127.0.0.1:".to_owned();
    daemon_host.push_str(&port_string);

    let args = _args.join(" ");

    run_zowe_command(args, &port_string).unwrap();

    Ok(())
}

fn run_zowe_command(mut args: String, port_string: &str) -> std::io::Result<()> {
    args.push_str(" --dcd ");
    let path = env::current_dir()?;
    args.push_str(path.to_str().unwrap());
    args.push_str("/");
    let mut _resp = args.as_bytes(); // as utf8 bytes

    if _resp.is_empty() {
        _resp = b" ";
    }

    let mut daemon_host = "127.0.0.1:".to_owned();
    daemon_host.push_str(&port_string);

    let conn_result = TcpStream::connect(daemon_host);
    if conn_result.is_err() {
        // when we cannot connect, check if daemon is running
        if is_daemon_running() {
            println!("Unable to connect to a running Zowe daemon.");
            std::process::exit(CANNOT_CONNECT_TO_RUNNING_DAEMON_EXIT_CODE);
        } else {
            println!("The daemon is NOT running, so we will start it.");
            std::process::exit(666); // zzz
        }
    }

    let mut stream = conn_result.unwrap();
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

// Is the zowe daemon currently running?
fn is_daemon_running() -> bool {
    let mut sys = System::new_all();
    sys.refresh_all();
    for (pid, process) in sys.processes() {
        if process.name().to_lowercase().contains("node") &&
           process.cmd()[1].to_lowercase().contains("@zowe") &&
           process.cmd()[1].to_lowercase().contains("cli") &&
           process.cmd()[2].to_lowercase() == "--daemon"
        {
            /* We print the daemon info, because we only check if the daemon
             * is running when we cannot connect to it, and we are about to
             * terminate with an error. This info may help diagnose the problem.
             */
            println!("The Zowe daemon is running:");
            println!("pid={} name={} cmd={:?}", pid, process.name(), process.cmd());
            return true;
        }
    }
    return false;
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
