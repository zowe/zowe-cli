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
            expect(mockExec).toHaveBeenCalledWith(`cd ${cwd} && ${command}`, expect.any(Function));
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

            expect(mockExec).toHaveBeenCalledWith(`cd ${cwd} && ${command}`, expect.any(Function));
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
