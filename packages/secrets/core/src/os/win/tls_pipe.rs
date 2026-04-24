use crate::os::error::KeyringError;
use schannel::schannel_cred::{Direction, SchannelCred};
use schannel::tls_stream::{Builder, HandshakeError};
use std::net::TcpStream;
use std::io::{Read, Write};
use std::thread;
use windows_sys::Win32::System::Pipes::{CreateNamedPipeW, ConnectNamedPipe, PeekNamedPipe};
use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE, GetLastError, ERROR_PIPE_CONNECTED};

// Named pipe constants
const PIPE_ACCESS_DUPLEX: u32 = 0x00000003;
const PIPE_TYPE_BYTE: u32 = 0x00000000;
const PIPE_READMODE_BYTE: u32 = 0x00000000;
const PIPE_WAIT: u32 = 0x00000000;
const FILE_FLAG_FIRST_PIPE_INSTANCE: u32 = 0x00080000;

/// Map Windows Schannel HRESULT codes to their documented symbolic name and cause.
/// Values are verified against winapi/src/shared/winerror.rs.
fn schannel_error_hint(code: i32) -> &'static str {
    match code as u32 {
        0x80090322 => " [SEC_E_WRONG_PRINCIPAL: server name does not match the certificate CN/SAN]",
        0x80090325 => " [SEC_E_UNTRUSTED_ROOT: certificate chain issued by an untrusted authority — \
                        intermediate CA certificates may be missing from the Windows cert store]",
        0x80090326 => " [SEC_E_ILLEGAL_MESSAGE: malformed or unexpected TLS message during handshake]",
        0x80090327 => " [SEC_E_CERT_UNKNOWN: server does not recognize the client certificate]",
        0x80090328 => " [SEC_E_CERT_EXPIRED: a certificate in the chain has expired]",
        0x80090330 => " [SEC_E_DECRYPT_FAILURE: TLS record decryption failure]",
        0x80090331 => " [SEC_E_ALGORITHM_MISMATCH: no cipher suites in common with the server]",
        0x8009030E => " [SEC_E_NO_CREDENTIALS: no credentials found — \
                        certificate or private key may not be in the correct store]",
        0x800B0101 => " [CERT_E_EXPIRED: a certificate in the chain has expired]",
        0x800B0109 => " [CERT_E_UNTRUSTEDROOT: certificate chain terminated in an untrusted root]",
        0x800B010A => " [CERT_E_CHAINING: certificate chain could not be built to a trusted root — \
                        intermediate CA certificates may be missing from the Windows cert store]",
        0x800B0110 => " [CERT_E_WRONG_USAGE: certificate is not valid for client authentication]",
        _ => "",
    }
}

