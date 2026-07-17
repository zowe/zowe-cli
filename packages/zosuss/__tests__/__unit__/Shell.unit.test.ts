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

/* eslint-disable jest/expect-expect */
import { Client } from "ssh2";
import { Shell } from "../../src/Shell";
import { SshSession } from "../../src/SshSession";
import { ZosUssMessages } from "../../src/constants/ZosUss.messages";
import { EventEmitter } from "events";
import { join } from "path";
jest.mock("ssh2");

// Mock functions for SSH
const fakeSshSession = new SshSession({
    hostname: "localhost",
    port: 22,
    user: "",
    password: ""
});
const fakeSshSessionPrivateKey = new SshSession({
    hostname: "localhost",
    port: 22,
    user: "",
    privateKey: join(__dirname, "__resources__", "fake_id_rsa")
});
const mockClient: any = new EventEmitter();
const mockConnect = jest.fn().mockImplementation(() => {
    mockClient.emit("ready");
});
const mockStreamEnd = jest.fn();
const mockStreamWrite = jest.fn();
const mockStream: any = new EventEmitter();
mockStream.end = mockStreamEnd;
mockStream.write = mockStreamWrite;

const mockShell = jest.fn().mockImplementation((callback) => {
    callback(null, mockStream);
    mockStream.emit("data", `\n${Shell.startCmdFlag}\r\n`);
    mockStream.emit("data", `$ commandtest\r\n`);
    mockStream.emit("data", `output\n\rerror`);
    mockStream.emit("data", `$ exit\r\n`);
    mockStream.emit("close");
});


(Client as any).mockImplementation(() => {
    mockClient.connect = mockConnect;
    mockClient.shell = mockShell;
    mockClient.end = jest.fn();
    return mockClient;
});

const stdoutHandler = jest.fn();

function checkMockFunctionsWithCommand(command: string) {
    expect(mockConnect).toBeCalled();
    expect(mockShell).toBeCalled();

    // Check the stream.end() function is called with an argument containing the SSH command
    expect(mockStreamWrite.mock.calls[0][0]).toMatch(command);
    expect(mockStreamWrite.mock.calls[0][0]).toContain(Shell.startCmdFlag);
    expect(mockStreamEnd).toHaveBeenCalled();
    expect(stdoutHandler).not.toEqual("");
    expect(stdoutHandler).toHaveBeenCalledWith("\rerror");
    expect(stdoutHandler).not.toContain(command);
    // Should execute ssh command and not include the input command in output
    expect(stdoutHandler).not.toContain('\r<');
    expect(stdoutHandler).not.toContain('\r\n$ '+ command);
}

