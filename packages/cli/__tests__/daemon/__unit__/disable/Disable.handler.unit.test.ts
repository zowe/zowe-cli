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

import { ImperativeConfig, ImperativeError, IO, ProcessUtils, ISystemInfo } from "@zowe/imperative";

import DisableDaemonHandler from "../../../../src/daemon/disable/Disable.handler";

describe("Disable daemon handler", () => {
    let disableHandler: any; // use "any" so we can call private functions
    let disableDaemonSpy: any;

    beforeAll(() => {
        // instantiate our handler and spy on its private disableDaemon() function
        disableHandler = new DisableDaemonHandler();
    });

    beforeEach(() => {
        // remove disableDaemon spy
        disableDaemonSpy?.mockRestore();
    });

    describe("process method", () => {
        // command parms passed to process() by multiple tests
        let apiMessage = "";
        let jsonObj;
        let logMessage = "";
        const cmdParms = {
            arguments: {
                $0: "fake",
                _: ["fake"]
            },
            response: {
                data: {
                    setMessage: jest.fn((setMsgArgs) => {
                        apiMessage = setMsgArgs;
                    }),
                    setObj: jest.fn((setObjArgs) => {
                        jsonObj = setObjArgs;
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
            const getBasicSystemInfoOrig = ProcessUtils.getBasicSystemInfo;
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
            const getBasicSystemInfoOrig = ProcessUtils.getBasicSystemInfo;
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

            expect(IO.existsSync).toHaveBeenCalledTimes(1);
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

            expect(IO.existsSync).toHaveBeenCalledTimes(1);
            expect(IO.existsSync).toHaveBeenCalledWith(fakeZoweExePath);
            expect(IO.deleteFile).toHaveBeenCalledTimes(1);
            expect(error).toBeUndefined();
            IO.existsSync = existsSyncOrig;
        });

        it("should succeed when no daemon is running", async () => {
            const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => {return;});

            let error;
            try {
                await disableHandler.disableDaemon();
            } catch (e) {
                error = e;
            }

            expect(killSpy).toHaveBeenCalledTimes(0);
            expect(error).toBeUndefined();
        });

        it("should succeed when a zowe daemon is running", async () => {
            const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => {return;});

            /* The find-process module returns a single function as its default export.
             * This concoction enables us to override that function.
             */
            const fakePid = 1234567890;
            const findProcMock = jest.fn();
            jest.mock('find-process', () => findProcMock);
            findProcMock.mockImplementation(() => {
                return[{
                    "name": "node",
                    "pid": fakePid,
                    "cmd": "node /some/path/to/@zowe/cli/lib/main.js --daemon"
                }];
            });

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
        });
    }); // end disableDaemon method
});
