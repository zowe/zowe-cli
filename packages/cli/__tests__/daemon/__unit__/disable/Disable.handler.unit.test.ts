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

import * as nodeJsPath from "path";
import * as os from "os";

import { ImperativeConfig, ImperativeError, IO, Logger, ProcessUtils, ISystemInfo } from "@zowe/imperative";

import DisableDaemonHandler from "../../../../src/daemon/disable/Disable.handler";

const findProcMock = jest.fn();
jest.mock('find-process', () => findProcMock);

describe("Disable daemon handler", () => {
    let disableHandler: any; // use "any" so we can call private functions
    let disableDaemonSpy: any;

    beforeAll(() => {
        // instantiate our handler and spy on its private disableDaemon() function
        disableHandler = new DisableDaemonHandler();
    });

    beforeEach(() => {
        // restore mock to original implementation
        disableDaemonSpy?.mockRestore();

        // clear count of calls
        findProcMock?.mockClear();
    });

    describe("process method", () => {
        // command parms passed to process() by multiple tests
        let logMessage = "";
        const cmdParms = {
            arguments: {
                $0: "fake",
                _: ["fake"]
            },
            response: {
                data: {
                    setMessage: jest.fn((_setMsgArgs) => {
                        // Do nothing
                    }),
                    setObj: jest.fn((_setObjArgs) => {
                        // Do nothing
                    }),
                    setExitCode: jest.fn((exitCode) => {
                        return exitCode;
                    })
                },
                console: {
                    log: jest.fn((logArgs) => {
                        logMessage += "\n" + logArgs;
                    })
                },
                progress: {}
            },
            profiles: {}
        } as any;

        beforeEach(() => {
            // clear logMessage contents
            logMessage = "";
        });

        it("should succeed when the disableDaemon function succeeds", async () => {
            // spy on our handler's private disableDaemon() function
            disableDaemonSpy = jest.spyOn(DisableDaemonHandler.prototype as any, "disableDaemon");
            disableDaemonSpy.mockImplementation(() => {return;});

            let error;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await disableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(disableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Zowe CLI daemon mode is disabled.");
        });

        it("should tell you to open new terminal on Linux", async () => {
            ProcessUtils.getBasicSystemInfo = jest.fn(() => {
                return {
                    "arch": "ArchNotNeeded",
                    "platform": "linux"
                };
            });

            // spy on our handler's private disableDaemon() function
            disableDaemonSpy = jest.spyOn(DisableDaemonHandler.prototype as any, "disableDaemon");
            disableDaemonSpy.mockImplementation(() => {return;});

            let error;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await disableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(disableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Zowe CLI daemon mode is disabled.");
            expect(logMessage).toContain("close this terminal and open a new terminal");
        });

        it("should NOT tell you to open new terminal on Windows", async () => {
            ProcessUtils.getBasicSystemInfo = jest.fn(() => {
                return {
                    "arch": "ArchNotNeeded",
                    "platform": "win32"
                };
            });

            // spy on our handler's private disableDaemon() function
            disableDaemonSpy = jest.spyOn(DisableDaemonHandler.prototype as any, "disableDaemon");
            disableDaemonSpy.mockImplementation(() => {return;});

            let error;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await disableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(disableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Zowe CLI daemon mode is disabled.");
            expect(logMessage).not.toContain("close this terminal and open a new terminal");
        });

        it("should fail when the disableDaemon function fails", async () => {
            const badStuffMsg = "Some bad exception happened";

            // spy on our handler's private enableDaemon() function
            disableDaemonSpy = jest.spyOn(DisableDaemonHandler.prototype as any, "disableDaemon");
            disableDaemonSpy.mockImplementation(() => {
                throw new ImperativeError({
                    msg: badStuffMsg
                });
            });

            let error;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await disableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(disableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Failed to disable Zowe CLI daemon mode");
            expect(logMessage).toContain(badStuffMsg);
        });
    }); // end process method

    describe("disableDaemon method", () => {
        // cliHome is a getter property, so mock the property
        const impCfg: ImperativeConfig = ImperativeConfig.instance;
        Object.defineProperty(impCfg, "cliHome", {
            configurable: true,
            get: jest.fn(() => {
                return "NotaRealCliHomeDir";
            })
        });

        let fakeZoweExePath: string;

        beforeAll(async () => {
            // form our EXE file name path
            fakeZoweExePath = ImperativeConfig.instance.cliHome + nodeJsPath.sep + "bin" +  nodeJsPath.sep;
            const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();
            switch (sysInfo.platform) {
                case "darwin":
                case "linux": {
                    fakeZoweExePath += "zowe";
                    break;
                }
                case "win32": {
                    fakeZoweExePath += "zowe.exe";
                    break;
                }
                default: {
                    fakeZoweExePath += "exeForUnknownOs";
                    throw "cli.daemon.enable.integration.test.ts: beforeAll: " + sysInfo.platform + " is not a known OS.";
                }
            }

            // our unit tests will never delete a file
            IO.deleteFile = jest.fn(() => {
                return;
            });

        });

        it("should run on windows", async () => {
            const getBasicSystemInfoOrig = ProcessUtils.getBasicSystemInfo;
            ProcessUtils.getBasicSystemInfo = jest.fn(() => {
                return {
                    "arch": "DoesNotMatterForThisTest",
                    "platform": "win32"
                };
            });

            let error;
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
        });

        it("should run on linux", async () => {
            const getBasicSystemInfoOrig = ProcessUtils.getBasicSystemInfo;
            ProcessUtils.getBasicSystemInfo = jest.fn(() => {
                return {
                    "arch": "DoesNotMatterForThisTest",
                    "platform": "linux"
                };
            });

            let error;
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
        });

        it("should run on mac", async () => {
            const getBasicSystemInfoOrig = ProcessUtils.getBasicSystemInfo;
            ProcessUtils.getBasicSystemInfo = jest.fn(() => {
                return {
                    "arch": "DoesNotMatterForThisTest",
                    "platform": "darwin"
                };
            });

            let error;
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
        });

        it("should fail on an unsupported platform", async () => {
            const getBasicSystemInfoOrig = ProcessUtils.getBasicSystemInfo;
            ProcessUtils.getBasicSystemInfo = jest.fn(() => {
                return {
                    "arch": "BogusArch",
                    "platform": "BogusPlatform"
                };
            });

            let error;
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                error = e;
            }

            expect(error.mMessage).toBe("Daemon mode is not supported on the 'BogusPlatform' operating system.");
            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
        });

        it("should succeed when no EXE exists", async () => {
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return false;
            });

            let error;
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                error = e;
            }

            expect(IO.existsSync).toHaveBeenCalledTimes(3);
            expect(IO.existsSync).toHaveBeenCalledWith(fakeZoweExePath);
            expect(IO.deleteFile).toHaveBeenCalledTimes(0);
            expect(error).toBeUndefined();
            IO.existsSync = existsSyncOrig;
        });

        it("should delete an existing EXE", async () => {
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            let error;
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                error = e;
            }

            expect(IO.existsSync).toHaveBeenCalledTimes(3);
            expect(IO.existsSync).toHaveBeenCalledWith(fakeZoweExePath);
            expect(IO.deleteFile).toHaveBeenCalledTimes(2);
            expect(error).toBeUndefined();
            IO.existsSync = existsSyncOrig;
        });

        it("should detect powershell-not-on-path error", async () => {
            const killSpy = jest.spyOn(process, 'kill').mockImplementation();

            // mock disable handler's private static readMyDaemonPid() function to ensure we match our PID
            const fakePid = 1234567890;
            const readMyDaemonPidReal = DisableDaemonHandler["readMyDaemonPid"];
            DisableDaemonHandler["readMyDaemonPid"] = jest.fn().mockReturnValue(fakePid);

            /* The find-process module returns a single function as its default export.
             * This concoction enables us to override that function.
             * We want to simulate PowerShell not on the path.
             */
            findProcMock.mockImplementation(() => {
                throw new Error("When PowerShell is not on your path, you get: powershell.exe ENOENT");
            });

            let impErr: ImperativeError = new ImperativeError({msg: "No error yet"});
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                impErr = e;
            }

            expect(findProcMock).toHaveBeenCalledTimes(1);
            expect(findProcMock).toHaveBeenCalledWith("name", "node", true);
            expect(killSpy).toHaveBeenCalledTimes(0);
            expect(impErr.message).toMatch("Failed while searching for the Zowe CLI daemon process");
            expect(impErr.message).toMatch("Reason: Error: When PowerShell is not on your path, you get: powershell.exe ENOENT");
            expect(impErr.message).toMatch("Powershell.exe may not be on your PATH");
            DisableDaemonHandler["readMyDaemonPid"] = readMyDaemonPidReal;
        });

        it("should succeed when no daemon PID matches", async () => {
            const killSpy = jest.spyOn(process, 'kill').mockImplementation();

            // mock disable handler's private static readMyDaemonPid() function to return my PID
            const myPid = 11221122;
            const readMyDaemonPidReal = DisableDaemonHandler["readMyDaemonPid"];
            DisableDaemonHandler["readMyDaemonPid"] = jest.fn().mockReturnValue(myPid);

            /* The find-process module returns a single function as its default export.
             * This concoction enables us to override that function.
             * Return an array of 1 PID that does not match myPid.
             */
            const noMatchPid = 99669966;
            findProcMock.mockImplementation(() => {
                return[{
                    "name": "node",
                    "pid": noMatchPid,
                    "cmd": "node /some/path/to/@zowe/cli/lib/main.js --daemon"
                }];
            });

            let impErr;
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                impErr = e;
            }

            expect(findProcMock).toHaveBeenCalledTimes(1);
            expect(findProcMock).toHaveBeenCalledWith("name", "node", true);
            expect(killSpy).toHaveBeenCalledTimes(0);
            expect(impErr).toBeUndefined();
            DisableDaemonHandler["readMyDaemonPid"] = readMyDaemonPidReal;
        });

        it("should succeed when a zowe daemon is running", async () => {
            const killSpy = jest.spyOn(process, 'kill').mockImplementation();

            /* The find-process module returns a single function as its default export.
             * This concoction enables us to override that function.
             */
            const fakePid = 1234567890;
            findProcMock.mockImplementation(() => {
                return[{
                    "name": "node",
                    "pid": fakePid,
                    "cmd": "node /some/path/to/@zowe/cli/lib/main.js --daemon"
                }];
            });

            // mock disable handler's private static readMyDaemonPid() function to ensure we match our PID
            const readMyDaemonPidReal = DisableDaemonHandler["readMyDaemonPid"];
            DisableDaemonHandler["readMyDaemonPid"] = jest.fn().mockReturnValue(fakePid);

            let error;
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                error = e;
            }

            expect(findProcMock).toHaveBeenCalledTimes(1);
            expect(findProcMock).toHaveBeenCalledWith("name", "node", true);
            expect(killSpy).toHaveBeenCalledTimes(1);
            expect(killSpy).toHaveBeenCalledWith(fakePid, "SIGINT");
            expect(error).toBeUndefined();
            DisableDaemonHandler["readMyDaemonPid"] = readMyDaemonPidReal;
        });
    }); // end disableDaemon method

    describe("readMyDaemonPid method", () => {

        it("should catch a json parse error", async () => {
            const existsSyncReal = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const readFileSyncReal = IO.readFileSync;
            IO.readFileSync = jest.fn(() => {
                return Buffer.from("This is not a JSON buffer");
            });

            let logMsg = "";
            const getAppLoggerReal = Logger.getAppLogger;
            Logger.getAppLogger = jest.fn(() => {
                return {
                    error: jest.fn((errMsg) => {
                        logMsg = errMsg;
                    })
                } as any;
            });

            // run our test and check results
            const myPid = DisableDaemonHandler["readMyDaemonPid"]("fakePidFileName");
            expect(myPid).toBeNull();
            expect(logMsg).toMatch("Unable to read daemon PID file");
            expect(logMsg).toMatch("Reason: SyntaxError: Unexpected token");

            IO.existsSync = existsSyncReal;
            IO.readFileSync = readFileSyncReal;
            Logger["getAppLogger"] = getAppLoggerReal;
        });

        it("should detect a non matching user name", async () => {
            const existsSyncReal = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const readFileSyncReal = IO.readFileSync;
            IO.readFileSync = jest.fn(() => {
                const pidFileContents = '{ "user": "NotMyUserId", "pid": 123 }';
                return Buffer.from(pidFileContents, "utf-8");
            });

            let logMsg = "";
            const getAppLoggerReal = Logger.getAppLogger;
            Logger.getAppLogger = jest.fn(() => {
                return {
                    error: jest.fn((errMsg) => {
                        logMsg = errMsg;
                    })
                } as any;
            });

            // run our test and check results
            const myPid = DisableDaemonHandler["readMyDaemonPid"]("fakePidFileName");
            expect(myPid).toBeNull();
            expect(logMsg).toMatch("Daemon PID file 'fakePidFileName' contains user 'NotMyUserId'. It should be user '");

            IO.existsSync = existsSyncReal;
            IO.readFileSync = readFileSyncReal;
            Logger["getAppLogger"] = getAppLoggerReal;
        });

        it("should detect an invalid pid type", async () => {
            const existsSyncReal = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const readFileSyncReal = IO.readFileSync;
            IO.readFileSync = jest.fn(() => {
                const pidFileContents = `{ "user": "${os.userInfo().username}", "pid": "Pid is not a string" }`;
                return Buffer.from(pidFileContents, "utf-8");
            });

            let logMsg = "";
            const getAppLoggerReal = Logger.getAppLogger;
            Logger.getAppLogger = jest.fn(() => {
                return {
                    error: jest.fn((errMsg) => {
                        logMsg = errMsg;
                    })
                } as any;
            });

            // run our test and check results
            const myPid = DisableDaemonHandler["readMyDaemonPid"]("fakePidFileName");
            expect(myPid).toBeNull();
            expect(logMsg).toMatch("Daemon PID file 'fakePidFileName' contains invalid PID value = 'Pid is not a string' of type string");

            IO.existsSync = existsSyncReal;
            IO.readFileSync = readFileSyncReal;
            Logger["getAppLogger"] = getAppLoggerReal;
        });

        it("should return a valid pid", async () => {
            const existsSyncReal = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const validPid = 123;
            const readFileSyncReal = IO.readFileSync;
            IO.readFileSync = jest.fn(() => {
                const pidFileContents = `{ "user": "${os.userInfo().username}", "pid": ${validPid} }`;
                return Buffer.from(pidFileContents, "utf-8");
            });

            // run our test and check results
            const myPid = DisableDaemonHandler["readMyDaemonPid"]("fakePidFileName");
            expect(myPid).toBe(validPid);

            IO.existsSync = existsSyncReal;
            IO.readFileSync = readFileSyncReal;
        });
    }); // end readMyDaemonPid method
});
