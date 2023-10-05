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

import Mock = jest.Mock;

jest.mock("fs");
jest.mock("path");
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { IO } from "../../io";
// use complete path to ExecUtils to avoid circular dependency that results from utilities/index
import { ExecUtils } from "../../utilities/src/ExecUtils";
import { ProcessUtils, ISystemInfo } from "../../utilities";

describe("IO tests", () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should get an error for no input on isDir", () => {
        let error;
        try {
            IO.isDir("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should return true for fs.stats says input is directory", () => {
        const fn = jest.mocked(fs.statSync);
        fn.mockImplementation(((somePath: fs.PathLike) => {
            return {
                isDirectory: () => true,
            };
        }) as any);
        expect(IO.isDir("pretend/dir")).toBe(true);
    });

    it("should return false for fs.stats says input is not directory", () => {
        const fn = jest.mocked(fs.statSync);
        fn.mockImplementation(((somePath: fs.PathLike) => {
            return {
                isDirectory: () => false,
            };
        }) as any);
        expect(IO.isDir("pretend/file")).toBe(false);
    });

    it("should return no extension for no input on normalizeExtension", () => {
        expect(IO.normalizeExtension("")).toBe("");
        expect(IO.normalizeExtension(" ")).toBe("");
    });

    it("should return normalized extension", () => {
        expect(IO.normalizeExtension("bin")).toMatchSnapshot();
    });

    it("should return normalized extension even if prefixed with '.'", () => {
        expect(IO.normalizeExtension(".bin")).toMatchSnapshot();
    });

    it("should return normalized extension even if input is only '.'", () => {
        expect(IO.normalizeExtension(".")).toMatchSnapshot();
    });

    it("should get an error for no input on existsSync", () => {
        let error;
        try {
            IO.existsSync("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get true if file exists", () => {
        const fn = jest.mocked(fs.existsSync);
        fn.mockImplementation(((file: fs.PathLike) => {
            return true;
        }) as any);
        expect(IO.existsSync("pretend/exists")).toBe(true);
    });

    it("should get false if file doesn't exist", () => {
        const fn = jest.mocked(fs.existsSync);
        fn.mockImplementation(((file: fs.PathLike) => {
            return false;
        }) as any);
        expect(IO.existsSync("pretend/no/exists")).toBe(false);
    });

    it("should get an error for no input on createDirSync", () => {
        let error;
        try {
            IO.createDirSync("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should create a dir if file doesn't exist", () => {
        const fn = jest.mocked(fs.existsSync);
        fn.mockImplementation(((file: fs.PathLike) => {
            return false;
        }) as any);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        IO.createDirSync("pretend/to/create");
        expect(fnFm).toBeCalled();
    });

    it("should not create a dir if file exists", () => {
        const fn = jest.mocked(fs.existsSync);
        fn.mockImplementation(((file: fs.PathLike) => {
            return true;
        }) as any);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        IO.createDirSync("pretend/already/exists");
        expect(fn).toBeCalled();
        expect(fnFm).not.toBeCalled();
    });

    it("should get an error for no input on createDirsSync", () => {
        let error;
        try {
            IO.createDirsSync("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should create several dirs if dirs do not exist", () => {
        const fn = jest.mocked(fs.existsSync);
        fn.mockImplementation(((file: fs.PathLike) => {
            return false;
        }) as any);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        const fnPr = jest.mocked(path.resolve);
        fnPr.mockImplementation((...pathSegments: any[]) => {
            return pathSegments[0];
        });
        const willBeADir = ["pretend", "to", "create"];
        const dir = willBeADir.join(IO.FILE_DELIM);
        IO.createDirsSync(dir);
        expect(fnFm).toHaveBeenCalledTimes(willBeADir.length);
    });

    it("should not create several dirs if dirs already exist", () => {
        const fn = jest.mocked(fs.existsSync);
        fn.mockImplementation(((file: fs.PathLike) => {
            return true;
        }) as any);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        const fnPr = jest.mocked(path.resolve);
        fnPr.mockImplementation((...pathSegments: any[]) => {
            return pathSegments[0];
        });
        const willBeADir = ["pretend", "to", "create"];
        const dir = willBeADir.join(IO.FILE_DELIM);
        IO.createDirsSync(dir);
        expect(fnFm).not.toHaveBeenCalled();
    });

    it("should only create dirs that do not exist", () => {
        const fn = jest.mocked(fs.existsSync);
        let data = 0;
        fn.mockImplementation(((file: fs.PathLike) => {
            return (data++ % 2); // pretend every other dir exists
        }) as any);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        const fnPr = jest.mocked(path.resolve);
        fnPr.mockImplementation((...pathSegments: any[]) => {
            return pathSegments[0];
        });
        const willBeADir = ["pretend", "to", "create"];
        const dir = willBeADir.join(IO.FILE_DELIM);
        IO.createDirsSync(dir);
        expect(fnFm).toHaveBeenCalledTimes(Math.ceil(willBeADir.length / 2));
    });

    it("should create several dirs if dirs do not exist from input file", () => {
        const fn = jest.mocked(fs.existsSync);
        fn.mockImplementation(((file: fs.PathLike) => {
            return false;
        }) as any);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        const fnPr = jest.mocked(path.resolve);
        fnPr.mockImplementation((...pathSegments: any[]) => {
            return pathSegments[0];
        });
        const fnPd = jest.mocked(path.dirname);
        fnPd.mockImplementation(((...pathSegments: any[]) => {
            const toDir: string[] = pathSegments[0].split(IO.FILE_DELIM);
            toDir.pop();
            return toDir.join(IO.FILE_DELIM);
        }) as any);
        const willBeADir = ["pretend", "to", "create", "test.txt"];
        const dir = willBeADir.join(IO.FILE_DELIM);
        IO.createDirsSyncFromFilePath(dir);
        expect(fnFm).toHaveBeenCalledTimes(willBeADir.length - 1);
    });

    it("should not create several dirs if dirs already exist from input file", () => {
        const fn = jest.mocked(fs.existsSync);
        fn.mockImplementation(((file: fs.PathLike) => {
            return true;
        }) as any);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        const fnPr = jest.mocked(path.resolve);
        fnPr.mockImplementation((...pathSegments: any[]) => {
            return pathSegments[0];
        });
        const fnPd = jest.mocked(path.dirname);
        fnPd.mockImplementation(((...pathSegments: any[]) => {
            const toDir: string[] = pathSegments[0].split(IO.FILE_DELIM);
            toDir.pop();
            return toDir.join(IO.FILE_DELIM);
        }) as any);
        const willBeADir = ["pretend", "to", "create", "test.txt"];
        const dir = willBeADir.join(IO.FILE_DELIM);
        IO.createDirsSyncFromFilePath(dir);
        expect(fnFm).not.toHaveBeenCalled();
    });

    it("should only create dirs that do not exist from input file", () => {
        const fn = jest.mocked(fs.existsSync);
        let data = 0;
        fn.mockImplementation(((file: fs.PathLike) => {
            return (data++ % 2); // pretend every other dir exists
        }) as any);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        const fnPr = jest.mocked(path.resolve);
        fnPr.mockImplementation((...pathSegments: any[]) => {
            return pathSegments[0];
        });
        const fnPd = jest.mocked(path.dirname);
        fnPd.mockImplementation(((...pathSegments: any[]) => {
            const toDir: string[] = pathSegments[0].split(IO.FILE_DELIM);
            toDir.pop();
            return toDir.join(IO.FILE_DELIM);
        }) as any);
        const willBeADir = ["pretend", "to", "create", "test.txt"];
        const dir = willBeADir.join(IO.FILE_DELIM);
        IO.createDirsSyncFromFilePath(dir);
        expect(fnFm).toHaveBeenCalledTimes(Math.ceil(willBeADir.length / 2));
    });

    it("processNewLines should replace LF line endings with CRLF on Windows", () => {
        jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_WIN32);
        const original = "\nabc\ndef\n";
        const processed = IO.processNewlines(original);
        expect(processed).toBe(original.replace(/\n/g, "\r\n"));
    });

    it("processNewLines should not replace LF line ending when last byte is CR", () => {
        jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_WIN32);
        const original = "\nabc\ndef\n";
        const processed = IO.processNewlines(original, "\r".charCodeAt(0));
        expect(processed).toBe(original.replace(/\n/g, "\r\n").slice(1));
    });

    it("should get an error for no input on mkdirp", () => {
        let error;
        try {
            IO.mkdirp("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on createDirsSyncFromFilePath", () => {
        let error;
        try {
            IO.createDirsSyncFromFilePath("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on readFileSync", () => {
        let error;
        try {
            IO.readFileSync("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on processNewlines", () => {
        let error;
        try {
            IO.processNewlines(null);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on createReadStream", () => {
        let error;
        try {
            IO.createReadStream("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });
    it("should get an error for no input on createWriteStream", () => {
        let error;
        try {
            IO.createWriteStream("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });
    it("should get an error for no input on createFileSync", () => {
        let error;
        try {
            IO.createFileSync("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on writeFileAsync", async () => {
        let error;
        try {
            await IO.writeFileAsync("   ", "   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on writeFileAsync second parm", async () => {
        let error;
        try {
            await IO.writeFileAsync("data", undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should write a file asynchronously", async () => {

        // mock fs.writeFile
        (fs.writeFile as any) = jest.fn((file: string, content: string, UTF8: string, callBack) => {
            process.nextTick(callBack);
        });

        let error;
        try {
            await IO.writeFileAsync("test.txt", "data data data");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("should throw imperative error when getting an IO error writing asynchronously", async () => {

        // mock fs.writeFile
        (fs.writeFile as any) = jest.fn((file: string, content: string, UTF8: string, callBack) => {
            const ioError = new Error();
            ioError.message = "Fake IO error";
            process.nextTick(() => callBack(ioError));
        });

        let error;
        try {
            await IO.writeFileAsync("test.txt", "data data data");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on writeFile", () => {
        let error;
        try {
            IO.writeFile("   ", Buffer.from("data"));
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on writeFile second parm", () => {
        let error;
        try {
            IO.writeFile("data", undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on writeObject", () => {
        let error;
        try {
            IO.writeObject("   ", {});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on writeObject second parm", () => {
        let error;
        try {
            IO.writeObject("data", undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on deleteFile", () => {
        let error;
        try {
            IO.deleteFile("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should get an error for no input on deleteDir", () => {
        let error;
        try {
            IO.deleteDir("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    describe("getDefaultTextEditor", () => {
        it("should use Notepad on Windows", () => {
            jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_WIN32);
            const editor = IO.getDefaultTextEditor();
            expect(editor).toBe("notepad");
        });

        it("should use TextEdit on macOS", () => {
            jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_MAC);
            const editor = IO.getDefaultTextEditor();
            expect(editor).toContain("TextEdit");
        });

        it("should use 'vi' on Linux", () => {
            jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_LINUX);
            const editor = IO.getDefaultTextEditor();
            expect(editor).toBe("vi");
        });
    });

    describe("giveAccessOnlyToOwner", () => {
        const sysInfo: ISystemInfo = ProcessUtils.getBasicSystemInfo();

        beforeAll(() => {
            // for all giveAccessOnlyToOwner tests, we want the real platform
            jest.spyOn(os, "platform").mockRestore();
        });

        it("should get an error when no file is specified", () => {
            let caughtError;
            try {
                IO.giveAccessOnlyToOwner("   ");
            } catch (thrownError) {
                caughtError = thrownError;
            }
            expect(caughtError.message).toContain("Expect Error: Required parameter 'fileName' must not be blank");
        });

        it("should get an error when file does not exist", () => {
            let caughtError;
            try {
                IO.giveAccessOnlyToOwner("/this/file/does/not/exist.txt");
            } catch (thrownError) {
                caughtError = thrownError;
            }
            expect(caughtError.message).toContain(
                "Failed to restrict access to others on file = /this/file/does/not/exist.txt"
            );
            expect(caughtError.message).toContain("Attempted to restrict access on a non-existent file.");
        });

        if (sysInfo.platform === "win32") {
            it("should detect when the icacls command has a zero exit code but displays an error message", () => {
                let caughtError;
                let spawnSpy: any;
                try {
                    // make it appear that the file exists
                    jest.spyOn(IO, "existsSync").mockReturnValue(true);

                    // simulate icacls running ok but returning an error message
                    spawnSpy = jest.spyOn(ExecUtils, "spawnAndGetOutput");
                    spawnSpy.mockReturnValue(
                        "Who knows what the icacls command might say when it does not like something\n" +
                        "Successfully processed 0 files; Failed processing 1 files"
                    );

                    const testPermFile = __dirname + "/onlyUserAccess.txt";
                    IO.giveAccessOnlyToOwner(testPermFile);
                } catch (thrownError) {
                    caughtError = thrownError;
                }
                expect(spawnSpy).toHaveBeenCalledTimes(1);
                expect(caughtError.message).toContain("Failed to restrict access to others on file");
                expect(caughtError.message).toContain("Who knows what the icacls command might say when it does not like something");
                expect(caughtError.message).toContain("Successfully processed 0 files; Failed processing 1 files");
            });
        } // end win32

        if (sysInfo.platform === "win32") {
            it("should catch an error thrown when spawning a subprocess", () => {
                let caughtError;
                let spawnSpy: any;
                try {
                    // make it appear that the file exists
                    jest.spyOn(IO, "existsSync").mockReturnValue(true);

                    // simulate throwing an error trying to launch a subprocess
                    spawnSpy = jest.spyOn(ExecUtils, "spawnAndGetOutput");
                    spawnSpy.mockImplementation(() => {
                        throw new Error("Pretend that spawn.sync failed to launch the icacls program");
                    });

                    const testPermFile = __dirname + "/onlyUserAccess.txt";
                    IO.giveAccessOnlyToOwner(testPermFile);
                } catch (thrownError) {
                    caughtError = thrownError;
                }
                expect(spawnSpy).toHaveBeenCalledTimes(1);
                expect(caughtError.message).toContain("Failed to restrict access to others on file");
                expect(caughtError.message).toContain("Pretend that spawn.sync failed to launch the icacls program");
            });
        } // end win32

        if (sysInfo.platform === "win32") {
            it("should restrict file access on Windows", () => {
                let caughtError;
                let spawnSpy: any;
                try {
                    // Simulate that the file exists
                    jest.spyOn(IO, "existsSync").mockReturnValue(true);

                    // Simulate successfully launching a subprocess
                    spawnSpy = jest.spyOn(ExecUtils, "spawnAndGetOutput");
                    spawnSpy.mockReturnValue("Successfully processed 1 files; Failed processing 0 files");

                    const testPermFile = __dirname + "/onlyUserAccess.txt";
                    IO.giveAccessOnlyToOwner(testPermFile);
                } catch (thrownError) {
                    caughtError = thrownError;
                }

                expect(caughtError).toBeUndefined();
                expect(spawnSpy).toHaveBeenCalledTimes(1);
            });
        } // end win32

        if (sysInfo.platform !== "win32") {
            it("should restrict file access with execute permission on Posix", () => {
                const testPermFile = __dirname + "/onlyUserAccess.txt";
                let caughtError;
                let chmodSpy: any;
                try {
                    // Simulate that the file exists
                    jest.spyOn(IO, "existsSync").mockReturnValue(true);

                    // Simulate a file with execute permissions
                    jest.spyOn(fs, "statSync").mockReturnValue({
                        mode: 0o777
                    } as any);

                    // track chmod being called
                    chmodSpy = jest.spyOn(fs, "chmodSync");

                    IO.giveAccessOnlyToOwner(testPermFile);
                } catch (thrownError) {
                    caughtError = thrownError;
                }

                expect(caughtError).toBeUndefined();
                expect(chmodSpy).toHaveBeenCalledWith(testPermFile, 0o700);

            });
        } // end win32

        if (sysInfo.platform !== "win32") {
            it("should restrict file access with no execute permission on Posix", () => {
                const testPermFile = __dirname + "/onlyUserAccess.txt";
                let caughtError;
                let chmodSpy: any;
                try {
                    // Simulate that the file exists
                    jest.spyOn(IO, "existsSync").mockReturnValue(true);

                    // Simulate a file with no execute permission for owner
                    jest.spyOn(fs, "statSync").mockReturnValue({
                        mode: 0o477
                    } as any);

                    // track chmod being called
                    chmodSpy = jest.spyOn(fs, "chmodSync");

                    IO.giveAccessOnlyToOwner(testPermFile);
                } catch (thrownError) {
                    caughtError = thrownError;
                }

                expect(caughtError).toBeUndefined();
                expect(chmodSpy).toHaveBeenCalledWith(testPermFile, 0o600);
            });
        } // end win32
    }); // end giveAccessOnlyToOwner
});
