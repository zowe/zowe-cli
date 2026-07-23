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
    mockClient.end = jest.fn().mockReturnValue(mockClient);
    return mockClient;
});

const stdoutHandler = jest.fn();

function checkMockFunctionsWithCommand(command: string) {
    expect(mockConnect).toHaveBeenCalled();
    expect(mockShell).toHaveBeenCalled();

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

    it("Should execute ssh command with cwd option and no extra characters in the output", async () => {
        const cwd = "/";
        const command = "commandtest";
        await Shell.executeSshCwd(fakeSshSession, command, cwd, stdoutHandler, true);

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
            // The config passed to conn.connect() carries the hostVerifier callback
            return mockConnect.mock.calls[0][0].hostVerifier;
        }

        function getConnectConfig(): any {
            return mockConnect.mock.calls[0][0];
        }

        it("should compute an OpenSSH-style SHA256 fingerprint", () => {
            const fingerprint = Shell.getHostKeyFingerprint(fakeKey);
            expect(fingerprint).toMatch(/^SHA256:[A-Za-z0-9+/]+$/);
            expect(fingerprint).not.toContain("="); // padding stripped
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

            it("should request all RSA variants when the pinned key is ssh-rsa", async () => {
                const rsaKey = makeKeyBlob("ssh-rsa").toString("base64");
                const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "", hostKey: rsaKey });
                await Shell.executeSsh(session, "commandtest", stdoutHandler);
                expect(getConnectConfig().algorithms).toEqual({ serverHostKey: ["rsa-sha2-512", "rsa-sha2-256", "ssh-rsa"] });
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

        it("should reject when the interactive verifier throws", async () => {
            const session = new SshSession({ hostname: "localhost", port: 22, user: "", password: "" });
            session.hostKeyVerifier = jest.fn().mockRejectedValue(new Error("prompt failed"));
            await Shell.executeSsh(session, "commandtest", stdoutHandler);
            const cb = jest.fn();
            getHostVerifier()(fakeKey, cb);
            await new Promise(process.nextTick);
            expect(cb).toHaveBeenCalledWith(false);
        });
    });

    describe("Connection validation", () => {
        it("should determine that the connection is valid", async () => {
            const response = await Shell.isConnectionValid(fakeSshSession);
            expect(response).toBe(true);
        });
        it("should determine that the connection is invalid", async () => {
            mockConnect.mockImplementationOnce(() => {
                mockClient.emit("error", new Error(Shell.connRefusedFlag));
                mockStream.emit("exit", 0);
            });
            const response = await Shell.isConnectionValid(fakeSshSession);
            expect(response).toBe(false);
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

            expect(mockConnect).toHaveBeenCalled();
            expect(mockShell).toHaveBeenCalled();
            expect(mockStreamEnd).toHaveBeenCalled();
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

            expect(mockConnect).toHaveBeenCalled();
            expect(mockShell).toHaveBeenCalled();
            expect(mockStreamEnd).toHaveBeenCalled();
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

            expect(mockConnect).toHaveBeenCalled();
            expect(mockShell).toHaveBeenCalled();
            expect(mockStreamEnd).toHaveBeenCalled();
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

            expect(mockConnect).toHaveBeenCalled();
            expect(mockShell).toHaveBeenCalled();
            expect(mockStreamEnd).toHaveBeenCalled();
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

            expect(mockConnect).toHaveBeenCalled();
            expect(mockShell).toHaveBeenCalled();
            expect(mockStreamEnd).toHaveBeenCalled();
            expect(caughtError.message).toContain(ZosUssMessages.unexpected.message);
        });
    });
    describe("Exec mode methods", () => {
        const mockExec = jest.fn();

        beforeEach(() => {
            // Clear all mocks before each test
            jest.clearAllMocks();

            // Setup mock for exec method with stderr
            mockExec.mockImplementation((command, callback) => {
                const testStream: any = new EventEmitter();
                testStream.stderr = new EventEmitter();
                testStream.end = jest.fn();
                testStream.write = jest.fn();

                callback(null, testStream);
                testStream.emit("data", "exec output");
                testStream.emit("exit", 0);
                testStream.emit("close");
            });
            mockClient.exec = mockExec;
        });

        it("Should execute command using exec mode", async () => {
            const command = "ls -la";
            const result = await Shell.executeExec(fakeSshSession, command, stdoutHandler);

            expect(mockConnect).toHaveBeenCalled();
            expect(mockExec).toHaveBeenCalledWith(command, expect.any(Function));
            expect(result).toBe(0);
        });

        it("Should execute command with privateKey using exec mode", async () => {
            const command = "pwd";
            const result = await Shell.executeExec(fakeSshSessionPrivateKey, command, stdoutHandler);

            expect(mockConnect).toHaveBeenCalled();
            expect(mockExec).toHaveBeenCalledWith(command, expect.any(Function));
            expect(result).toBe(0);
        });

        it("Should execute command with cwd option using exec mode", async () => {
            const command = "pwd";
            const cwd = "/tmp";
            const result = await Shell.executeExecCwd(fakeSshSession, command, cwd, stdoutHandler);

            expect(mockConnect).toHaveBeenCalled();
            expect(mockExec).toHaveBeenCalledWith(`cd '${cwd}' && ${command}`, expect.any(Function));
            expect(result).toBe(0);
        });

        it("Should call executeExec when useExecMode is true in executeSsh", async () => {
            const command = "echo test";
            const result = await Shell.executeSsh(fakeSshSession, command, stdoutHandler, false, true);

            expect(mockExec).toHaveBeenCalled();
            expect(result).toBe(0);
        });

        it("Should call executeExecCwd when useExecMode is true in executeSshCwd", async () => {
            const command = "ls";
            const cwd = "/tmp";
            const result = await Shell.executeSshCwd(fakeSshSession, command, cwd, stdoutHandler, false, true);

            expect(mockExec).toHaveBeenCalledWith(`cd '${cwd}' && ${command}`, expect.any(Function));
            expect(result).toBe(0);
        });

        describe("Error handling in exec mode", () => {
            it("should handle expired password in exec mode", async () => {
                mockExec.mockImplementationOnce((command, callback) => {
                    const testStream: any = new EventEmitter();
                    testStream.stderr = new EventEmitter();
                    testStream.end = jest.fn();
                    testStream.write = jest.fn();
                    testStream.removeAllListeners = jest.fn();
                    testStream.close = jest.fn();

                    callback(null, testStream);
                    testStream.emit("data", Shell.expiredPasswordFlag + " Password expired");
                    testStream.emit("exit", 0);
                });

                let caughtError;
                try {
                    await Shell.executeExec(fakeSshSession, "ls", stdoutHandler);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError.message).toBe(ZosUssMessages.expiredPassword.message);
            });

            it("should handle stderr data in exec mode", async () => {
                const stderrHandler = jest.fn();
                // Clear the default implementation and set a new one
                mockExec.mockClear();
                mockExec.mockImplementation((command, callback) => {
                    const testStream: any = new EventEmitter();
                    testStream.stderr = new EventEmitter();
                    testStream.end = jest.fn();
                    testStream.write = jest.fn();

                    callback(null, testStream);
                    testStream.emit("data", "stdout data");
                    testStream.stderr.emit("data", "stderr data");
                    testStream.emit("exit", 0);
                    testStream.emit("close");
                });

                await Shell.executeExec(fakeSshSession, "ls", stderrHandler);
                expect(stderrHandler).toHaveBeenCalledWith("stdout data");
                expect(stderrHandler).toHaveBeenCalledWith("stderr data");
            });

            it("should handle exec error", async () => {
                // Clear the default implementation and set a new one
                mockExec.mockClear();
                mockExec.mockImplementation((command, callback) => {
                    callback(new Error("Exec failed"), null);
                });

                let caughtError;
                try {
                    await Shell.executeExec(fakeSshSession, "ls", stdoutHandler);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(ZosUssMessages.unexpected.message);
            });

            it("should fail when password is expired (connection error) in exec mode", async () => {
                mockExec.mockImplementationOnce((command, callback) => {
                    const testStream: any = new EventEmitter();
                    testStream.stderr = new EventEmitter();
                    testStream.end = jest.fn();
                    testStream.write = jest.fn();

                    callback(null, testStream);
                    mockClient.emit("error", new Error(Shell.expiredPasswordFlag));
                    testStream.emit("exit", 0);
                });

                let caughtError;
                try {
                    await Shell.executeExec(fakeSshSession, "ls", stdoutHandler);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError.message).toBe(ZosUssMessages.expiredPassword.message);
            });

            it("should fail when all auth methods failed in exec mode", async () => {
                mockExec.mockImplementationOnce((command, callback) => {
                    const testStream: any = new EventEmitter();
                    testStream.stderr = new EventEmitter();
                    testStream.end = jest.fn();
                    testStream.write = jest.fn();

                    callback(null, testStream);
                    mockClient.emit("error", ZosUssMessages.allAuthMethodsFailed);
                    testStream.emit("exit", 0);
                });

                let caughtError;
                try {
                    await Shell.executeExec(fakeSshSession, "ls", stdoutHandler);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError.message).toBe(ZosUssMessages.allAuthMethodsFailed.message);
            });

            it("should fail when handshake times out in exec mode", async () => {
                mockExec.mockImplementationOnce((command, callback) => {
                    const testStream: any = new EventEmitter();
                    testStream.stderr = new EventEmitter();
                    testStream.end = jest.fn();
                    testStream.write = jest.fn();

                    callback(null, testStream);
                    mockClient.emit("error", ZosUssMessages.handshakeTimeout);
                    testStream.emit("exit", 0);
                });

                let caughtError;
                try {
                    await Shell.executeExec(fakeSshSession, "ls", stdoutHandler);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError.message).toBe(ZosUssMessages.handshakeTimeout.message);
            });

            it("should fail when connection is refused in exec mode", async () => {
                mockExec.mockImplementationOnce((command, callback) => {
                    const testStream: any = new EventEmitter();
                    testStream.stderr = new EventEmitter();
                    testStream.end = jest.fn();
                    testStream.write = jest.fn();

                    callback(null, testStream);
                    mockClient.emit("error", new Error(Shell.connRefusedFlag));
                    testStream.emit("exit", 0);
                });

                let caughtError;
                try {
                    await Shell.executeExec(fakeSshSession, "ls", stdoutHandler);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError.message).toContain(ZosUssMessages.connectionRefused.message);
            });

            it("should fail when there is unexpected error in exec mode", async () => {
                mockExec.mockImplementationOnce((command, callback) => {
                    const testStream: any = new EventEmitter();
                    testStream.stderr = new EventEmitter();
                    testStream.end = jest.fn();
                    testStream.write = jest.fn();

                    callback(null, testStream);
                    mockClient.emit("error", new Error("Unexpected error"));
                    testStream.emit("exit", 0);
                });

                let caughtError;
                try {
                    await Shell.executeExec(fakeSshSession, "ls", stdoutHandler);
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError.message).toContain(ZosUssMessages.unexpected.message);
            });
        });
    });
});
