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

import * as path from "path";
import * as fs from "fs";
import { IO } from "@zowe/imperative";
import { ZosFilesUtils } from "../../../src/utils/ZosFilesUtils";
import { ZosFilesConstants } from "../../../src/constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../../src/constants/ZosFiles.messages";
import { IDataSet } from "../../../src/doc/IDataSet";

jest.mock("fs");

describe("ZosFilesUtils", () => {
    describe("CONSTANTS", () => {
        it("should contain various constants", () => {
            // Data set name qualifier separator
            expect(ZosFilesUtils.DSN_SEP).toEqual(".");

            // Default file extension
            expect(ZosFilesUtils.DEFAULT_FILE_EXTENSION).toEqual("txt");
        });

        it('should check if constant files have the expected constants loaded', () => {
            expect(ZosFilesConstants).toMatchSnapshot();
            expect(ZosFilesMessages).toMatchSnapshot();
        });
    });

    describe("getDirsFromDataSet", () => {
        it("should return an appropriate path with or without a member", () => {
            const testDs = "USER.DATA.SET";
            const expectedPath = "user/data/set";
            const testDsMember = "USER.DATA.SET(MEMBER)";
            const expectedPathMember = "user/data/set/member";

            expect(ZosFilesUtils.getDirsFromDataSet(testDs)).toEqual(expectedPath);
            expect(ZosFilesUtils.getDirsFromDataSet(testDsMember)).toEqual(expectedPathMember);
        });

        it("should error on a path with a path seperator", () => {
            const testDs = `USER.DATA/S.SET`;
            const testDsMember = `USER.DATA.SET(ME/M)`;
            let error1: Error;
            let error2: Error;
            let dirs1: string;
            let dirs2: string;

            try {
                dirs1 = ZosFilesUtils.getDirsFromDataSet(testDs);
            } catch (err) {
                error1 = err;
            }

            try {
                dirs2 = ZosFilesUtils.getDirsFromDataSet(testDsMember);
            } catch (err) {
                error2 = err;
            }

            expect(error1).toBeDefined();
            expect(error2).toBeDefined();
            expect(dirs1).not.toBeDefined();
            expect(dirs2).not.toBeDefined();
        });

        it("should error on a path with backtracking", () => {
            const testDs = "USER../.SET";
            const testDsMember = "USER.DATA.SET(../MEM)";
            let error1: Error;
            let error2: Error;
            let dirs1: string;
            let dirs2: string;

            try {
                dirs1 = ZosFilesUtils.getDirsFromDataSet(testDs);
            } catch (err) {
                error1 = err;
            }

            try {
                dirs2 = ZosFilesUtils.getDirsFromDataSet(testDsMember);
            } catch (err) {
                error2 = err;
            }

            expect(error1).toBeDefined();
            expect(error2).toBeDefined();
            expect(dirs1).not.toBeDefined();
            expect(dirs2).not.toBeDefined();
        });
    });

    describe("getFullPath", () => {
        it("should convert input path to full path", () => {
            const inputPath = "/dummy";
            const expectedResult = path.resolve(process.cwd(), inputPath);

            expect(ZosFilesUtils.getFullPath(inputPath)).toBe(expectedResult);
        });
        it("should handle Windows full path as input", () => {
            const inputPath = "C:\\Windows";
            const expectedResult = path.normalize(inputPath);

            expect(ZosFilesUtils.getFullPath(inputPath)).toBe(expectedResult);
        });
    });

    describe("getFileListFromPath", () => {
        const isDirSpy = jest.spyOn(IO, "isDir");
        const readDirSyncSpy = jest.spyOn(fs, "readdirSync");
        const lstatSyncSpy = jest.spyOn(fs, "lstatSync");

        beforeEach(() => {
            isDirSpy.mockClear();
            readDirSyncSpy.mockClear();
            lstatSyncSpy.mockClear();
        });

        it("should return only 1 file when input is a file", () => {
            const inputPath = "testFile.txt";
            const expectResult = [ZosFilesUtils.getFullPath("testFile.txt")];

            isDirSpy.mockReturnValueOnce(false);
            lstatSyncSpy.mockReturnValueOnce({
                isFile: jest.fn().mockReturnValue(true)
            } as any);

            expect(ZosFilesUtils.getFileListFromPath(inputPath).toString()).toBe(expectResult.toString());
        });
        it("should return only 1 file in relative mode when input is a file", () => {
            const inputPath = "testFile.txt";
            const expectResult = ["testFile.txt"];

            isDirSpy.mockReturnValueOnce(false);
            lstatSyncSpy.mockReturnValueOnce({
                isFile: jest.fn().mockReturnValue(true)
            } as any);

            expect(ZosFilesUtils.getFileListFromPath(inputPath, false).toString()).toBe(expectResult.toString());
        });
        it("should return only multiple files when input is a directory", () => {
            const inputPath = "testDir";
            const mockFileList = ["file1", "file2"];

            isDirSpy.mockReturnValueOnce(true);
            readDirSyncSpy.mockReturnValueOnce(mockFileList as any);
            lstatSyncSpy.mockReturnValue({
                isFile: jest.fn().mockReturnValue(true)
            } as any);

            expect(ZosFilesUtils.getFileListFromPath(inputPath, false).toString()).toBe(mockFileList.toString());
        });
        it("should return only multiple files in full path mode when input is a directory", () => {
            const inputPath = "testDir";
            const mockFileList = ["file1", "file2"];
            const expectResult = [
                ZosFilesUtils.getFullPath("testDir/file1"),
                ZosFilesUtils.getFullPath("testDir/file2")
            ];

            isDirSpy.mockReturnValueOnce(true);
            readDirSyncSpy.mockReturnValueOnce(mockFileList as any);
            lstatSyncSpy.mockReturnValue({
                isFile: jest.fn().mockReturnValue(true)
            } as any);

            expect(ZosFilesUtils.getFileListFromPath(inputPath).toString()).toBe(expectResult.toString());
        });
        it("should ignore hidden files when input is a directory", () => {
            const inputPath = "testDir";
            const mockFileList = ["file1", ".file2"];

            isDirSpy.mockReturnValueOnce(true);
            readDirSyncSpy.mockReturnValueOnce(mockFileList as any);
            lstatSyncSpy.mockReturnValue({
                isFile: jest.fn().mockReturnValue(true)
            } as any);

            expect(ZosFilesUtils.getFileListFromPath(inputPath, false, false).toString()).toBe(mockFileList.toString());
        });
    });

    describe("generateMemberName", () => {
        it("should remove any file extention", () => {
            const input = "testFile.txt";
            const expectResult = "TESTFILE";

            expect(ZosFilesUtils.generateMemberName(input)).toBe(expectResult);
        });
        it("should support #, $, @ as first character", () => {
            let input = "#testFile#$#%$.txt";
            let expectResult = "#TESTFIL";

            expect(ZosFilesUtils.generateMemberName(input)).toBe(expectResult);

            input = "$$testFile4323rf.txt";
            expectResult = "$$TESTFI";

            expect(ZosFilesUtils.generateMemberName(input)).toBe(expectResult);

            input = "@testFile4323rf.txt";
            expectResult = "@TESTFIL";

            expect(ZosFilesUtils.generateMemberName(input)).toBe(expectResult);
        });
        it("should remove any number at the begining of the file name", () => {
            const input = "1234testFile.txt";
            const expectResult = "TESTFILE";

            expect(ZosFilesUtils.generateMemberName(input)).toBe(expectResult);
        });
        it("should truckage to maximum of 8 characters length", () => {
            const input = "testFileForDummy.txt";
            const expectResult = "TESTFILE";

            expect(ZosFilesUtils.generateMemberName(input)).toBe(expectResult);
        });
        it("should compress any spaces or non numberic aphabet character in file name", () => {
            const input = "test File*For$Dummy.txt";
            const expectResult = "TESTFILE";

            expect(ZosFilesUtils.generateMemberName(input)).toBe(expectResult);
        });
        it("should allow numeric value in the file name as long as they are not the first character", () => {
            let input = "t01234t.txt";
            let expectResult = "T01234T";

            expect(ZosFilesUtils.generateMemberName(input)).toBe(expectResult);

            input = "t56789T.txt";
            expectResult = "T56789T";

            expect(ZosFilesUtils.generateMemberName(input)).toBe(expectResult);
        });
    });

    describe("isDataSetNameContainMasking", () => {
        it("should return true when data set name contain masking character", () => {
            expect(ZosFilesUtils.isDataSetNameContainMasking("testing*")).toBeTruthy();
            expect(ZosFilesUtils.isDataSetNameContainMasking("tes%ting")).toBeTruthy();
        });
        it("should return false when data set name does not contain masking character", () => {
            expect(ZosFilesUtils.isDataSetNameContainMasking("testing")).toBeFalsy();
        });
    });

    describe("normalizeNewLine", () => {
        it("should normalize all windows new line to unix new line", () => {
            const input = Buffer.from("testing\r\ndummy\r\n");
            const expectResult = Buffer.from("testing\ndummy\n");

            expect(ZosFilesUtils.normalizeNewline(input).toString()).toBe(expectResult.toString());
        });
    });

    describe("getDataSetFromName", () => {
        it("should generate an IDataSet for a dataset", () => {
            const dataSetName = "SYS1.PARMLIB";
            const expectedResult: IDataSet = {
                dsn: "SYS1.PARMLIB",
                member: undefined
            };

            expect(ZosFilesUtils.getDataSetFromName(dataSetName)).toEqual(expectedResult);
        });

        it("should generate an IDataSet for a partitioned dataset", () => {
            const dataSetName = "SYS1.PARMLIB(SOMEMEM)";
            const expectedResult: IDataSet = {
                dsn: "SYS1.PARMLIB",
                member: "SOMEMEM"
            };

            expect(ZosFilesUtils.getDataSetFromName(dataSetName)).toEqual(expectedResult);
        });
    });

    describe("getUserTempToken", () => {
        it("should return a stable, filesystem-safe per-user token", () => {
            const token = ZosFilesUtils.getUserTempToken();
            // 10-char lowercase hex, safe on any platform/filesystem
            expect(token).toMatch(/^[0-9a-f]{10}$/);
            // stable across calls so per-user temp paths stay re-findable
            expect(ZosFilesUtils.getUserTempToken()).toEqual(token);
        });
        it("should fall back to a token when the OS user cannot be determined", () => {
            const os = require("os");
            const userInfoSpy = jest.spyOn(os, "userInfo").mockImplementation(() => {
                throw new Error("no account entry");
            });
            const token = ZosFilesUtils.getUserTempToken();
            expect(token).toMatch(/^[0-9a-f]{10}$/);
            userInfoSpy.mockRestore();
        });
    });

    describe("ensureSafeTempDir", () => {
        const realPlatform = process.platform;
        const setPlatform = (value: string) => Object.defineProperty(process, "platform", { value, configurable: true });
        let existsSyncSpy: jest.SpyInstance;
        let lstatSyncSpy: jest.SpyInstance;
        let mkdirSyncSpy: jest.SpyInstance;
        let giveAccessSpy: jest.SpyInstance;
        let hasOwnerOnlyAccessSpy: jest.SpyInstance;
        beforeEach(() => {
            existsSyncSpy = jest.spyOn(fs, "existsSync");
            lstatSyncSpy = jest.spyOn(fs, "lstatSync");
            mkdirSyncSpy = jest.spyOn(fs, "mkdirSync").mockImplementation(jest.fn());
            giveAccessSpy = jest.spyOn(IO, "giveAccessOnlyToOwner").mockImplementation(jest.fn());
            hasOwnerOnlyAccessSpy = jest.spyOn(IO, "hasOwnerOnlyAccess").mockImplementation(jest.fn());
        });
        afterEach(() => {
            setPlatform(realPlatform);
            jest.restoreAllMocks();
        });

        it("should create the directory owner-only when it does not exist (POSIX)", () => {
            setPlatform("linux");
            existsSyncSpy.mockReturnValue(false);
            ZosFilesUtils.ensureSafeTempDir("/tmp/zowe-edit-ds-abc");
            expect(mkdirSyncSpy).toHaveBeenCalledWith("/tmp/zowe-edit-ds-abc", { recursive: true, mode: 0o700 });
            expect(giveAccessSpy).not.toHaveBeenCalled();
            expect(hasOwnerOnlyAccessSpy).not.toHaveBeenCalled();
        });
        it("should set an owner-only ACL when creating on Windows", () => {
            setPlatform("win32");
            existsSyncSpy.mockReturnValue(false);
            ZosFilesUtils.ensureSafeTempDir("C:\\Temp\\zowe-edit-ds-abc");
            expect(giveAccessSpy).toHaveBeenCalledWith("C:\\Temp\\zowe-edit-ds-abc");
        });
        it("should accept a pre-existing directory whose access is restricted to the current user (any platform)", () => {
            existsSyncSpy.mockReturnValue(true);
            lstatSyncSpy.mockReturnValue({ isDirectory: () => true } as any);
            hasOwnerOnlyAccessSpy.mockReturnValue(true);
            expect(() => ZosFilesUtils.ensureSafeTempDir("/tmp/zowe-edit-ds-abc")).not.toThrow();
            expect(hasOwnerOnlyAccessSpy).toHaveBeenCalledWith("/tmp/zowe-edit-ds-abc");
        });
        it("should reject a pre-existing directory that is not restricted to the current user (any platform)", () => {
            existsSyncSpy.mockReturnValue(true);
            lstatSyncSpy.mockReturnValue({ isDirectory: () => true } as any);
            hasOwnerOnlyAccessSpy.mockReturnValue(false);
            expect(() => ZosFilesUtils.ensureSafeTempDir("/tmp/zowe-edit-ds-abc")).toThrow(/Unsafe temp directory/);
        });
        it("should reject when the path exists but is not a directory (e.g. a planted symlink)", () => {
            existsSyncSpy.mockReturnValue(true);
            lstatSyncSpy.mockReturnValue({ isDirectory: () => false } as any);
            expect(() => ZosFilesUtils.ensureSafeTempDir("/tmp/zowe-edit-ds-abc")).toThrow(/Unsafe temp directory/);
            expect(hasOwnerOnlyAccessSpy).not.toHaveBeenCalled();
        });
    });

});
