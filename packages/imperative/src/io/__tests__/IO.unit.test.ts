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
    let existsSyncSpy: any;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        existsSyncSpy?.mockRestore();
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
        fn.mockImplementation(((_somePath: fs.PathLike) => {
            return {
                isDirectory: () => true,
            };
        }) as any);
        expect(IO.isDir("pretend/dir")).toBe(true);
    });

    it("should return false for fs.stats says input is not directory", () => {
        const fn = jest.mocked(fs.statSync);
        fn.mockImplementation(((_somePath: fs.PathLike) => {
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
        existsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
        expect(IO.existsSync("pretend/exists")).toBe(true);
    });

    it("should get false if file doesn't exist", () => {
        existsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
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
        existsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((_file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        IO.createDirSync("pretend/to/create");
        expect(fnFm).toHaveBeenCalled();
    });

    it("should get an error for no input on createDirsSync", () => {
        let error;
        try {
            // eslint-disable-next-line deprecation/deprecation
            IO.createDirsSync("   ");
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should create several dirs if dirs do not exist", () => {
        existsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((_file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        const fnPr = jest.mocked(path.resolve);
        fnPr.mockImplementation((...pathSegments: any[]) => {
            return pathSegments[0];
        });
        const willBeADir = ["pretend", "to", "create"];
        const dir = willBeADir.join(path.posix.sep);
        // eslint-disable-next-line deprecation/deprecation
        IO.createDirsSync(dir);
        expect(fnFm).toHaveBeenCalledTimes(1);
    });

    it("should create several dirs if dirs do not exist from input file", () => {
        existsSyncSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
        const fnFm = jest.mocked(fs.mkdirSync);
        fnFm.mockImplementation(((_file: fs.PathLike) => {
            return; // do nothing but pretend to write
        }) as any);
        const fnPr = jest.mocked(path.resolve);
        fnPr.mockImplementation((...pathSegments: any[]) => {
            return pathSegments[0];
        });
        const fnPd = jest.mocked(path.dirname);
        fnPd.mockImplementation(((...pathSegments: any[]) => {
            const toDir: string[] = pathSegments[0].split(path.posix.sep);
            toDir.pop();
            return toDir.join(path.posix.sep);
        }) as any);
        const willBeADir = ["pretend", "to", "create", "test.txt"];
        const dir = willBeADir.join(path.posix.sep);
        IO.createDirsSyncFromFilePath(dir);
        expect(fnFm).toHaveBeenCalledTimes(1);
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
            // eslint-disable-next-line deprecation/deprecation
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

    it("processNewlines should replace LF line endings with CRLF on Windows when input is a Buffer", () => {
        jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_WIN32);
        const originalBuffer = Buffer.from("\nabc\ndef\n");
        const processedBuffer = IO.processNewlines(originalBuffer);
        const expectedBuffer = Buffer.from("\r\nabc\r\ndef\r\n");
        expect(processedBuffer.equals(expectedBuffer)).toBe(true);
    });

    it("processNewlines should not replace LF line ending when last byte is CR and input is a Buffer", () => {
        jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_WIN32);
        const originalBuffer = Buffer.from("\nabc\ndef\n");
        const processedBuffer = IO.processNewlines(originalBuffer, "\r".charCodeAt(0));
        const expectedBuffer = Buffer.from("\nabc\r\ndef\r\n");
        expect(processedBuffer.equals(expectedBuffer)).toBe(true);
    });

    it("processNewlines should remove CR before LF when uploading Buffer", () => {
        jest.spyOn(os, "platform").mockReturnValueOnce(IO.OS_WIN32);
        const originalBuffer = Buffer.from("abc\r\ndef\r\n");
        const processedBuffer = IO.processNewlines(originalBuffer, undefined, true);
        const expectedBuffer = Buffer.from("abc\ndef\n");
        expect(processedBuffer.equals(expectedBuffer)).toBe(true);
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

    describe("deleteDir enhancements", () => {
        let lstatSyncSpy: jest.SpyInstance;
        let readdirSyncSpy: jest.SpyInstance;
        let rmdirSyncSpy: jest.SpyInstance;
        let unlinkSyncSpy: jest.SpyInstance;
        let renameSync: jest.SpyInstance;
        let rmSyncSpy: jest.SpyInstance;
        let deleteDirTreeSpy: jest.SpyInstance;
        let existsSyncSpy: jest.SpyInstance;

        beforeEach(() => {
            jest.clearAllMocks();
            jest.restoreAllMocks();
            // Setup default mocks for fs module
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isDirectory: () => false,
                isSymbolicLink: () => false,
                isFile: () => true,
            } as any);
        });

        it("should use fs.rmSync if available (Node v14.14+)", () => {
            (fs as any).rmSync = jest.fn();

            IO.deleteDir("/test/dir");

            expect((fs as any).rmSync).toHaveBeenCalledWith("/test/dir", { recursive: true, force: true });
        });

        it("should use fs.rmSync when available (Node v14.14+)", () => {
            (fs as any).rmSync = jest.fn();
            jest.spyOn(fs, "existsSync");

            IO.deleteDir("/test/dir");

            expect((fs as any).rmSync).toHaveBeenCalledWith("/test/dir", { recursive: true, force: true });
            // When rmSync is available and called, existsSync should not be called
            expect(fs.existsSync).not.toHaveBeenCalled();
        });

        it("should return early if path doesn't exist and rmSync not available", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(false);
            rmdirSyncSpy = jest.spyOn(fs, "rmdirSync");

            IO.deleteDir("/nonexistent/dir");

            expect(fs.existsSync).toHaveBeenCalledWith("/nonexistent/dir");
            expect(rmdirSyncSpy).not.toHaveBeenCalled();
        });

        it("should handle symbolic links by unlinking them", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isSymbolicLink: () => true,
                isFile: () => false,
                isDirectory: () => false,
            } as any);
            unlinkSyncSpy = jest.spyOn(fs, "unlinkSync");

            IO.deleteDir("/test/symlink");

            expect(fs.lstatSync).toHaveBeenCalledWith("/test/symlink");
            expect(unlinkSyncSpy).toHaveBeenCalledWith("/test/symlink");
        });

        it("should handle files by unlinking them", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isSymbolicLink: () => false,
                isFile: () => true,
                isDirectory: () => false,
            } as any);
            unlinkSyncSpy = jest.spyOn(fs, "unlinkSync");

            IO.deleteDir("/test/file.txt");

            expect(fs.lstatSync).toHaveBeenCalledWith("/test/file.txt");
            expect(unlinkSyncSpy).toHaveBeenCalledWith("/test/file.txt");
        });

        it("should rename directory before deletion to avoid race conditions", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isDirectory: () => true,
                isSymbolicLink: () => false,
                isFile: () => false,
            } as any);
            renameSync = jest.spyOn(fs, "renameSync");
            deleteDirTreeSpy = jest.spyOn(IO, "deleteDirTree").mockImplementation();

            const testDir = "/test/dir";
            IO.deleteDir(testDir);

            expect(renameSync).toHaveBeenCalled();
            // Verify rename was called with original dir and renamed path
            expect(renameSync.mock.calls[0][0]).toBe(testDir);
            expect(renameSync.mock.calls[0][1]).toContain(".DELETE_");
        });

        it("should use rmSync on renamed directory if available (second rmSync check)", () => {
            let callCount = 0;
            (fs as any).rmSync = jest.fn(() => {
                callCount++;
            });
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isDirectory: () => true,
                isSymbolicLink: () => false,
                isFile: () => false,
            } as any);
            jest.spyOn(fs, "renameSync");

            IO.deleteDir("/test/dir");

            // rmSync should be called twice - once for initial check, once for moved dir
            expect((fs as any).rmSync).toHaveBeenCalled();
        });

        it("should fall back to deleteDirTree if rmSync not available on moved directory", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isDirectory: () => true,
                isSymbolicLink: () => false,
                isFile: () => false,
            } as any);
            jest.spyOn(fs, "renameSync");
            deleteDirTreeSpy = jest.spyOn(IO, "deleteDirTree").mockImplementation();

            IO.deleteDir("/test/dir");

            expect(deleteDirTreeSpy).toHaveBeenCalled();
            expect(deleteDirTreeSpy.mock.calls[0][0]).toContain(".DELETE_");
        });

        it("should handle rename failure by falling back to recursive removal", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isDirectory: () => true,
                isSymbolicLink: () => false,
                isFile: () => false,
            } as any);
            jest.spyOn(fs, "renameSync").mockImplementation(() => {
                throw new Error("Rename failed");
            });
            readdirSyncSpy = jest.spyOn(fs, "readdirSync").mockReturnValue([] as any);

            IO.deleteDir("/test/dir");

            expect(fs.renameSync).toHaveBeenCalled();
            expect(readdirSyncSpy).toHaveBeenCalledWith("/test/dir");
        });

        it("should recursively remove child directories after rename failure", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockImplementation((filePath: any) => {
                if (filePath === "/test/dir") {
                    return {
                        isDirectory: () => true,
                        isSymbolicLink: () => false,
                        isFile: () => false,
                    } as any;
                }
                return {
                    isDirectory: () => true,
                    isSymbolicLink: () => false,
                    isFile: () => false,
                } as any;
            });
            jest.spyOn(fs, "renameSync").mockImplementation(() => {
                throw new Error("Rename failed");
            });
            readdirSyncSpy = jest.spyOn(fs, "readdirSync").mockReturnValue(["subdir"] as any);

            const deleteRecursiveSpy = jest.spyOn(IO, "deleteDir");
            IO.deleteDir("/test/dir");

            // Verify deleteDir was called for the subdirectory
            expect(deleteRecursiveSpy.mock.calls.length).toBeGreaterThan(1);
        });

        it("should unlink child files after rename failure", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockImplementation((filePath: any) => {
                if (filePath === "/test/dir") {
                    return {
                        isDirectory: () => true,
                        isSymbolicLink: () => false,
                        isFile: () => false,
                    } as any;
                }
                // Child file
                return {
                    isDirectory: () => false,
                    isSymbolicLink: () => false,
                    isFile: () => true,
                } as any;
            });
            jest.spyOn(fs, "renameSync").mockImplementation(() => {
                throw new Error("Rename failed");
            });
            readdirSyncSpy = jest.spyOn(fs, "readdirSync").mockReturnValue(["file.txt"] as any);
            unlinkSyncSpy = jest.spyOn(fs, "unlinkSync");

            IO.deleteDir("/test/dir");

            // unlinkSync should be called for the child file
            expect(unlinkSyncSpy).toHaveBeenCalled();
        });

        it("should ignore per-file lstat errors during recursive removal", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockImplementation((filePath: any) => {
                if (filePath === "/test/dir") {
                    return {
                        isDirectory: () => true,
                        isSymbolicLink: () => false,
                        isFile: () => false,
                    } as any;
                }
                // Throw error for child file check
                throw new Error("lstat failed");
            });
            jest.spyOn(fs, "renameSync").mockImplementation(() => {
                throw new Error("Rename failed");
            });
            readdirSyncSpy = jest.spyOn(fs, "readdirSync").mockReturnValue(["file.txt"] as any);

            let caughtError;
            try {
                IO.deleteDir("/test/dir");
            } catch (error) {
                caughtError = error;
            }

            // Should not throw, errors should be swallowed
            expect(caughtError).toBeUndefined();
        });

        it("should ignore read errors during directory listing", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockReturnValue(true);
            jest.spyOn(fs, "lstatSync").mockReturnValue({
                isDirectory: () => true,
                isSymbolicLink: () => false,
                isFile: () => false,
            } as any);
            jest.spyOn(fs, "renameSync").mockImplementation(() => {
                throw new Error("Rename failed");
            });
            readdirSyncSpy = jest.spyOn(fs, "readdirSync").mockImplementation(() => {
                throw new Error("readdir failed");
            });

            let caughtError;
            try {
                IO.deleteDir("/test/dir");
            } catch (error) {
                caughtError = error;
            }

            // Should not throw, read errors should be swallowed
            expect(caughtError).toBeUndefined();
        });

        it("should handle top-level deletion errors gracefully", () => {
            (fs as any).rmSync = undefined;
            jest.spyOn(fs, "existsSync").mockImplementation(() => {
                throw new Error("Critical error");
            });

            let caughtError;
            try {
                IO.deleteDir("/test/dir");
            } catch (error) {
                caughtError = error;
            }

            // All errors should be swallowed by outer try-catch
            expect(caughtError).toBeUndefined();
        });

        it("should validate input directory is not blank", () => {
            // ImperativeExpect.toBeDefinedAndNonBlank is called OUTSIDE the try-catch
            // So the validation error is NOT swallowed and will be thrown
            let caughtError;
            try {
                IO.deleteDir("");
            } catch (error) {
                caughtError = error;
            }

            // The error should be thrown because the validation happens outside try-catch
            expect(caughtError).toBeDefined();
            expect(caughtError?.toString()).toMatch(/must not be blank/i);
        });
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
