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
        env::set_var("ZOWE_DAEMON_DIR", format!("{}/.zowe/daemon_test_dir", home_dir().unwrap().display()));
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
fn unit_test_util_get_daemon_token() {
    use std::fs;
    use std::path::PathBuf;

    // Use an isolated daemon dir and read it directly (not via ZOWE_DAEMON_DIR)
    // so this test does not race with other tests that mutate that env variable.
    let mut token_test_dir: PathBuf = env::temp_dir();
    token_test_dir.push("zowe_daemon_token_test");
    let _ = fs::remove_dir_all(&token_test_dir);
    fs::create_dir_all(&token_test_dir).unwrap();

    let mut pid_file_path = token_test_dir.clone();
    pid_file_path.push("daemon_pid.json");

    // when no pid file exists, we should get None (no token)
    assert_eq!(util_get_daemon_token_from_dir(&token_test_dir), None);

    // when the pid file contains a token, we should read it back exactly
    fs::write(
        &pid_file_path,
        r#"{ "user": "fakeUser", "pid": 1234, "token": "abc123" }"#,
    )
    .unwrap();
    assert_eq!(
        util_get_daemon_token_from_dir(&token_test_dir),
        Some("abc123".to_string())
    );

    // when the pid file omits the token (older daemon), we should get None
    fs::write(&pid_file_path, r#"{ "user": "fakeUser", "pid": 1234 }"#).unwrap();
    assert_eq!(util_get_daemon_token_from_dir(&token_test_dir), None);

    // cleanup
    let _ = fs::remove_dir_all(&token_test_dir);
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

#[cfg(target_family = "unix")]
#[test]
fn unit_test_util_restrict_path_to_owner() {
    use std::fs;
    use std::os::unix::fs::PermissionsExt;

    // create a temp directory with wide-open permissions
    let mut test_dir = env::temp_dir();
    test_dir.push(format!("zowe_restrict_test_{}", std::process::id()));
    let _ = fs::remove_dir_all(&test_dir);
    fs::create_dir_all(&test_dir).expect("failed to create test dir");
    fs::set_permissions(&test_dir, fs::Permissions::from_mode(0o777))
        .expect("failed to loosen test dir perms");

    // create a file inside it with wide-open permissions
    let mut test_file = test_dir.clone();
    test_file.push("some_artifact");
    fs::write(&test_file, b"data").expect("failed to write test file");
    fs::set_permissions(&test_file, fs::Permissions::from_mode(0o666))
        .expect("failed to loosen test file perms");

    // restricting the directory should make it owner-only (0o700)
    assert!(util_restrict_path_to_owner(&test_dir).is_ok());
    let dir_mode = fs::metadata(&test_dir).unwrap().permissions().mode() & 0o777;
    assert_eq!(dir_mode, 0o700, "directory should be restricted to 0o700");

    // restricting the file should make it owner-only (0o700)
    assert!(util_restrict_path_to_owner(&test_file).is_ok());
    let file_mode = fs::metadata(&test_file).unwrap().permissions().mode() & 0o777;
    assert_eq!(file_mode, 0o700, "file should be restricted to 0o700");

    // cleanup
    let _ = fs::remove_dir_all(&test_dir);
}

#[test]
fn unit_test_util_restrict_zowe_bin_to_owner() {
    // The running test executable stands in for the zowe binary that lives in
    // ~/.zowe/bin. This is best-effort and returns no error, so we simply
    // confirm that it completes without panicking and that our own executable
    // (and the directory that contains it) are still accessible afterward.
    util_restrict_zowe_bin_to_owner();

    let my_exe = env::current_exe().expect("should be able to get current exe path");
    assert!(my_exe.exists(), "the executable should still exist after restriction");
    assert!(
        my_exe.parent().unwrap().exists(),
        "the bin directory should still exist after restriction"
    );
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
