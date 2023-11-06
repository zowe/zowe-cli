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

jest.mock("child_process"); // using child_process from the __mocks__ directory

import { ImperativeConfig, ImperativeError, IO, ProcessUtils, ISystemInfo } from "@zowe/core-for-zowe-sdk";

import { IDaemonEnableQuestions } from "../../../../src/daemon/doc/IDaemonEnableQuestions";
import EnableDaemonHandler from "../../../../src/daemon/enable/Enable.handler";

import * as fs from "fs";
import * as nodeJsPath from "path";

describe("Handler for daemon enable", () => {
    let enableHandler: any; // use "any" so we can call private functions
    let enableDaemonSpy: any;
    let unzipTgzSpy: any;
    let preBldDir: string;
    let preBldTgzPath: string;
    let logMessage = "";

    beforeAll(() => {
        // instantiate our handler
        enableHandler = new EnableDaemonHandler();

        // form our tgz file name
        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();
        let tgzFileName = "zowe-";
        switch (sysInfo.platform) {
            case "darwin": {
                tgzFileName += "macos.tgz";
                break;
            }
            case "linux": {
                tgzFileName += "linux.tgz";
                break;
            }
            case "win32": {
                tgzFileName += "windows.tgz";
                break;
            }
            default: {
                tgzFileName += "unknownOs.tgz";
                throw "Enable.handler.unit.test.ts: beforeAll: " + sysInfo.platform + " is not a known OS.";
            }
        }

        // copy a fake tgz file from resources to our prebuilds directory for testing
        const tgzResourcePath = nodeJsPath.resolve(__dirname, "../../__resources__", tgzFileName);
        preBldDir = nodeJsPath.resolve(__dirname, "../../../../prebuilds");
        preBldTgzPath = nodeJsPath.resolve(preBldDir, tgzFileName);
        if (!IO.existsSync(preBldDir)) {
            IO.createDirSync(preBldDir);
        }
        if (!IO.existsSync(preBldTgzPath)) {
            fs.copyFileSync(tgzResourcePath, preBldTgzPath);
        }
    });

    beforeEach(() => {
        // remove enableDaemon spy & mock between tests
        enableDaemonSpy?.mockRestore();
        unzipTgzSpy?.mockRestore();
        logMessage = "";
    });

    afterAll(() => {
        // remove the fake prebuild files that we created
        if (IO.existsSync(preBldTgzPath)) {
            IO.deleteFile(preBldTgzPath);
        }
        if (IO.existsSync(preBldDir)) {
            IO.deleteDir(preBldDir);
        }
    });

    describe("process method", () => {
        // command parms passed to process() by multiple tests
        let apiMessage = "";
        let jsonObj;
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
            expect(logMessage).toContain("Zowe CLI daemon mode is enabled.");
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
    }); // end process method

    describe("enableDaemon method", () => {
        // cliHome is a getter property, so mock the property
        const impCfg: ImperativeConfig = ImperativeConfig.instance;
        const cliHomeDirMock = "NotaRealCliHomeDir";
        Object.defineProperty(impCfg, "cliHome", {
            configurable: true,
            get: jest.fn(() => {
                return cliHomeDirMock;
            })
        });
        const zoweBinDirMock = cliHomeDirMock + nodeJsPath.sep + "bin";

        const noAskNoAddPath: IDaemonEnableQuestions = {
            canAskUser: false,
            addBinToPathVal: "n"
        };

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
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error.mMessage).toBe("Daemon mode is not supported on the 'BogusPlatform' operating system.");
            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
        });

        it("should fail when the tgz file does not exist", async () => {
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return false;
            });

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error.mMessage).toBe(`The archive for your OS executable does not exist: ${preBldTgzPath}`);
            IO.existsSync = existsSyncOrig;
        });

        it("should fail when a bin file exists", async () => {
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const isDirOrig = IO.isDir;
            IO.isDir = jest.fn(() => {
                return false;
            });

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error.mMessage).toContain("The existing file '" + zoweBinDirMock + "' must be a directory.");
            IO.existsSync = existsSyncOrig;
            IO.isDir = isDirOrig;
        });

        it("should fail if a we cannot create a bin directory", async () => {
            // Mock the IO functions to simulate a failure creating a directory
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn()
                .mockReturnValueOnce(true)      // for tgz file
                .mockReturnValueOnce(false);    // for bin dir

            const awfulThrownErr = "Some awful directory creation error was thrown";
            const createDirSyncOrig = IO.createDirSync;
            IO.createDirSync = jest.fn(() => {
                throw awfulThrownErr;
            });

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error.mMessage).toContain(`Unable to create directory '${cliHomeDirMock}`);
            expect(error.mMessage).toContain(`Reason: ${awfulThrownErr}`);
            IO.existsSync = existsSyncOrig;
            IO.createDirSync = createDirSyncOrig;
        });

        it("should return a message that it cannot launch the EXE", async () => {
            // Mock the IO functions to simulate stuff is working
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const isDirOrig = IO.isDir;
            IO.isDir = jest.fn(() => {
                return true;
            });

            const createDirSyncOrig = IO.createDirSync;
            IO.createDirSync = jest.fn();

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((tgzFile: string, toDir: string, fileToExtract: string) => {return;});

            let error;
            let userInfoMsg: string;
            try {
                userInfoMsg = await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(unzipTgzSpy).toHaveBeenCalledTimes(1);

            // we set a bogus cliHome, so we know it cannot launch the executable
            expect(userInfoMsg).toContain("Zowe CLI native executable version = Failed to get version number");

            IO.existsSync = existsSyncOrig;
            IO.isDir = isDirOrig;
            IO.createDirSync = createDirSyncOrig;
        });

        it("should return a message with the version number of the EXE", async () => {
            // Mock the IO functions to simulate stuff is working
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const isDirOrig = IO.isDir;
            IO.isDir = jest.fn(() => {
                return true;
            });

            const createDirSyncOrig = IO.createDirSync;
            IO.createDirSync = jest.fn();

            // This uses child_process from the __mocks__ directory
            const exeVerNumMock = "9.9.9";
            require("child_process").setSpawnSyncOutput(exeVerNumMock);

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((tgzFile: string, toDir: string, fileToExtract: string) => {return;});

            let error;
            let userInfoMsg: string;
            try {
                userInfoMsg = await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(unzipTgzSpy).toHaveBeenCalledTimes(1);
            expect(userInfoMsg).toContain("Zowe CLI native executable version = " + exeVerNumMock);

            IO.existsSync = existsSyncOrig;
            IO.isDir = isDirOrig;
            IO.createDirSync = createDirSyncOrig;
        });

        it("should return a message to add our bin to your PATH", async () => {
            // Mock the IO functions to simulate stuff is working
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const isDirOrig = IO.isDir;
            IO.isDir = jest.fn(() => {
                return true;
            });

            const createDirSyncOrig = IO.createDirSync;
            IO.createDirSync = jest.fn();

            const pathOrig = process.env.PATH;
            process.env.PATH = "ThisPathDoesNotcontainOurBinDir";

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((tgzFile: string, toDir: string, fileToExtract: string) => {return;});

            let error;
            let userInfoMsg: string;
            try {
                userInfoMsg = await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(unzipTgzSpy).toHaveBeenCalledTimes(1);
            expect(userInfoMsg).toContain(`Manually add '${zoweBinDirMock}' to your PATH.`);
            expect(userInfoMsg).toContain("close this terminal and open a new terminal");

            IO.existsSync = existsSyncOrig;
            IO.isDir = isDirOrig;
            IO.createDirSync = createDirSyncOrig;
            process.env.PATH = pathOrig;
        });

        it("should tell you to open new terminal on Linux even when PATH is set", async () => {
            // Mock the IO functions to simulate stuff is working
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const isDirOrig = IO.isDir;
            IO.isDir = jest.fn(() => {
                return true;
            });

            const createDirSyncOrig = IO.createDirSync;
            IO.createDirSync = jest.fn();

            const getBasicSystemInfoOrig = ProcessUtils.getBasicSystemInfo;
            ProcessUtils.getBasicSystemInfo = jest.fn(() => {
                return {
                    "arch": "ArchNotNeeded",
                    "platform": "linux"
                };
            });

            const pathOrig = process.env.PATH;
            process.env.PATH = "stuff/in/path:" +
                nodeJsPath.normalize(ImperativeConfig.instance.cliHome + "/bin") +
                ":more/stuff/in/path";

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((tgzFile: string, toDir: string, fileToExtract: string) => {return;});

            let error;
            let userInfoMsg: string;
            try {
                userInfoMsg =  await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(unzipTgzSpy).toHaveBeenCalledTimes(1);
            expect(userInfoMsg).toContain("close this terminal and open a new terminal");

            IO.existsSync = existsSyncOrig;
            IO.isDir = isDirOrig;
            IO.createDirSync = createDirSyncOrig;
            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
            process.env.PATH = pathOrig;
        });

        it("should NOT tell you to open new terminal on Windows when PATH is set", async () => {
            // Mock the IO functions to simulate stuff is working
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const isDirOrig = IO.isDir;
            IO.isDir = jest.fn(() => {
                return true;
            });

            const createDirSyncOrig = IO.createDirSync;
            IO.createDirSync = jest.fn();

            const getBasicSystemInfoOrig = ProcessUtils.getBasicSystemInfo;
            ProcessUtils.getBasicSystemInfo = jest.fn(() => {
                return {
                    "arch": "ArchNotNeeded",
                    "platform": "win32"
                };
            });

            const pathOrig = process.env.PATH;
            process.env.PATH = "stuff/in/path:" +
                nodeJsPath.normalize(ImperativeConfig.instance.cliHome + "/bin") +
                ":more/stuff/in/path";

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((tgzFile: string, toDir: string, fileToExtract: string) => {return;});

            let error;
            let userInfoMsg: string;
            try {
                userInfoMsg =  await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(unzipTgzSpy).toHaveBeenCalledTimes(1);
            expect(userInfoMsg).not.toContain("close this terminal and open a new terminal");

            IO.existsSync = existsSyncOrig;
            IO.isDir = isDirOrig;
            IO.createDirSync = createDirSyncOrig;
            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
            process.env.PATH = pathOrig;
        });

        it("should not mention ZOWE_USE_DAEMON if is unset", async () => {
            // Mock the IO functions to simulate stuff is working
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const isDirOrig = IO.isDir;
            IO.isDir = jest.fn(() => {
                return true;
            });

            const createDirSyncOrig = IO.createDirSync;
            IO.createDirSync = jest.fn();

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((tgzFile: string, toDir: string, fileToExtract: string) => {return;});

            let error;
            let userInfoMsg: string;
            try {
                userInfoMsg = await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(unzipTgzSpy).toHaveBeenCalledTimes(1);
            expect(userInfoMsg).not.toContain("Your ZOWE_USE_DAEMON environment variable is set");
            expect(userInfoMsg).not.toContain("You must remove it, or set it to 'yes' to use daemon mode.");

            IO.existsSync = existsSyncOrig;
            IO.isDir = isDirOrig;
            IO.createDirSync = createDirSyncOrig;
        });

        it("should instruct that ZOWE_USE_DAEMON should be removed", async () => {
            // Mock the IO functions to simulate stuff is working
            const existsSyncOrig = IO.existsSync;
            IO.existsSync = jest.fn(() => {
                return true;
            });

            const isDirOrig = IO.isDir;
            IO.isDir = jest.fn(() => {
                return true;
            });

            const createDirSyncOrig = IO.createDirSync;
            IO.createDirSync = jest.fn();

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((tgzFile: string, toDir: string, fileToExtract: string) => {return;});

            // force the message to reset ZOWE_USE_DAEMON variable
            const noDaemonVal = "no";
            process.env.ZOWE_USE_DAEMON = noDaemonVal;

            let error;
            let userInfoMsg: string;
            try {
                userInfoMsg = await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(unzipTgzSpy).toHaveBeenCalledTimes(1);
            expect(userInfoMsg).toContain(`Your ZOWE_USE_DAEMON environment variable is set to '${noDaemonVal}'.`);
            expect(userInfoMsg).toContain("You must remove it, or set it to 'yes' to use daemon mode.");

            IO.existsSync = existsSyncOrig;
            IO.isDir = isDirOrig;
            IO.createDirSync = createDirSyncOrig;
        });
    }); // end enableDaemon method
}); // end Handler
