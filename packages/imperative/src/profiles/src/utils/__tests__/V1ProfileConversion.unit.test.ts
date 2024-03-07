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
jest.mock("../../../../io/src/IO");
jest.mock("js-yaml");
jest.mock("yamljs");
jest.mock("../../../../utilities/src/ImperativeConfig");

import * as fs from "fs";
import { IO } from "../../../../io/src/IO";
import { V1ProfileConversion } from "../V1ProfileConversion";
import { ImperativeError } from "../../../../error/index";
import {
    BANANA_PROFILE_TYPE,
    BLUEBERRY_PROFILE_TYPE,
    BLUEBERRY_TYPE_SCHEMA,
    STRAWBERRY_PROFILE_TYPE
} from "../../../../cmd/__tests__/profiles/TestConstants";
import { IProfile } from "../../../../index";
import { ImperativeConfig } from "../../../../utilities";

const readYaml = require("js-yaml");
const writeYaml = require("yamljs");

const mocks = {
    createDirsSync: jest.spyOn(IO, "createDirsSync"),
    safeLoad: jest.spyOn(readYaml, "load"),
    writeFileSync: jest.spyOn(fs, "writeFileSync"),
    yamlStringify: jest.spyOn(writeYaml, "stringify"),
    unlinkSync: jest.spyOn(fs, "unlinkSync"),
    existsSync: jest.spyOn(fs, "existsSync"),
    readdirSync: jest.spyOn(fs, "readdirSync"),
    readFileSync: jest.spyOn(fs, "readFileSync"),
    statSync: jest.spyOn(fs, "statSync")
};

const TEST_DIR_PATH: string = "/__tests__/__results__/data/.testHomeDir";
const err: string = "IO ERROR!";

