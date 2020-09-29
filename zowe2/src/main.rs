use std::env;
use std::io::prelude::*;
use std::io::{self, Write};
use std::net::Shutdown;
use std::net::TcpStream;
use std::process::Command;

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
        _=> run_zowe_command(args, &port_string).unwrap(),
    }

    Ok(())
}

fn run_zowe_command(mut args: String, port_string: &str) -> Result<(), io::Error> {
    args.push_str(" --cwd ");
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

    // TODO(Kelosky): if error for no daemon started - start daemon and redrive
    let mut stream = TcpStream::connect(daemon_host).unwrap();
    stream.write(_resp).unwrap(); // write it

    let mut buf = String::new();
    stream.read_to_string(&mut buf)?; // get response
    println!("{}", buf); // print it

    stream.shutdown(Shutdown::Both)?; // terminate

    Ok(())
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
    fn it_matches_default() {
        let port_string = get_port_string();
        assert_eq!("4000", port_string);
    }

    #[test]

    fn it_matches_env() {
        env::set_var("ZOWE_DAEMON", "777");
        let port_string = get_port_string();
        assert_eq!("777", port_string);
    }
}