pub fn create_tls_pipe(
    remote_host: &String,
    remote_port: u16,
    cert_account: &String,
    reject_unauthorized: bool,
) -> Result<String, KeyringError> {
    // 1. Find the cert in the Windows cert store by subject name substring.
    //    find_certificate_by_subject returns a schannel CertContext (safe, owned).
    let cert = super::cert_store::find_certificate_by_subject(cert_account.as_str())?
        .ok_or_else(|| KeyringError::Os(format!("Certificate not found for account: {}", cert_account)))?;

    // 2. Create Schannel credentials with the cert
    let mut cred_builder = SchannelCred::builder();
    cred_builder.cert(cert);

    let creds = cred_builder.acquire(Direction::Outbound)
        .map_err(|e| KeyringError::Os(format!("Failed to acquire Schannel credentials: {}", e)))?;

    // 3. Create Windows Named Pipe
    let pipe_name_str = format!(r"\\.\pipe\zowe-tls-pipe-{}", uuid::Uuid::new_v4());
    let mut wide_name: Vec<u16> = pipe_name_str.encode_utf16().collect();
    wide_name.push(0);

    let pipe_handle = unsafe {
        CreateNamedPipeW(
            wide_name.as_ptr(),
            PIPE_ACCESS_DUPLEX | FILE_FLAG_FIRST_PIPE_INSTANCE,
            PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT,
            1, // Max instances
            16384, // out buffer size
            16384, // in buffer size
            0, // default timeout
            std::ptr::null(), // default security attributes
        )
    };

    if pipe_handle == INVALID_HANDLE_VALUE {
        let err = unsafe { GetLastError() };
        return Err(KeyringError::Os(format!("Failed to create named pipe. Error: {}", err)));
    }

    let remote_addr = format!("{}:{}", remote_host, remote_port);
    let host_name = remote_host.clone();
    let socket_path_ret = pipe_name_str.clone();

    // 4. Spawn background thread to proxy cleartext <-> TLS
    thread::spawn(move || {
        // Wait for Node to connect to the pipe
        let connected = unsafe { ConnectNamedPipe(pipe_handle, std::ptr::null_mut()) };
        if connected == 0 {
            let err = unsafe { GetLastError() };
            if err != ERROR_PIPE_CONNECTED {
                unsafe { CloseHandle(pipe_handle) };
                return;
            }
        }

        use std::os::windows::io::FromRawHandle;
        let mut local_stream = unsafe { std::fs::File::from_raw_handle(pipe_handle as *mut _) };

        macro_rules! fail_proxy {
            ($msg:expr) => {{
                let err_msg = format!("HTTP/1.1 502 Bad Gateway\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\n{}", $msg);
                let _ = local_stream.write_all(err_msg.as_bytes());
                // Attempt to read remaining data
                let mut _drain = [0u8; 1024];
                let mut bytes_avail = 0;
                let peek_success = unsafe {
                    PeekNamedPipe(
                        pipe_handle,
                        std::ptr::null_mut(),
                        0,
                        std::ptr::null_mut(),
                        &mut bytes_avail,
                        std::ptr::null_mut(),
                    )
                };
                if peek_success != 0 && bytes_avail > 0 {
                    let _ = local_stream.read(&mut _drain);
                }
                return;
            }};
        }

        let remote_stream = match TcpStream::connect(&remote_addr) {
            Ok(s) => s,
            Err(e) => fail_proxy!(format!("Failed to connect to remote {}: {}", remote_addr, e)),
        };

        let mut tls_builder = Builder::new();
        // domain() sets the SNI hostname for the TLS handshake
        tls_builder.domain(&host_name);
        tls_builder.verify_callback(move |validation_result| {
            if reject_unauthorized {
                validation_result.result()
            } else {
                Ok(())
            }
        });

        // Handshake uses blocking I/O; do NOT set a short read timeout before this
        let mut tls_stream = match tls_builder.connect(creds, remote_stream) {
            Ok(s) => s,
            Err(e) => {
                let hint = match &e {
                    HandshakeError::Failure(io_err) =>
                        schannel_error_hint(io_err.raw_os_error().unwrap_or(0) as i32),
                    _ => "",
                };
                fail_proxy!(format!("TLS connect failed with {}: {:?}{}", host_name, e, hint))
            }
        };

        // After handshake, set timeout for remote side only (TcpStream)
        let timeout = Some(std::time::Duration::from_millis(5));
        tls_stream.get_mut().set_read_timeout(timeout).unwrap_or(());

        let mut local_buf = [0u8; 16384];
        let mut remote_buf = [0u8; 16384];

        loop {
            let mut progress = false;

            // Peek local pipe before blocking read
            let mut bytes_avail = 0;
            let peek_success = unsafe {
                PeekNamedPipe(
                    pipe_handle,
                    std::ptr::null_mut(),
                    0,
                    std::ptr::null_mut(),
                    &mut bytes_avail,
                    std::ptr::null_mut(),
                )
            };

            if peek_success != 0 && bytes_avail > 0 {
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
                    Err(_) => break,
                }
            } else if peek_success == 0 {
                // Pipe broken / disconnected
                break;
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
        
        let mut _drain = [0u8; 1024];
        let mut bytes_avail = 0;
        let peek_success = unsafe {
            PeekNamedPipe(
                pipe_handle,
                std::ptr::null_mut(),
                0,
                std::ptr::null_mut(),
                &mut bytes_avail,
                std::ptr::null_mut(),
            )
        };
        if peek_success != 0 && bytes_avail > 0 {
            let _ = local_stream.read(&mut _drain);
        }
    });

    Ok(socket_path_ret)
}

