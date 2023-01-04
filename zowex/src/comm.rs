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

// Functions related to daemon cummunication.

use std::io;
use std::io::BufReader;
use std::io::prelude::*;
use std::str;
use std::thread;
use std::time::Duration;

#[cfg(target_family = "unix")]
use {
    std::net::Shutdown,
    std::os::unix::net::UnixStream
};

extern crate atty;
use atty::Stream;

extern crate base64;
use base64::encode;

#[cfg(target_family = "windows")]
    extern crate named_pipe;
#[cfg(target_family = "windows")]
    use named_pipe::PipeClient;

extern crate rpassword;
use rpassword::read_password;

extern crate whoami;
use whoami::username;

// Zowe daemon executable modules
use crate::defs::*;
use crate::proc::*;

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
pub fn comm_establish_connection(njs_zowe_path: &str, daemon_socket: &str) -> io::Result<DaemonClient> {
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
        let daemon_proc_info = proc_get_daemon_info();

        // when not running, start it.
        if !daemon_proc_info.is_running {
            if conn_retries == 0 {
                // start the daemon and continue trying to connect
                we_started_daemon = true;
                cmd_to_show = proc_start_daemon(njs_zowe_path);
            } else if we_started_daemon && conn_retries > THREE_MIN_OF_RETRIES {
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

        let retry_msg = if we_started_daemon && !daemon_proc_info.is_running {
            "Waiting for the Zowe daemon to start"
        } else {
            "Attempting to connect to the Zowe daemon"
        };
        if conn_retries > 0 {
            println!("{} ({} of {})", retry_msg, conn_retries, THREE_MIN_OF_RETRIES);
        }
        conn_retries += 1;
    };

    Ok(stream)
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
pub fn comm_talk(message: &[u8], stream: &mut DaemonClient) -> io::Result<i32> {
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

                    if p.exitCode.is_some() {
                        // we have the exit code, assume the transmission is over
                        // fixes the broken pipe error in #1538
                        break;
                    }
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
