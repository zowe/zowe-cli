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

// NOTE: This suite deliberately does NOT mock "net". It is a canary that exercises a real
// socket connection so that it fails the moment Node.js changes the internal shape that
// DaemonClient.checkPeerCredentials() depends on to obtain the OS peer-credential handle.
//
// DaemonClient reads the connection handle as `(socket as any)._handle.fd`. That property
// path is a Node.js internal, not part of the public API, so a Node upgrade could rename or
// restructure it. If that happens, the daemon would silently fail every peer-credential
// check (failing closed) and reject all clients. These tests give us early warning by
// asserting the exact property path resolves to a usable handle on a freshly accepted socket.

import * as net from "net";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

/** The exact accessor DaemonClient uses; kept in one place so the canary mirrors production. */
function readPeerHandle(socket: net.Socket): unknown {
    return (socket as any)?._handle?.fd;
}

describe("DaemonClient socket handle (Node internals canary)", () => {
    const isWin32 = process.platform === "win32";

    // Build a server-bound listen address that matches how the daemon binds in production:
    // a named pipe on Windows, a Unix domain socket file elsewhere.
    const makeListenAddress = (): { address: string; cleanup: () => void } => {
        if (isWin32) {
            // Named pipes are not files, so there is nothing to clean up on disk.
            return { address: `\\\\.\\pipe\\zowe-daemon-canary-${process.pid}`, cleanup: () => { /* no-op */ } };
        }
        const sockPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "zowe-daemon-canary-")), "daemon.sock");
        const cleanup = () => {
            try { fs.rmSync(path.dirname(sockPath), { recursive: true, force: true }); } catch { /* best effort */ }
        };
        return { address: sockPath, cleanup };
    };

    // Stand up a server, connect a client, and resolve with the server-side accepted socket
    // (this is the socket object DaemonClient is constructed with).
    const acceptOneConnection = (): Promise<{ serverSocket: net.Socket; teardown: () => void }> => {
        const { address, cleanup } = makeListenAddress();
        return new Promise((resolve, reject) => {
            const server = net.createServer();
            let client: net.Socket;
            server.on("error", reject);
            server.on("connection", (serverSocket) => {
                resolve({
                    serverSocket,
                    teardown: () => {
                        serverSocket.destroy();
                        client.destroy();
                        server.close();
                        cleanup();
                    }
                });
            });
            // Only dial the client once the server is actually listening, to avoid an ENOENT race.
            server.listen(address, () => {
                client = net.createConnection(address);
                client.on("error", reject);
            });
        });
    };

    it("exposes a usable peer handle at socket._handle.fd on a connected socket", async () => {
        const { serverSocket, teardown } = await acceptOneConnection();
        try {
            const handle = readPeerHandle(serverSocket);

            // The accessor must resolve to a real value. `undefined` here means Node either
            // renamed `_handle`, renamed `.fd`, or stopped populating it -- the production
            // peer-credential check would break, so this assertion is the alarm.
            expect(handle).toBeDefined();
            expect(typeof handle).toBe("number");

            const fd = handle as number;
            // A valid descriptor/HANDLE is never the libuv "no fd" sentinel (-1).
            expect(fd).not.toBe(-1);
            if (!isWin32) {
                // On POSIX this is a real file descriptor and must be non-negative.
                expect(fd).toBeGreaterThanOrEqual(0);
            }
        } finally {
            teardown();
        }
    });

    it("returns undefined (not a throw) when the handle is gone after the socket is destroyed", async () => {
        const { serverSocket, teardown } = await acceptOneConnection();
        try {
            serverSocket.destroy();
            // After destruction `_handle` is nulled by Node; the optional-chaining accessor
            // DaemonClient uses must degrade to `undefined` rather than throw, so that the
            // check fails closed gracefully instead of crashing the daemon.
            await new Promise((r) => serverSocket.once("close", r));
            expect(readPeerHandle(serverSocket)).toBeUndefined();
        } finally {
            teardown();
        }
    });
});
