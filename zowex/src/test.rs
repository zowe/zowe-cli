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

// Automated tests

#[cfg(test)]
use std::env;
use std::thread;
use std::time::Duration;

#[cfg(target_family = "unix")]
use home::home_dir;

// Zowe daemon executable modules
use crate::defs::*;
use crate::proc::*;
use crate::run::*;
use crate::util::*;

pub const START_STOP_DELAY: u64 = 5; // 5 seconds

#[test]
fn unit_test_util_get_socket_string() {
    // expect default socket string with no env
    match util_get_socket_string() {
        #[cfg(target_family = "windows")]
        Ok(ok_val) => {
            let expected_pipe_path: String =
                format!("\\\\.\\pipe\\{}\\{}", util_get_username(), "ZoweDaemon");
            println!(
                "--- test_util_get_socket_string: ok_val = {}  expected_pipe_path = {}",
                ok_val, expected_pipe_path
            );
            assert!(ok_val.contains(&expected_pipe_path));
        }
        #[cfg(target_family = "unix")]
        Ok(ok_val) => {
            let mut expected_sock_path: String = "NotYetInitialized".to_string();
            match home_dir() {
                Some(path_buf_val) => {
                    expected_sock_path =
                        format!("{}/.zowe/daemon/daemon.sock", path_buf_val.display())
                }
                None => {
                    assert_eq!(
                        "util_get_socket_string should have gotten user home dir",
                        "It got None"
                    );
                }
            }
            println!(
                "--- test_util_get_socket_string: ok_val = {}  expected_sock_path = {}",
                ok_val, expected_sock_path
            );
            assert!(ok_val.contains(&expected_sock_path));
        }
        Err(err_val) => {
            assert_eq!(
                "util_get_socket_string should have worked", "It Failed",
                "exit code = {}",
                err_val
            );
        }
    }

    // expect to override pipe name with env on Windows
    #[cfg(target_family = "windows")]
    {
        env::set_var("ZOWE_DAEMON_PIPE", "FakePipePath");
        match util_get_socket_string() {
            Ok(ok_val) => {
                assert!(ok_val.contains("\\\\.\\pipe\\FakePipePath"));
            }
            Err(err_val) => {
                assert_eq!(
                    "util_get_socket_string should have worked", "It Failed",
                    "exit code = {}",
                    err_val
                );
            }
        }
        env::remove_var("ZOWE_DAEMON_PIPE");
    }

    // expect to override socket string with env on Linux
    #[cfg(target_family = "unix")]
    {
        env::set_var("ZOWE_DAEMON_DIR", "~/.zowe/daemon_test_dir");
        match util_get_socket_string() {
            Ok(ok_val) => {
                assert!(ok_val.contains("/.zowe/daemon_test_dir/daemon.sock"));
            }
            Err(err_val) => {
                assert_eq!(
                    "util_get_socket_string should have worked", "It Failed",
                    "exit code = {}",
                    err_val
                );
            }
        }
        env::remove_var("ZOWE_DAEMON_DIR");
    }
}

#[test]
fn unit_test_get_zowe_env() {
    let environment = util_get_zowe_env();
    assert_eq!(environment.get("ZOWE_EDITOR"), None);

    env::set_var("ZOWE_EDITOR", "nano");
    let environment = util_get_zowe_env();
    assert_eq!(environment.get("ZOWE_EDITOR"), Some(&"nano".to_owned()));
    env::remove_var("ZOWE_EDITOR");

    env::remove_var("FORCE_COLOR");
    let environment = util_get_zowe_env();
    let color = util_terminal_supports_color();
    assert_eq!(environment.get("FORCE_COLOR"), Some(&color.to_string()));

    env::set_var("FORCE_COLOR", "0");
    let environment = util_get_zowe_env();
    assert_eq!(environment.get("FORCE_COLOR"), Some(&"0".to_owned()));
    env::remove_var("FORCE_COLOR");

    env::set_var("FORCE_COLOR", "1");
    let environment = util_get_zowe_env();
    assert_eq!(environment.get("FORCE_COLOR"), Some(&"1".to_owned()));
    env::remove_var("FORCE_COLOR");

    env::set_var("FORCE_COLOR", "2");
    let environment = util_get_zowe_env();
    assert_eq!(environment.get("FORCE_COLOR"), Some(&"2".to_owned()));
    env::remove_var("FORCE_COLOR");

    env::set_var("FORCE_COLOR", "3");
    let env = util_get_zowe_env();
    assert_eq!(env.get("FORCE_COLOR"), Some(&"3".to_owned()));
    env::remove_var("FORCE_COLOR");
}

#[tokio::test]
// test daemon restart
async fn integration_test_restart() {
    let njs_zowe_path = util_get_nodejs_zowe_path();

    let mut daemon_proc_info = proc_get_daemon_info();
    if daemon_proc_info.is_running {
        println!("--- test_restart: To initializes test, stop a running daemon.");
        let mut restart_cmd_args: Vec<String> = vec![SHUTDOWN_REQUEST.to_string()];
        if let Err(err_val) = run_daemon_command(&njs_zowe_path, &mut restart_cmd_args).await {
            assert_eq!(
                "Shutdown should have worked", "Shutdown failed",
                "exit code = {}",
                err_val
            );
        }

        // confirm that the daemon has stopped
        daemon_proc_info = proc_get_daemon_info();
        assert_eq!(
            daemon_proc_info.is_running, false,
            "The daemon did not stop."
        );
    }

    // now try the restart
    println!("--- test_restart: Run a restart when no daemon is running.");
    let result = run_restart_command(&njs_zowe_path).await;
    assert_eq!(result.unwrap(), 0, "The run_restart_command failed.");

    // confirm that the daemon is running
    thread::sleep(Duration::from_secs(START_STOP_DELAY));
    daemon_proc_info = proc_get_daemon_info();
    assert_eq!(
        daemon_proc_info.is_running, true,
        "The daemon is not running after restart."
    );
    let first_daemon_pid = daemon_proc_info.pid;

    println!("--- test_restart: Run a restart with a daemon already running.");
    let result = run_restart_command(&njs_zowe_path).await;
    assert_eq!(result.unwrap(), 0, "The run_restart_command failed.");

    // confirm that a new and different daemon is running
    thread::sleep(Duration::from_secs(START_STOP_DELAY));
    daemon_proc_info = proc_get_daemon_info();
    assert_eq!(
        daemon_proc_info.is_running, true,
        "A daemon should be running now."
    );
    assert_ne!(
        daemon_proc_info.pid, first_daemon_pid,
        "Last pid = {} should not equal current PID = {}",
        first_daemon_pid, daemon_proc_info.pid,
    );

    // As a cleanup step, stop the daemon
    println!("--- test_restart: To cleanup, stop the running daemon.");
    let mut restart_cmd_args: Vec<String> = vec![SHUTDOWN_REQUEST.to_string()];
    if let Err(_err_val) = run_daemon_command(&njs_zowe_path, &mut restart_cmd_args).await {
        assert_eq!("Shutdown should have worked", "Shutdown failed");
    }

    // confirm that the daemon has stopped
    thread::sleep(Duration::from_secs(START_STOP_DELAY));
    daemon_proc_info = proc_get_daemon_info();
    assert_eq!(
        daemon_proc_info.is_running, false,
        "The daemon should have stopped for the end of the test."
    );
}