describe("Shell", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Should execute ssh command", async () => {
        const command = "commandtest";
        await Shell.executeSsh(fakeSshSession, command, stdoutHandler);

        checkMockFunctionsWithCommand(command);
    });

    it("Should execute ssh command with privateKey", async () => {
        const command = "commandtest";
        await Shell.executeSsh(fakeSshSessionPrivateKey, command, stdoutHandler);

        checkMockFunctionsWithCommand(command);
    });

    it("Should execute ssh command with cwd option", async () => {
        const cwd = "/";
        const command = "commandtest";
        await Shell.executeSshCwd(fakeSshSession, command, cwd, stdoutHandler);

        checkMockFunctionsWithCommand(command);
    });

    describe("Host key verification", () => {
        // Build a realistic SSH public key blob: 4-byte big-endian length, algorithm name, then key data
        function makeKeyBlob(algorithm: string, keyData = "key-material"): Buffer {
            const nameBuf = Buffer.from(algorithm, "ascii");
            const lenBuf = Buffer.alloc(4);
            lenBuf.writeUInt32BE(nameBuf.length, 0);
            return Buffer.concat([lenBuf, nameBuf, Buffer.from(keyData)]);
        }

        const fakeKey = makeKeyBlob("ssh-ed25519");
        const fakeKeyB64 = fakeKey.toString("base64");

        function getHostVerifier(): (keyBuf: Buffer, cb: (valid: boolean) => void) => void {
            return mockConnect.mock.calls[0][0].hostVerifier;
        }

        function getConnectConfig(): any {
            return mockConnect.mock.calls[0][0];
        }

        it("should compute an OpenSSH-style SHA256 fingerprint", () => {
            const fingerprint = Shell.getHostKeyFingerprint(fakeKey);
            expect(fingerprint).toMatch(/^SHA256:[A-Za-z0-9+/]+$/);
            expect(fingerprint).not.toContain("=");
        });

        it("should accept any key when insecure is true", async () => {
            const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "", insecure: true });
            await Shell.executeSsh(session, "commandtest", stdoutHandler);
            const cb = jest.fn();
            getHostVerifier()(fakeKey, cb);
            expect(cb).toHaveBeenCalledWith(true);
        });

        describe("host key algorithm", () => {
            it("should parse the algorithm name out of a key blob", () => {
                expect(Shell.getHostKeyAlgorithm(makeKeyBlob("ssh-ed25519"))).toBe("ssh-ed25519");
                expect(Shell.getHostKeyAlgorithm(makeKeyBlob("ssh-rsa"))).toBe("ssh-rsa");
                expect(Shell.getHostKeyAlgorithm(makeKeyBlob("ecdsa-sha2-nistp256"))).toBe("ecdsa-sha2-nistp256");
            });

            it("should return undefined for a blob that cannot be parsed", () => {
                expect(Shell.getHostKeyAlgorithm(Buffer.alloc(0))).toBeUndefined();
                expect(Shell.getHostKeyAlgorithm(Buffer.from([0, 0]))).toBeUndefined();
                // Length prefix larger than the buffer
                const bogus = Buffer.alloc(8);
                bogus.writeUInt32BE(9999, 0);
                expect(Shell.getHostKeyAlgorithm(bogus)).toBeUndefined();
            });

            it("should request the pinned key's algorithm so the same key type is presented", async () => {
                const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "", hostKey: fakeKeyB64 });
                await Shell.executeSsh(session, "commandtest", stdoutHandler);
                expect(getConnectConfig().algorithms).toEqual({ serverHostKey: ["ssh-ed25519"] });
            });

            it("should not pin an algorithm when no host key is pinned", async () => {
                const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "" });
                await Shell.executeSsh(session, "commandtest", stdoutHandler);
                expect(getConnectConfig().algorithms).toBeUndefined();
            });

            it("should not pin an algorithm when insecure is true", async () => {
                const session = new SshSession({
                    hostname: "localhost", port: 22, user: "", password: "", hostKey: fakeKeyB64, insecure: true
                });
                await Shell.executeSsh(session, "commandtest", stdoutHandler);
                expect(getConnectConfig().algorithms).toBeUndefined();
            });
        });

        it("should accept a presented key that matches the pinned hostKey", async () => {
            const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "", hostKey: fakeKeyB64 });
            await Shell.executeSsh(session, "commandtest", stdoutHandler);
            const cb = jest.fn();
            getHostVerifier()(fakeKey, cb);
            expect(cb).toHaveBeenCalledWith(true);
        });

        it("should reject an unknown key when no interactive verifier is set", async () => {
            const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "" });
            await Shell.executeSsh(session, "commandtest", stdoutHandler);
            const cb = jest.fn();
            getHostVerifier()(fakeKey, cb);
            expect(cb).toHaveBeenCalledWith(false);
        });

        it("should delegate an unknown key to the interactive verifier (changed=false)", async () => {
            const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "" });
            session.hostKeyVerifier = jest.fn().mockResolvedValue(true);
            await Shell.executeSsh(session, "commandtest", stdoutHandler);
            const cb = jest.fn();
            getHostVerifier()(fakeKey, cb);
            await new Promise(process.nextTick);
            expect(session.hostKeyVerifier).toHaveBeenCalledWith(
                expect.objectContaining({ key: fakeKeyB64, changed: false })
            );
            expect(cb).toHaveBeenCalledWith(true);
        });

        it("should mark changed=true when the presented key differs from the pinned key", async () => {
            const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "", hostKey: "a-different-pinned-key" });
            session.hostKeyVerifier = jest.fn().mockResolvedValue(true);
            await Shell.executeSsh(session, "commandtest", stdoutHandler);
            const cb = jest.fn();
            getHostVerifier()(fakeKey, cb);
            await new Promise(process.nextTick);
            expect(session.hostKeyVerifier).toHaveBeenCalledWith(
                expect.objectContaining({ key: fakeKeyB64, changed: true })
            );
            expect(cb).toHaveBeenCalledWith(true);
        });

        it("should reject when the interactive verifier declines the key", async () => {
            const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "" });
            session.hostKeyVerifier = jest.fn().mockResolvedValue(false);
            await Shell.executeSsh(session, "commandtest", stdoutHandler);
            const cb = jest.fn();
            getHostVerifier()(fakeKey, cb);
            await new Promise(process.nextTick);
            expect(cb).toHaveBeenCalledWith(false);
        });
    });

    describe("Error handling", () => {
        it("should fail when password is expired", async () => {
            mockShell.mockImplementationOnce((callback) => {
                callback(null, mockStream);
                mockStream.emit("data", Shell.expiredPasswordFlag);
                mockStream.emit("exit", 0);
            });
            let caughtError;

            try {
                await Shell.executeSsh(fakeSshSession, "commandtest", stdoutHandler);
            } catch (error) {
                caughtError = error;
            }

            expect(mockConnect).toBeCalled();
            expect(mockShell).toBeCalled();
            expect(mockStreamEnd).toBeCalled();
            expect(caughtError.message).toBe(ZosUssMessages.expiredPassword.message);
        });

        it("should fail when all auth methods failed", async () => {
            mockShell.mockImplementationOnce((callback) => {
                callback(null, mockStream);
                mockClient.emit("error", ZosUssMessages.allAuthMethodsFailed);
                mockStream.emit("exit", 0);
            });
            let caughtError;

            try {
                await Shell.executeSsh(fakeSshSession, "commandtest", stdoutHandler);
            } catch (error) {
                caughtError = error;
            }

            expect(mockConnect).toBeCalled();
            expect(mockShell).toBeCalled();
            expect(mockStreamEnd).toBeCalled();
            expect(caughtError.message).toBe(ZosUssMessages.allAuthMethodsFailed.message);
        });

        it("should fail when handshake times out", async () => {
            mockShell.mockImplementationOnce((callback) => {
                callback(null, mockStream);
                mockClient.emit("error", ZosUssMessages.handshakeTimeout);
                mockStream.emit("exit", 0);
            });
            let caughtError;

            try {
                await Shell.executeSsh(fakeSshSession, "commandtest", stdoutHandler);
            } catch (error) {
                caughtError = error;
            }

            expect(mockConnect).toBeCalled();
            expect(mockShell).toBeCalled();
            expect(mockStreamEnd).toBeCalled();
            expect(caughtError.message).toBe(ZosUssMessages.handshakeTimeout.message);
        });

        it("should fail when connection is refused", async () => {
            mockShell.mockImplementationOnce((callback) => {
                callback(null, mockStream);
                mockClient.emit("error", new Error(Shell.connRefusedFlag));
                mockStream.emit("exit", 0);
            });
            let caughtError;

            try {
                await Shell.executeSsh(fakeSshSession, "commandtest", stdoutHandler);
            } catch (error) {
                caughtError = error;
            }

            expect(mockConnect).toBeCalled();
            expect(mockShell).toBeCalled();
            expect(mockStreamEnd).toBeCalled();
            expect(caughtError.message).toContain(ZosUssMessages.connectionRefused.message);
        });

        it("should fail when there is unexpected error", async () => {
            mockShell.mockImplementationOnce((callback) => {
                callback(null, mockStream);
                mockClient.emit("error", new Error());
                mockStream.emit("exit", 0);
            });
            let caughtError;

            try {
                await Shell.executeSsh(fakeSshSession, "commandtest", stdoutHandler);
            } catch (error) {
                caughtError = error;
            }

            expect(mockConnect).toBeCalled();
            expect(mockShell).toBeCalled();
            expect(mockStreamEnd).toBeCalled();
            expect(caughtError.message).toContain(ZosUssMessages.unexpected.message);
        });
    });
});
