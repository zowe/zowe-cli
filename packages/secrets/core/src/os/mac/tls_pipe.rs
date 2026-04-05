use crate::os::error::KeyringError;
use crate::os::mac::keychain::SecKeychain;
use std::net::{TcpListener, TcpStream};
use std::thread;
use std::io::{Read, Write};
use security_framework::secure_transport::{ClientBuilder, ClientHandshakeError};

/// Map Apple Secure Transport OSStatus codes to their documented symbolic name and cause.
/// Values are verified against security-framework-sys/src/secure_transport.rs.
fn ssl_error_hint(code: i32) -> &'static str {
    match code {
        -9806 => " [errSSLClosedAbort: server aborted the handshake — \
                   client certificate or its chain was likely rejected; \
                   check that all intermediate CA certificates are present in the keychain]",
        -9807 => " [errSSLXCertChainInvalid: invalid or incomplete certificate chain]",
        -9808 => " [errSSLBadCert: bad certificate format or content]",
        -9813 => " [errSSLNoRootCert: certificate chain not anchored in a trusted root CA]",
        -9814 => " [errSSLCertExpired: a certificate in the chain has expired]",
        -9815 => " [errSSLCertNotYetValid: a certificate in the chain is not yet valid]",
        -9825 => " [errSSLPeerBadCert: server reported the client certificate is malformed]",
        -9826 => " [errSSLPeerUnsupportedCert: server does not support the client certificate type]",
        -9827 => " [errSSLPeerCertRevoked: server reported the client certificate as revoked]",
        -9829 => " [errSSLPeerCertUnknown: server does not recognize the client certificate]",
        -9831 => " [errSSLPeerUnknownCA: server cannot verify the certificate chain to a known CA — \
                   intermediate CA certificates may be missing from the keychain]",
        _ => "",
    }
}

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
    use security_framework::policy::SecPolicy;
    use security_framework::trust::SecTrust;

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
                            // Drain unread bytes before dropping local_stream. Without this,
                            // the kernel sends TCP RST for unread data and Node sees ECONNRESET
                            // instead of parsing the 502 response.
                            let _ = local_stream.set_read_timeout(Some(std::time::Duration::from_millis(200)));
                            let mut _drain = [0u8; 1024];
                            loop {
                                match local_stream.read(&mut _drain) {
                                    Ok(0) | Err(_) => break,
                                    Ok(_) => {}
                                }
                            }
                            return;
                        }};
                    }
            
            let remote_stream = match TcpStream::connect(&remote_addr) {
                Ok(s) => s,
                Err(e) => fail_proxy!(format!("Failed to connect to remote {}: {}", remote_addr, e)),
            };

            let mut builder = ClientBuilder::new();
            
            // Try to build the certificate chain to send along with the leaf certificate.
            // If the server requires intermediates, Secure Transport will only send what we provide.
            let mut chain = Vec::new();
            if let Ok(leaf_cert) = sf_identity.certificate() {
                let policy = SecPolicy::create_x509();
                if let Ok(mut trust) = SecTrust::create_with_certificates(&[leaf_cert], &[policy]) {
                    // Prevent macOS from stopping the chain early at a user-trusted intermediate CA.
                    // By setting anchors to empty and forcing anchor-only trust, SecTrust is forced
                    // to build the complete chain up to the root from the keychain.
                    let _ = trust.set_trust_anchor_certificates_only(true);
                    let _ = trust.set_anchor_certificates(&[]);
                    let _ = trust.evaluate_with_error();
                    
                    // We start from index 1 because index 0 is the leaf certificate,
                    // and `builder.identity`'s second argument requires only the intermediates.
                    #[allow(deprecated)]
                    for i in 1..trust.certificate_count() {
                        if let Some(cert) = trust.certificate_at_index(i) {
                            chain.push(cert);
                        }
                    }
                }
            }
            
            builder.identity(&sf_identity, &chain);

            if !reject_unauthorized {
                builder.danger_accept_invalid_certs(true);
            }

            // Handshake uses blocking I/O; do NOT set a short read timeout before this
            // or the mid-handshake recv() calls will time out and cause spurious retries.
            let mut tls_stream = match builder.handshake(&host_name, remote_stream) {
                Ok(s) => s,
                Err(e) => {
                    let hint = match &e {
                        ClientHandshakeError::Failure(err) => ssl_error_hint(err.code()),
                        _ => "",
                    };
                    fail_proxy!(format!("TLS handshake failed with {}: {:?}{}", host_name, e, hint))
                }
            };

            // After the handshake, set a short read timeout on both sides of the proxy.
            // This lets each read() return promptly when there is no data, without
            // blocking the single-threaded loop indefinitely.
            // IMPORTANT: do NOT use set_nonblocking(true) here — write_all() on a
            // non-blocking socket fails with WouldBlock for larger payloads, which
            // causes the loop to break early and the OS to send RST (ECONNRESET).
            let timeout = Some(std::time::Duration::from_millis(5));
            local_stream.set_read_timeout(timeout).unwrap_or(());
            tls_stream.get_mut().set_read_timeout(timeout).unwrap_or(());
            
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

            // Drain any remaining bytes from Node's side before local_stream is dropped.
            // This ensures the OS sends FIN instead of RST, preventing ECONNRESET on the
            // Node side when the server closes the connection (e.g., after a full response).
            let _ = local_stream.set_read_timeout(Some(std::time::Duration::from_millis(50)));
            let mut _drain = [0u8; 1024];
            loop {
                match local_stream.read(&mut _drain) {
                    Ok(0) | Err(_) => break,
                    Ok(_) => {}
                }
            }
        }
    });
    
    Ok(local_port)
}