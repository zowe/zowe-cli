use crate::os::error::KeyringError;
use schannel::schannel_cred::{Direction, SchannelCred};
use schannel::tls_stream::Builder;
use std::net::{TcpListener, TcpStream};
use std::io::{Read, Write};
use std::thread;

pub fn create_tls_pipe(
    remote_host: &String,
    remote_port: u16,
    cert_account: &String,
    reject_unauthorized: bool,
) -> Result<u16, KeyringError> {
    // 1. Find the cert in the Windows cert store by subject name substring.
    //    find_certificate_by_subject returns a schannel CertContext (safe, owned).
    let cert = super::cert_store::find_certificate_by_subject(cert_account.as_str())?
        .ok_or_else(|| KeyringError::Os(format!("Certificate not found for account: {}", cert_account)))?;

    // 2. Create Schannel credentials with the cert
    let mut cred_builder = SchannelCred::builder();
    cred_builder.cert(cert);

    let creds = cred_builder.acquire(Direction::Outbound)
        .map_err(|e| KeyringError::Os(format!("Failed to acquire Schannel credentials: {}", e)))?;

    // 3. Start local TCP listener on ephemeral port
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| KeyringError::Os(format!("Failed to bind local TCP listener: {}", e)))?;
    let local_port = listener.local_addr().map_err(|e| KeyringError::Os(e.to_string()))?.port();

    let remote_addr = format!("{}:{}", remote_host, remote_port);
    let host_name = remote_host.clone();

    // 4. Spawn background thread to proxy cleartext <-> TLS
    thread::spawn(move || {
        if let Ok((mut local_stream, _)) = listener.accept() {
            drop(listener);

            macro_rules! fail_proxy {
                ($msg:expr) => {{
                    let err_msg = format!("HTTP/1.1 502 Bad Gateway\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\n{}", $msg);
                    let _ = local_stream.write_all(err_msg.as_bytes());
                    return;
                }};
            }

            let remote_stream = match TcpStream::connect(&remote_addr) {
                Ok(s) => {
                    // Short read timeout so the proxy loop doesn't block forever on tls_stream.read()
                    let _ = s.set_read_timeout(Some(std::time::Duration::from_millis(5)));
                    s
                },
                Err(e) => fail_proxy!(format!("Failed to connect to remote {}: {}", remote_addr, e)),
            };

            let mut tls_builder = Builder::new();
            // domain() sets the SNI hostname for the TLS handshake
            tls_builder.domain(&host_name);
            tls_builder.verify_callback(move |validation_result| {
                if reject_unauthorized {
                    // Pass through the OS chain-validation result directly
                    validation_result.result()
                } else {
                    Ok(())
                }
            });

            let mut tls_stream = match tls_builder.connect(creds, remote_stream) {
                Ok(s) => s,
                Err(e) => fail_proxy!(format!("TLS connect failed with {}: {:?}", host_name, e)),
            };

            local_stream.set_nonblocking(true).unwrap_or(());
            tls_stream.get_mut().set_nonblocking(true).unwrap_or(());

            let mut local_buf = [0u8; 16384];
            let mut remote_buf = [0u8; 16384];

            loop {
                let mut progress = false;

                match local_stream.read(&mut local_buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        if tls_stream.write_all(&local_buf[..n]).is_err() {
                            break;
                        }
                        if tls_stream.flush().is_err() {
                            break;
                        }
                        progress = true;
                    }
                    Err(e) if e.kind() == std::io::ErrorKind::WouldBlock || e.kind() == std::io::ErrorKind::TimedOut => {}
                    Err(_) => break,
                }

                match tls_stream.read(&mut remote_buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        if local_stream.write_all(&remote_buf[..n]).is_err() {
                            break;
                        }
                        if local_stream.flush().is_err() {
                            break;
                        }
                        progress = true;
                    }
                    Err(e) if e.kind() == std::io::ErrorKind::WouldBlock || e.kind() == std::io::ErrorKind::TimedOut => {}
                    Err(_) => break,
                }

                if !progress {
                    thread::sleep(std::time::Duration::from_millis(5));
                }
            }
        }
    });

    Ok(local_port)
}

