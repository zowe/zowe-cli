use std::io::prelude::*;
use std::net::TcpStream;
use std::io::{self, Write};
use std::net::Shutdown;
use std::env;
use std::process::Command;

fn main() -> std::io::Result<()> {

    // turn args into vector
    let mut _args: Vec<String> = env::args().collect();
    _args.drain(..1); // remove first (exe name)

    let mut port = 4000;

    match env::var("ZOWE_DAEMON") {
        Ok(val) => port = val.parse::<i32>().unwrap(),
        Err(_e) => port = 4000,
    }
    let port_string = port.to_string();
    let mut daemon_host = "127.0.0.1:".to_owned();
    daemon_host.push_str(&port_string);

    if _args.len() > 0 && _args[0] == "start" {

        if cfg!(target_os = "windows") {
            let mut daemon_parm = "--daemon=".to_owned();
            daemon_parm.push_str(&port_string);
            // NOTE(Kelosky): running `zowe` directly doesnt appear to be found: https://github.com/rust-lang/rust/issues/42791
            // let zowe = Command::new("cmd").args(&["/c", "start-zowe-daemon.cmd", &daemon_parm]).output().expect("failed to run zowe CLI - is it on your path?");
            let zowe = Command::new("cmd").args(&["/c", "start-zowe-daemon.cmd", &port_string]).output().expect("failed to run zowe CLI - is it on your path?");
            io::stdout().write_all(&zowe.stdout).unwrap();
        } 
        // TODO(Kelosky): handle linux / mac OS
    }

    else if _args.len() > 0 && _args[0] == "stop" {

        // TODO(Kelosky): handle case where zowe --daemon is run directly by writing `stop`?? 
        Command::new("cmd").args(&["/c", "stop-zowe-daemon.cmd", &port_string]).output().expect("failed to run zowe CLI - is it on your path?");
    }

    else if _args.len() > 0 && _args[0] == "restart" {

        Command::new("cmd").args(&["/c", "restart-zowe-daemon.cmd", &port_string]).output().expect("failed to run zowe CLI - is it on your path?");
    }

    else {

        // TODO(Kelosky): if `--cwd` or `--current-working-directory` already found skip adding this parm
        
        let mut val = _args.join(" "); // convert to single string
        val.push_str(" --cwd ");
        let path = env::current_dir()?;
        val.push_str(path.to_str().unwrap());
        val.push_str("/");
        let mut _resp = val.as_bytes(); // as utf8 bytes

        // make sure something is written
        if _resp.is_empty() {
            _resp = b" ";
        }

        // TODO(Kelosky): perhaps start daemon if not already started / socket connect error??

        let mut stream = TcpStream::connect(daemon_host).unwrap();
        stream.write(_resp).unwrap(); // write it
        
        let mut buf = String::new();
        stream.read_to_string(&mut buf)?; // get response
        println!("{}", buf); // print it

        stream.shutdown(Shutdown::Both)?; // terminate
    }

    Ok(())
}
