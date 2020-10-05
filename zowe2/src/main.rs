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
use std::io::prelude::*;
use std::io::BufReader;
use std::io::{self, Write};
use std::net::Shutdown;
use std::net::TcpStream;
use std::process::Command;

// NOTE(Kelosky): these sync with imperative header values
const X_ZOWE_DAEMON_HEADERS: &str = "x-zowe-daemon-headers";
const X_ZOWE_DAEMON_EXIT: &str = "x-zowe-daemon-exit";
const X_ZOWE_DAEMON_END: &str = "x-zowe-daemon-end";
const X_ZOWE_DAEMON_VERSION: &str = "x-zowe-daemon-version";
const X_HEADERS_VERSION_ONE_LENGTH: usize = 7;

// TODO(Kelosky): add version command
// TODO(Kelosky): add help command??
// TODO(Kelosky): escape quotes?? zowe uss issue ssh "ls -la" causes command errors in zowe2

fn main() -> std::io::Result<()> {
    // turn args into vector
    let mut _args: Vec<String> = env::args().collect();
    _args.drain(..1); // remove first (exe name)

    let port_string = get_port_string();
    let mut daemon_host = "127.0.0.1:".to_owned();
    daemon_host.push_str(&port_string);

    let args = _args.join(" ");

    match args.as_ref() {
        "start" => start_zowe_daemon(&port_string),
        "stop" => stop_zowe_daemon(&port_string),
        "restart" => restart_zowe_daemon(&port_string),
        _ => run_zowe_command(args, &port_string).unwrap(),
    }

    Ok(())
}

fn run_zowe_command(mut args: String, port_string: &str) -> std::io::Result<()> {
    args.push_str(" --lcd ");
    let path = env::current_dir()?;
    args.push_str(path.to_str().unwrap());
    args.push_str("/");
    let mut _resp = args.as_bytes(); // as utf8 bytes

    let mut daemon_host = "127.0.0.1:".to_owned();
    daemon_host.push_str(&port_string);

    // make sure something is written
    if _resp.is_empty() {
        _resp = b" ";
    }

    let mut stream = TcpStream::connect(daemon_host).unwrap();
    stream.write(_resp).unwrap(); // write it

    let mut reader = BufReader::new(&stream);
    let mut headers: HashMap<String, i32> = HashMap::new();

    loop {
        let mut line = String::new();
        if reader.read_line(&mut line).unwrap() > 0 {
            headers = parse_headers(&line);
            // if no headers, print the later
            // NOTE(Kelosky): later, if stderr, print stderr
            if headers.len() == 0 {
                print!("{}", line);
            }
        } else {
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
    if raw_headers.len() == X_HEADERS_VERSION_ONE_LENGTH {
        if raw_headers[0].contains(X_ZOWE_DAEMON_HEADERS) && raw_headers[6].contains(X_ZOWE_DAEMON_END) {
            for raw_header in raw_headers.iter() {
                let parts: Vec<&str> = raw_header.split(':').collect();
                let key = parts[0].to_owned();
                let char_value = parts[1];
                let int_value = char_value.parse::<i32>().unwrap();
                headers.insert(key, int_value);
            }
        }
    }

    if headers.contains_key(X_ZOWE_DAEMON_VERSION) {
        let &version = headers.get(X_ZOWE_DAEMON_VERSION).unwrap();
        if version != 1i32 {
            headers.clear();
        }
    } else {
        headers.clear();
    }

    headers
}

fn start_zowe_daemon(port_string: &str) {
    let mut daemon_parm = "--daemon=".to_owned();
    daemon_parm.push_str(&port_string);
    if cfg!(target_os = "windows") {
        // NOTE(Kelosky): running `zowe` directly doesnt appear to be found: https://github.com/rust-lang/rust/issues/42791
        let zowe = Command::new("cmd")
            .args(&["/c", "zowe-start-daemon.cmd", &port_string])
            .output()
            .expect("Failed to start Zowe CLI daemon, is your version current and on your PATH?");
        io::stdout().write_all(&zowe.stdout).unwrap();
    }
    // TODO(Kelosky): handle linux / mac OS
}

fn stop_zowe_daemon(port_string: &str) {
    let zowe = Command::new("cmd")
        .args(&["/c", "zowe-stop-daemon.cmd", &port_string])
        .output()
        .expect("Failed to stop Zowe CLI daemon, is your version current and on your PATH?");
    io::stdout().write_all(&zowe.stdout).unwrap();
}

fn restart_zowe_daemon(port_string: &str) {
    let zowe = Command::new("cmd")
        .args(&["/c", "zowe-restart-daemon.cmd", &port_string])
        .output()
        .expect("Failed to restart Zowe CLI daemon, is your version current and on your PATH?");
    io::stdout().write_all(&zowe.stdout).unwrap();
}

fn get_port_string() -> String {
    let mut _port = 4000;

    match env::var("ZOWE_DAEMON") {
        Ok(val) => _port = val.parse::<i32>().unwrap(),
        Err(_e) => _port = 4000,
    }
    let port_string = _port.to_string();
    return port_string;
}

#[cfg(test)]
mod tests {

    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_parse_headers() {
        // expect 2 entries in the map
        let headers = "length:2;exit:5".to_string();
        let headers_map = parse_headers(&headers);
        assert_eq!(2, headers_map.len());

        // expect exit code set from header
        let &exit = headers_map.get(&("exit".to_string())).unwrap();
        assert_eq!(5, exit);
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
