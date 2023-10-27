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

import * as fs from "fs";
import { homedir } from "os";
import { join } from "path";
import { EnvFileUtils } from "../../utilities";

describe("EnvFileUtils tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
        process.env.TEST_VARIABLE = "";
        process.env.ANOTHER_TEST_VARIABLE = "";
    });

    it("should tell where a user's environment file should be for a given application - user", () => {
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const path1 = EnvFileUtils.getUserHomeEnvironmentFilePath("zowe");
        const path2 = EnvFileUtils.getUserHomeEnvironmentFilePath("fake");
        expect(path1).toEqual(join(homedir(), ".zowe.env.json"));
        expect(path2).toEqual(join(homedir(), ".fake.env.json"));
    });

    it("should tell where a user's environment file should be for a given application - cli", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        const realFakeHome = process.env.FAKE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        process.env.FAKE_CLI_HOME = mockPath;
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const path1 = EnvFileUtils.getCliHomeEnvironmentFilePath("zowe");
        const path2 = EnvFileUtils.getCliHomeEnvironmentFilePath("fake");
        process.env.ZOWE_CLI_HOME = realCliHome;
        process.env.FAKE_CLI_HOME = realFakeHome;
        expect(path1).toEqual(join(mockPath, ".zowe.env.json"));
        expect(path2).toEqual(join(mockPath, ".fake.env.json"));
    });

    it("should tell where a user's environment file should be for a given application - cli w/ prefix", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        const realFakeHome = process.env.FAKE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        process.env.FAKE_CLI_HOME = mockPath;
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const path1 = EnvFileUtils.getCliHomeEnvironmentFilePath("zow", "ZOWE");
        const path2 = EnvFileUtils.getCliHomeEnvironmentFilePath("fak", "FAKE");
        process.env.ZOWE_CLI_HOME = realCliHome;
        process.env.FAKE_CLI_HOME = realFakeHome;
        expect(path1).toEqual(join(mockPath, ".zow.env.json"));
        expect(path2).toEqual(join(mockPath, ".fak.env.json"));
    });

    it("should tell where a user's environment file should be for a given application - common home only", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const path = EnvFileUtils.getEnvironmentFilePath("zowe");
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(path).toEqual(join(homedir(), ".zowe.env.json"));
    });

    it("should tell where a user's environment file should be for a given application - both locations", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const path = EnvFileUtils.getEnvironmentFilePath("zowe", true);
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(path).toEqual(join(mockPath, ".zowe.env.json"));
    });

    it("should tell where a user's environment file should be for a given application - both locations w/ prefix", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const path = EnvFileUtils.getEnvironmentFilePath("zow", true, "ZOWE");
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(path).toEqual(join(mockPath, ".zow.env.json"));
    });

    it("should tell where a user's environment file should be for a given application - environment location empty", () => {
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = "";
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
        const path = EnvFileUtils.getEnvironmentFilePath("zowe", true);
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(path).toEqual(join(homedir(), ".zowe.env.json"));
    });

    it("should skip reading and setting if the file is not found - home only - exists", () => {
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValue("{}");
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath");
        const getCliHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getCliHomeEnvironmentFilePath")
            .mockReturnValue(undefined);
        const getUserHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getUserHomeEnvironmentFilePath")
            .mockReturnValue(join(homedir(), ".zowe.env.json"));
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zowe");
        } catch (err) {
            error = err;
        }
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zowe");
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", false, undefined);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(0);
        expect(getCliHomeEnvironmentFilePathSpy).not.toHaveBeenCalledWith("zowe");
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(readFileSyncSpy).toHaveBeenCalledWith(join(homedir(), ".zowe.env.json"));
        expect(error).not.toBeDefined();
    });

    it("should skip reading and setting if the file is not found - home only - does not exist", () => {
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValue("{}");
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath");
        const getCliHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getCliHomeEnvironmentFilePath")
            .mockReturnValue(undefined);
        const getUserHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getUserHomeEnvironmentFilePath")
            .mockReturnValue(undefined);
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zowe");
        } catch (err) {
            error = err;
        }
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zowe");
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", false, undefined);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(0);
        expect(getCliHomeEnvironmentFilePathSpy).not.toHaveBeenCalledWith("zowe");
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(0);
        expect(error).not.toBeDefined();
    });

    it("should skip reading and setting if the file is not found - home and cli - both exist - no cli check", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValue("{}");
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath");
        const getCliHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getCliHomeEnvironmentFilePath")
            .mockReturnValue(join(mockPath, ".zowe.env.json"));
        const getUserHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getUserHomeEnvironmentFilePath")
            .mockReturnValue(join(homedir(), ".zowe.env.json"));
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zowe");
        } catch (err) {
            error = err;
        }
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zowe");
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", false, undefined);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(0);
        expect(getCliHomeEnvironmentFilePathSpy).not.toHaveBeenCalledWith("zowe");
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(readFileSyncSpy).toHaveBeenCalledWith(join(homedir(), ".zowe.env.json"));
        expect(error).not.toBeDefined();
    });

    it("should skip reading and setting if the file is not found - home and cli - both exist - cli check", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValue("{}");
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath");
        const getCliHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getCliHomeEnvironmentFilePath")
            .mockReturnValue(join(mockPath, ".zowe.env.json"));
        const getUserHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getUserHomeEnvironmentFilePath")
            .mockReturnValue(join(homedir(), ".zowe.env.json"));
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zowe", true);
        } catch (err) {
            error = err;
        }
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zowe", true);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", true, undefined);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", undefined);
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(0);
        expect(getUserHomeEnvironmentFilePathSpy).not.toHaveBeenCalledWith("zowe");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(readFileSyncSpy).toHaveBeenCalledWith(join(mockPath, ".zowe.env.json"));
        expect(error).not.toBeDefined();
    });

    it("should skip reading and setting if the file is not found - home and cli - both exist - cli check w/ prefix", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValue("{}");
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath");
        const getCliHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getCliHomeEnvironmentFilePath")
            .mockReturnValue(join(mockPath, ".zow.env.json"));
        const getUserHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getUserHomeEnvironmentFilePath")
            .mockReturnValue(join(homedir(), ".zow.env.json"));
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zow", true, "ZOWE");
        } catch (err) {
            error = err;
        }
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zow", true, "ZOWE");
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zow", true, "ZOWE");
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledWith("zow", "ZOWE");
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(0);
        expect(getUserHomeEnvironmentFilePathSpy).not.toHaveBeenCalledWith("zow");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(readFileSyncSpy).toHaveBeenCalledWith(join(mockPath, ".zow.env.json"));
        expect(error).not.toBeDefined();
    });

    it("should skip reading and setting if the file is not found - cli only - no cli check", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValue("{}");
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath");
        const getCliHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getCliHomeEnvironmentFilePath")
            .mockReturnValue(join(mockPath, ".zowe.env.json"));
        const getUserHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getUserHomeEnvironmentFilePath")
            .mockReturnValue(undefined);
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zowe");
        } catch (err) {
            error = err;
        }
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zowe");
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", false, undefined);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(0);
        expect(getCliHomeEnvironmentFilePathSpy).not.toHaveBeenCalledWith("zowe");
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(0);
        expect(error).not.toBeDefined();
    });

    it("should skip reading and setting if the file is not found - cli only - cli check", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValue("{}");
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath");
        const getCliHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getCliHomeEnvironmentFilePath")
            .mockReturnValue(join(mockPath, ".zowe.env.json"));
        const getUserHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getUserHomeEnvironmentFilePath")
            .mockReturnValue(undefined);
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zowe", true);
        } catch (err) {
            error = err;
        }
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zowe", true);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", true, undefined);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", undefined);
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(0);
        expect(getUserHomeEnvironmentFilePathSpy).not.toHaveBeenCalledWith("zowe");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(readFileSyncSpy).toHaveBeenCalledWith(join(mockPath, ".zowe.env.json"));
        expect(error).not.toBeDefined();
    });

    it("should skip reading and setting if the file is not found - cli only - cli check w/ prefix", () => {
        const mockPath = "C:\\FakePath\\";
        const realCliHome = process.env.ZOWE_CLI_HOME;
        process.env.ZOWE_CLI_HOME = mockPath;
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValue("{}");
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath");
        const getCliHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getCliHomeEnvironmentFilePath")
            .mockReturnValue(join(mockPath, ".zow.env.json"));
        const getUserHomeEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getUserHomeEnvironmentFilePath")
            .mockReturnValue(undefined);
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zow", true, "ZOWE");
        } catch (err) {
            error = err;
        }
        process.env.ZOWE_CLI_HOME = realCliHome;
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zow", true, "ZOWE");
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zow", true, "ZOWE");
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getCliHomeEnvironmentFilePathSpy).toHaveBeenCalledWith("zow", "ZOWE");
        expect(getUserHomeEnvironmentFilePathSpy).toHaveBeenCalledTimes(0);
        expect(getUserHomeEnvironmentFilePathSpy).not.toHaveBeenCalledWith("zow");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(readFileSyncSpy).toHaveBeenCalledWith(join(mockPath, ".zow.env.json"));
        expect(error).not.toBeDefined();
    });

    it("should read the environment file and set environment variables", () => {
        const data = {
            "TEST_VARIABLE": "TEST_VALUE_1",
            "ANOTHER_TEST_VARIABLE": "TEST_VALUE_1"
        };
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify(data));
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath")
            .mockReturnValueOnce(join(homedir(), ".zowe.env.json"));
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zowe");
        } catch (err) {
            error = err;
        }
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zowe");
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", false, undefined);
        expect(process.env.TEST_VARIABLE).toEqual("TEST_VALUE_1");
        expect(process.env.ANOTHER_TEST_VARIABLE).toEqual("TEST_VALUE_1");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(error).not.toBeDefined();
    });

    it("should fail to read the environment file and throw errors 1", () => {
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockReturnValueOnce(`
        {
            "TEST_VARIABLE": "TEST_VALUE_1"
            "ANOTHER_TEST_VARIABLE": "TEST_VALUE_1"
        };
        `);
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath")
            .mockReturnValueOnce(join(homedir(), ".zowe.env.json"));
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zowe");
        } catch (err) {
            error = err;
        }
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zowe");
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", false, undefined);
        expect(process.env.TEST_VARIABLE).not.toEqual("TEST_VALUE_1");
        expect(process.env.ANOTHER_TEST_VARIABLE).not.toEqual("TEST_VALUE_1");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error.message).toContain("Failed to set up environment variables from the environment file.");
        expect(error.message).toContain("File: " + join(homedir(), ".zowe.env.json"));
        expect(error.message).toContain("Line: 4");
        expect(error.message).toContain("Column: 12");
    });

    it("should fail to read the environment file and throw errors 2", () => {
        const readFileSyncSpy = jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
            throw new Error("Test");
        });
        const setEnvironmentForAppSpy = jest.spyOn(EnvFileUtils, "setEnvironmentForApp");
        const getEnvironmentFilePathSpy = jest.spyOn(EnvFileUtils, "getEnvironmentFilePath")
            .mockReturnValueOnce(join(homedir(), ".zowe.env.json"));
        let error;
        try {
            EnvFileUtils.setEnvironmentForApp("zowe");
        } catch (err) {
            error = err;
        }
        expect(setEnvironmentForAppSpy).toHaveBeenCalledTimes(1);
        expect(setEnvironmentForAppSpy).toHaveBeenCalledWith("zowe");
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledTimes(1);
        expect(getEnvironmentFilePathSpy).toHaveBeenCalledWith("zowe", false, undefined);
        expect(process.env.TEST_VARIABLE).not.toEqual("TEST_VALUE_1");
        expect(process.env.ANOTHER_TEST_VARIABLE).not.toEqual("TEST_VALUE_1");
        expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error.message).toContain("Failed to set up environment variables from the environment file.");
        expect(error.message).toContain("File: ");
        expect(error.message).not.toContain("Line:");
        expect(error.message).not.toContain("Column:");
    });
});