use crate::os::error::KeyringError;
use crate::os::mac::keychain::SecKeychain;
use std::net::{TcpListener, TcpStream};
use std::thread;
use std::io::{Read, Write};
use security_framework::secure_transport::ClientBuilder;

pub fn create_tls_pipe(
    remote_host: &String,
    remote_port: u16,
    cert_account: &String,
    reject_unauthorized: bool,
) -> Result<u16, KeyringError> {
    let keychain = SecKeychain::default().unwrap();
    let identity = keychain.find_identity(cert_account.as_str())
        .map_err(|e| KeyringError::Os(format!("Identity not found: {:?}", e.message())))?;
    
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| KeyringError::Os(e.to_string()))?;
    let local_port = listener.local_addr().unwrap().port();
    
    let remote_addr = format!("{}:{}", remote_host, remote_port);
    let host_name = remote_host.clone();
    
    use core_foundation::base::{TCFType, CFRetain};
    use security_framework::identity::SecIdentity;

    let raw_identity = identity.as_concrete_TypeRef();
    // CFRetain increments the refcount before we hand ownership to sf_identity via
    // wrap_under_create_rule. When `identity` is dropped at the end of this function
    // (decrement), sf_identity still holds a valid +1 reference in the spawned thread.
    unsafe { CFRetain(raw_identity as *const _); }
    let sf_identity = unsafe { SecIdentity::wrap_under_create_rule(raw_identity as *mut _) };
    
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
                    // Set read timeout to 5ms so tls_stream.read() doesn't block forever
                    // and deadlock the single-threaded proxy loop!
                    let _ = s.set_read_timeout(Some(std::time::Duration::from_millis(5)));
                    s
                },
                Err(e) => fail_proxy!(format!("Failed to connect to remote {}: {}", remote_addr, e)),
            };
            
            let mut builder = ClientBuilder::new();
            builder.identity(&sf_identity, &[]); // identity and certs
            
            if !reject_unauthorized {
                builder.danger_accept_invalid_certs(true);
            }
            
            let mut tls_stream = match builder.handshake(&host_name, remote_stream) {
                Ok(s) => s,
                Err(e) => fail_proxy!(format!("TLS handshake failed with {}: {:?}", host_name, e)),
            };
            
            local_stream.set_nonblocking(true).unwrap_or(());
            // tls_stream from security-framework doesn't have a direct `get_mut()` sometimes.
            // Let's see if we can do bi-directional blocking/non-blocking copy
            
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
                
                // Since tls_stream is blocking, we use set_read_timeout if possible, but 
                // security-framework doesn't expose the underlying socket easily to set it to non-blocking.
                // Wait! If remote_stream was already connected, can we set it to non-blocking BEFORE handshake?
                // Or AFTER?
                
                // To avoid hanging on read, we'll try reading
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