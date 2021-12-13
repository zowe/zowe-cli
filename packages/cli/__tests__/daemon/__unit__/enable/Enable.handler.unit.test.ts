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

import { ImperativeConfig, ImperativeError, IO, ProcessUtils } from "@zowe/imperative";

import EnableDaemonHandler from "../../../../src/daemon/enable/Enable.handler";

describe("Handler for daemon enable", () => {
    let enableHandler: any; // use "any" so we can call private functions
    let enableDaemonSpy: any;

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

    beforeAll(() => {
        // instantiate our handler
        enableHandler = new EnableDaemonHandler();
    });

    beforeEach(() => {
        // remove enableDaemon spy & mock between tests
        enableDaemonSpy?.mockRestore();
        logMessage = "";
    });

    describe("process method", () => {
        it("should succeed when the enableDaemon function succeeds", async () => {
            let error;
            const allOkMsg = "Everything worked ok";

            // spy on our handler's private enableDaemon() function
            enableDaemonSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "enableDaemon");
            enableDaemonSpy.mockImplementation(() => {return allOkMsg;});

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await enableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(enableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Zowe CLI daemon mode enabled.");
            expect(logMessage).toContain(allOkMsg);
        });

        it("should fail when the enableDaemon function fails", async () => {
            let error;
            const badStuffMsg = "Some bad stuff happened";

            // spy on our handler's private enableDaemon() function
            enableDaemonSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "enableDaemon");
            enableDaemonSpy.mockImplementation(() => {
                throw new ImperativeError({
                    msg: badStuffMsg
                });
            });


            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await enableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(enableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Failed to enable Zowe CLI daemon mode");
            expect(logMessage).toContain(badStuffMsg);
        });

        it("should fail when on an unsupported platform", async () => {
            let error;

            const getBasicSystemInfoOrig = ProcessUtils.getBasicSystemInfo;
            ProcessUtils.getBasicSystemInfo = jest.fn(() => {
                return {
                    "arch": "BogusArch",
                    "platform": "BogusPlatform"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await enableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(logMessage).toContain("Failed to enable Zowe CLI daemon mode");
            expect(logMessage).toContain("Daemon mode is not supported on the 'BogusPlatform' operating system.");
            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
        });

        it("should fail if a we cannot create a bin directory", async () => {
            let error;

            // Mock the IO functions to simulate a failure creating a directory
            const existsSyncOrig = IO.existsSync;
            IO.createDirSync = jest.fn(() => {
                return false;
            });

            const awfulThrownErr = "Some awful error was thrown";
            const createDirSyncOrig = IO.createDirSync;
            IO.createDirSync = jest.fn(() => {
                throw awfulThrownErr;
            });

            // cliHome is a getter property, so mock the property
            const impCfg: ImperativeConfig = ImperativeConfig.instance;
            const mockCliHomeDir = "NotaRealCliHomeDir";
            Object.defineProperty(impCfg, "cliHome", {
                configurable: true,
                get: jest.fn(() => {
                    return mockCliHomeDir;
                })
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await enableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(logMessage).toContain("Failed to enable Zowe CLI daemon mode");
            expect(logMessage).toContain(`Unable to create directory '${mockCliHomeDir}`);
            expect(logMessage).toContain("Reason: " + awfulThrownErr);
            IO.existsSync = existsSyncOrig;
            IO.createDirSync = createDirSyncOrig;
        });
    });
});
