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

//! OS-level peer-credential check for the Zowe daemon.
//!
//! The comparison is performed natively (rather than returning a raw identity to
//! JavaScript) because the notion of "identity" is not portable: POSIX systems use a
//! numeric UID, while Windows uses a variable-length security identifier (SID) that has
//! no meaningful numeric representation. Returning a single boolean keeps the JS surface
//! uniform and keeps the platform-specific comparison logic in one place.
//!
//! * Linux       — getsockopt(fd, SOL_SOCKET, SO_PEERCRED) -> ucred, compare uid
//! * macOS / BSD  — getpeereid(fd) -> uid, compare uid
//! * Windows      — GetNamedPipeClientProcessId -> OpenProcess -> OpenProcessToken ->
//!                  GetTokenInformation(TokenUser) -> EqualSid against our own token SID

use napi_derive::napi;

/// Returns true when the process on the other end of the connection is owned by the same
/// OS user as the current (daemon) process.
///
/// `handle` is the platform-native connection identifier: a socket file descriptor on
/// POSIX, or the named-pipe `HANDLE` on Windows. It is typed as `i64` so that a 64-bit
/// Windows `HANDLE` survives the round trip from JavaScript without truncation.
#[cfg(unix)]
#[napi]
fn is_peer_current_user(handle: i64) -> napi::Result<bool> {
    let peer_uid = peer_uid(handle as i32)?;
    let current_uid = unsafe { libc::getuid() };
    Ok(peer_uid == current_uid)
}

/// Resolve the effective UID of the peer connected on a Unix domain socket fd.
#[cfg(unix)]
fn peer_uid(fd: i32) -> napi::Result<u32> {
    // Linux path: SO_PEERCRED fills a `ucred` struct with { pid, uid, gid }.
    #[cfg(target_os = "linux")]
    {
        use libc::{getsockopt, socklen_t, ucred, SOL_SOCKET, SO_PEERCRED};
        let mut cred: ucred = unsafe { std::mem::zeroed() };
        let mut len = std::mem::size_of::<ucred>() as socklen_t;
        let ret = unsafe {
            getsockopt(
                fd,
                SOL_SOCKET,
                SO_PEERCRED,
                &mut cred as *mut _ as *mut libc::c_void,
                &mut len,
            )
        };
        if ret != 0 {
            return Err(napi::Error::from_reason(format!(
                "getsockopt SO_PEERCRED failed: {}",
                std::io::Error::last_os_error()
            )));
        }
        Ok(cred.uid)
    }

    // macOS / BSD path: getpeereid returns uid and gid directly.
    #[cfg(not(target_os = "linux"))]
    {
        let mut uid: libc::uid_t = 0;
        let mut gid: libc::gid_t = 0;
        let ret = unsafe { libc::getpeereid(fd, &mut uid, &mut gid) };
        if ret != 0 {
            return Err(napi::Error::from_reason(format!(
                "getpeereid failed: {}",
                std::io::Error::last_os_error()
            )));
        }
        Ok(uid)
    }
}

/// Windows: compare the named-pipe client's token user SID against our own.
#[cfg(windows)]
#[napi]
fn is_peer_current_user(handle: i64) -> napi::Result<bool> {
    use std::ffi::c_void;
    use windows_sys::Win32::Foundation::{CloseHandle, GetLastError, HANDLE};
    use windows_sys::Win32::Security::{
        EqualSid, GetTokenInformation, TokenUser, TOKEN_QUERY, TOKEN_USER,
    };
    use windows_sys::Win32::System::Pipes::GetNamedPipeClientProcessId;
    use windows_sys::Win32::System::Threading::{
        GetCurrentProcess, OpenProcess, OpenProcessToken, PROCESS_QUERY_LIMITED_INFORMATION,
    };

    // Read the TokenUser information for `process` into an owned byte buffer. The returned
    // buffer backs the `SID` pointer inside the leading TOKEN_USER, so it must outlive any
    // use of that SID (hence we return the buffer, not the pointer).
    unsafe fn token_user_buf(process: HANDLE) -> Result<Vec<u8>, String> {
        let mut token: HANDLE = 0;
        if OpenProcessToken(process, TOKEN_QUERY, &mut token) == 0 {
            return Err(format!("OpenProcessToken failed (code {})", GetLastError()));
        }
        // First call sizes the buffer; it is expected to "fail" with ERROR_INSUFFICIENT_BUFFER.
        let mut needed: u32 = 0;
        GetTokenInformation(token, TokenUser, std::ptr::null_mut(), 0, &mut needed);
        let mut buf = vec![0u8; needed as usize];
        let ok = GetTokenInformation(
            token,
            TokenUser,
            buf.as_mut_ptr() as *mut c_void,
            needed,
            &mut needed,
        );
        let last_err = GetLastError();
        CloseHandle(token);
        if ok == 0 {
            return Err(format!("GetTokenInformation failed (code {})", last_err));
        }
        Ok(buf)
    }

    unsafe {
        let pipe_handle = handle as HANDLE;

        // 1. Resolve the PID of the process on the client end of the pipe.
        let mut client_pid: u32 = 0;
        if GetNamedPipeClientProcessId(pipe_handle, &mut client_pid) == 0 {
            return Err(napi::Error::from_reason(format!(
                "GetNamedPipeClientProcessId failed (code {})",
                GetLastError()
            )));
        }

        // 2. Open that process with the minimal rights needed to read its token.
        let client_proc = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, client_pid);
        if client_proc == 0 {
            return Err(napi::Error::from_reason(format!(
                "OpenProcess failed (code {})",
                GetLastError()
            )));
        }

        // 3. Pull the user SID of both the client and ourselves, then compare.
        let client_res = token_user_buf(client_proc);
        CloseHandle(client_proc);
        let client_buf = client_res.map_err(napi::Error::from_reason)?;

        // GetCurrentProcess() returns a pseudo-handle that must not be closed.
        let current_buf =
            token_user_buf(GetCurrentProcess()).map_err(napi::Error::from_reason)?;

        let client_sid = (*(client_buf.as_ptr() as *const TOKEN_USER)).User.Sid;
        let current_sid = (*(current_buf.as_ptr() as *const TOKEN_USER)).User.Sid;

        Ok(EqualSid(client_sid, current_sid) != 0)
    }
}
