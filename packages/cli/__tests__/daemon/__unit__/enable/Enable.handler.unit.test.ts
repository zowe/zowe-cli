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

import { ImperativeConfig, ImperativeError, IO, ProcessUtils, ISystemInfo } from "@zowe/imperative";

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
    let createdPreBldDir = false; // Track if we created the directory

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
            createdPreBldDir = true; // Mark that we created it
        }
        if (!IO.existsSync(preBldTgzPath)) {
            fs.copyFileSync(tgzResourcePath, preBldTgzPath);
        }
    });

    let existsSyncSpy: any;
    let isDirSpy: any;
    let createDirSyncSpy: any;
    let giveAccessOnlyToOwnerSpy: any;

    beforeEach(() => {
        // remove enableDaemon spy & mock between tests
        enableDaemonSpy?.mockRestore();
        unzipTgzSpy?.mockRestore();
        logMessage = "";

        // Default IO mocks for most tests
        existsSyncSpy = jest.spyOn(IO, "existsSync").mockReturnValue(true);
        isDirSpy = jest.spyOn(IO, "isDir").mockReturnValue(true);
        createDirSyncSpy = jest.spyOn(IO, "createDirSync").mockImplementation(() => { return; });

        // Prevent real chmod/icacls calls against our fake (non-existent) paths.
        giveAccessOnlyToOwnerSpy = jest.spyOn(IO, "giveAccessOnlyToOwner").mockImplementation(() => {
            return;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(() => {
        // remove the fake prebuild files that we created
        if (IO.existsSync(preBldTgzPath)) {
            IO.deleteFile(preBldTgzPath);
        }
        // Only delete the directory if we created it (and it's empty)
        if (createdPreBldDir && IO.existsSync(preBldDir)) {
            try {
                IO.deleteDir(preBldDir);
            } catch (err) {
                // Ignore errors if directory is not empty (e.g., contains Rust binaries)
            }
        }
    });

    describe("process method", () => {
        // command parms passed to process() by multiple tests
        const cmdParms = {
            arguments: {
                $0: "fake",
                _: ["fake"]
            },
            response: {
                data: {
                    setMessage: jest.fn((_setMsgArgs) => {
                        return;
                    }),
                    setObj: jest.fn((_setObjArgs) => {
                        return;
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
            existsSyncSpy.mockReturnValue(false);

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error.mMessage).toBe(`The archive for your OS executable does not exist: ${preBldTgzPath}`);
        });

        it("should fail when a bin file exists", async () => {
            isDirSpy.mockReturnValue(false);

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error.mMessage).toContain("The existing file '" + zoweBinDirMock + "' must be a directory.");
        });

        it("should fail if a we cannot create a bin directory", async () => {
            // Mock the IO functions to simulate a failure creating a directory
            existsSyncSpy
                .mockReturnValueOnce(true)      // for tgz file
                .mockReturnValueOnce(false);    // for bin dir

            const awfulThrownErr = "Some awful directory creation error was thrown";
            createDirSyncSpy.mockImplementation(() => {
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
        });

        it("should return a message that it cannot launch the EXE", async () => {
            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

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
        });

        it("should return a message with the version number of the EXE", async () => {
            // This uses child_process from the __mocks__ directory
            const exeVerNumMock = "9.9.9";
            require("child_process").setSpawnSyncOutput(exeVerNumMock);

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

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
        });

        it("should return a message to add our bin to your PATH", async () => {
            const pathOrig = process.env.PATH;
            process.env.PATH = "ThisPathDoesNotcontainOurBinDir";

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

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

            process.env.PATH = pathOrig;
        });

        it("should tell you to open new terminal on Linux even when PATH is set", async () => {
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
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

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

            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
            process.env.PATH = pathOrig;
        });

        it("should NOT tell you to open new terminal on Windows when PATH is set", async () => {
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
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

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

            ProcessUtils.getBasicSystemInfo = getBasicSystemInfoOrig;
            process.env.PATH = pathOrig;
        });

        it("should not mention ZOWE_USE_DAEMON if is unset", async () => {
            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

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
        });

        it("should instruct that ZOWE_USE_DAEMON should be removed", async () => {
            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

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
        });

        it("should restrict access to the extracted executable to the owner", async () => {
            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            // the extracted executable should be restricted to the owner
            const platform = ProcessUtils.getBasicSystemInfo().platform;
            const exeName = platform === "win32" ? "zowe.exe" : "zowe";
            const expectedExePath = nodeJsPath.resolve(zoweBinDirMock, exeName);
            expect(giveAccessOnlyToOwnerSpy).toHaveBeenCalledWith(expectedExePath);
        });

        it("should restrict access to the bin directory when it is created", async () => {
            // tgz file exists, bin dir does not exist, exe does not exist afterward
            existsSyncSpy
                .mockReturnValueOnce(true)      // for tgz file
                .mockReturnValueOnce(false)     // for bin dir
                .mockReturnValue(false);        // for exe existence check

            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(createDirSyncSpy).toHaveBeenCalledWith(zoweBinDirMock);
            // the newly created bin directory should be restricted to the owner
            expect(giveAccessOnlyToOwnerSpy).toHaveBeenCalledWith(zoweBinDirMock);
        });

        it("should fail when it cannot restrict access to an existing bin directory", async () => {
            // tgz file exists, bin dir exists
            existsSyncSpy.mockReturnValue(true);
            isDirSpy.mockReturnValue(true);

            const awfulThrownErr = "Some awful permission error was thrown";
            giveAccessOnlyToOwnerSpy.mockImplementation(() => {
                throw new Error(awfulThrownErr);
            });

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error.mMessage).toContain(`Unable to restrict access to directory '${zoweBinDirMock}`);
            expect(error.mMessage).toContain(`Reason: Error: ${awfulThrownErr}`);
        });

        it("should fail when it cannot restrict access to a newly created bin directory", async () => {
            // tgz file exists, bin dir does not exist
            existsSyncSpy
                .mockReturnValueOnce(true)      // for tgz file
                .mockReturnValueOnce(false);    // for bin dir

            const awfulThrownErr = "Some awful permission error was thrown";
            giveAccessOnlyToOwnerSpy.mockImplementation(() => {
                throw new Error(awfulThrownErr);
            });

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error.mMessage).toContain(`Unable to create directory '${zoweBinDirMock}`);
            expect(error.mMessage).toContain(`Reason: Error: ${awfulThrownErr}`);
        });

        it("should fail when it cannot restrict access to the extracted executable", async () => {
            // spy on our handler's private enableDaemon() function
            unzipTgzSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "unzipTgz");
            unzipTgzSpy.mockImplementation((_tgzFile: string, _toDir: string, _fileToExtract: string) => {return;});

            const awfulThrownErr = "Some awful permission error was thrown";
            giveAccessOnlyToOwnerSpy.mockImplementation((filePath: string) => {
                if (filePath.endsWith("zowe") || filePath.endsWith("zowe.exe")) {
                    throw new Error(awfulThrownErr);
                }
                return;
            });

            let error;
            try {
                await enableHandler.enableDaemon(noAskNoAddPath);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain(awfulThrownErr);
        });
    }); // end enableDaemon method

    describe("unzipTgz method", () => {
        // Simple test to try and get some coverage for the unzipTgz method
        it("should reject with an error if the tgz file does not exist", async () => {
            const nonExistentTgz = nodeJsPath.resolve(__dirname, "does-not-exist.tgz");
            const tempDir = nodeJsPath.resolve(__dirname, "temp-unzip-test2");

            let error;
            try {
                await (enableHandler as any).unzipTgz(nonExistentTgz, tempDir, "zowe");
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
        });
    }); // end unzipTgz method
}); // end Handler