describe("V1 Profile Conversion", () => {
    beforeEach(() => {
        // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();
    });

    it("should be able to read the meta file", () => {
        const meta = {
            defaultProfile: [{
                name: "sweet_blueberry",
                type: BLUEBERRY_PROFILE_TYPE
            }],
            configuration: {
                type: BLUEBERRY_PROFILE_TYPE,
                schema: BLUEBERRY_TYPE_SCHEMA
            }
        };

        mocks.safeLoad.mockImplementation((args: any) => {
            return meta;
        });

        const readMeta = V1ProfileConversion.readMetaFile(TEST_DIR_PATH);
        expect(readMeta).toBeDefined();
        expect(readMeta).toMatchSnapshot();
    });

    it("should throw an imperative error if an error occurs reading the meta file", () => {
        const meta = {
            defaultProfile: [{
                name: "sweet_blueberry",
                type: BLUEBERRY_PROFILE_TYPE
            }],
            configuration: {
                type: BLUEBERRY_PROFILE_TYPE,
                schema: BLUEBERRY_TYPE_SCHEMA
            }
        };

        mocks.safeLoad.mockImplementation((args: any) => {
            throw new Error(err);
        });

        let error;
        try {
            const readMeta = V1ProfileConversion.readMetaFile(TEST_DIR_PATH);
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("V1ProfileConversion Read Error: Error reading profile file");
    });

    it("should return a list of profile types", () => {
        const types: string[] = [BLUEBERRY_PROFILE_TYPE, STRAWBERRY_PROFILE_TYPE, BANANA_PROFILE_TYPE];
        mocks.readdirSync.mockImplementationOnce(((path: any) => {
            return types;
        }) as any);
        mocks.statSync.mockImplementation(((filePath: string) => {
            return {
                isDirectory: jest.fn(() => {
                    return true;
                }),
            };
        }) as any);
        const returnedTypes: string[] = V1ProfileConversion.getAllProfileDirectories(TEST_DIR_PATH);
        expect(mocks.readdirSync).toHaveBeenCalledWith(TEST_DIR_PATH);
        expect(returnedTypes).toEqual(types);
    });

    it("should return a list of profile types but filter out non directory entries", () => {
        const types: string[] = [BLUEBERRY_PROFILE_TYPE, STRAWBERRY_PROFILE_TYPE, BANANA_PROFILE_TYPE];
        mocks.readdirSync.mockImplementationOnce(((path: any) => {
            return types;
        }) as any);
        mocks.statSync.mockImplementation(((filePath: string) => {
            return {
                isDirectory: jest.fn(() => {
                    // pretend "banana" is not a directory
                    return !filePath.includes(BANANA_PROFILE_TYPE);
                }),
            };
        }) as any);
        const returnedTypes: string[] = V1ProfileConversion.getAllProfileDirectories(TEST_DIR_PATH);
        expect(mocks.readdirSync).toHaveBeenCalledWith(TEST_DIR_PATH);
        expect(returnedTypes).toEqual(types.filter((type) => {
            // results shouldn't contain banana
            return type !== BANANA_PROFILE_TYPE;
        }));
    });

    it("should throw an imperative error if the read directory IO error occurs", () => {
        const types: string[] = [BLUEBERRY_PROFILE_TYPE, STRAWBERRY_PROFILE_TYPE, BANANA_PROFILE_TYPE];
        mocks.readdirSync.mockImplementation((path: any) => {
            throw new Error(err);
        });
        let error;
        try {
            const returnedTypes: string[] = V1ProfileConversion.getAllProfileDirectories(TEST_DIR_PATH);
        } catch (e) {
            error = e;
        }
        expect(mocks.readdirSync).toHaveBeenCalledWith(TEST_DIR_PATH);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("An error occurred attempting to read all profile directories from");
        expect(error.message).toContain("Error Details: IO ERROR!");
    });

    it("should return a list of profile names", () => {
        const fileNames: string[] = ["rotten.yaml", "fresh.yaml", "apple_meta.yaml"];
        const names: string[] = ["rotten", "fresh"];
        mocks.readdirSync.mockImplementation(((path: any) => {
            return fileNames;
        }) as any);
        const returnedTypes: string[] = V1ProfileConversion.getAllProfileNames(TEST_DIR_PATH, ".yaml", "apple_meta");
        expect(mocks.readdirSync).toHaveBeenCalledWith(TEST_DIR_PATH);
        expect(returnedTypes).toEqual(names);
    });

    it("should throw an imperative error if an IO error occurs getting profile names", () => {
        const fileNames: string[] = ["rotten.yaml", "fresh.yaml", "apple_meta.yaml"];
        const names: string[] = ["rotten", "fresh"];
        mocks.readdirSync.mockImplementation((path: any) => {
            throw new Error(err);
        });
        let error;
        try {
            const returnedTypes: string[] = V1ProfileConversion.getAllProfileNames(TEST_DIR_PATH, ".yaml", "apple_meta");
        } catch (e) {
            error = e;
        }
        expect(mocks.readdirSync).toHaveBeenCalledWith(TEST_DIR_PATH);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("An error occurred attempting to read all profile names from");
        expect(error.message).toContain("Error Details: IO ERROR!");
    });

    it("should be able to read a profile", () => {
        const prof: IProfile = {
            name: "strawberries",
            type: "strawberry",
            amount: 1000
        };
        mocks.safeLoad.mockImplementation((args: any) => {
            return prof;
        });
        const profile = V1ProfileConversion.readProfileFile(TEST_DIR_PATH, "strawberry");
        expect(profile).toBeDefined();
        expect(profile).toEqual(prof);
    });

    it("should throw an imperative error if a V1 Profile Conversion read error occurs", () => {
        const prof: IProfile = {
            name: "strawberries",
            type: "strawberry",
            amount: 1000
        };
        mocks.safeLoad.mockImplementation((args: any) => {
            throw new Error(err);
        });
        let error;
        try {
            const profile = V1ProfileConversion.readProfileFile(TEST_DIR_PATH, "strawberry");
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Error reading profile file");
        expect(error.message).toContain("Error Details: IO ERROR!");
    });

    describe("Profile operations should crash in team-config mode", () => {
        const configModeErr = "V1ProfileConversion Read Error: " +
            "Attempted to convert a Zowe V1 profile when a newer Zowe client configuration already exists.";

        beforeEach(() => {
            /* Pretend that we have a team config.
             * config is a getter of a property, so mock we the property.
             */
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: true
                    };
                })
            });
        });

        afterEach(() => {
            // set us back to old-school profile mode
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: false
                    };
                })
            });
        });

        it("should crash in readMetaFile", () => {
            let error;
            try {
                V1ProfileConversion.readMetaFile(TEST_DIR_PATH);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });

        it("should crash in getAllProfileDirectories", () => {
            let error;
            try {
                V1ProfileConversion.getAllProfileDirectories(TEST_DIR_PATH);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });

        it("should crash in getAllProfileNames", () => {
            let error;
            try {
                V1ProfileConversion.getAllProfileNames(TEST_DIR_PATH, ".yaml", "apple_meta");
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });

        it("should crash in readProfileFile", () => {
            let error;
            try {
                V1ProfileConversion.readProfileFile(TEST_DIR_PATH, "strawberry");
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });
    });
});
