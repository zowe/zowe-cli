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
            const expectResult = ["file1"];

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

});
