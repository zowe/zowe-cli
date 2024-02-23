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
import { ProfileIO } from "../ProfileIO";
import { ImperativeError } from "../../../../error/index";
import {
    BANANA_PROFILE_TYPE,
    BLUEBERRY_PROFILE_TYPE,
    BLUEBERRY_TYPE_SCHEMA,
    STRAWBERRY_PROFILE_TYPE
} from "../../../__tests__/TestConstants";
import { IMetaProfile, IProfile } from "../../../../index";
import { IProfileTypeConfiguration } from "../../doc/config/IProfileTypeConfiguration";
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

describe("Profile IO", () => {
    beforeEach(() => {
        // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();
    });

    it("should be able to create all profile directories", () => {
        mocks.createDirsSync.mockImplementation(((args: any) => {
            return;
        }) as any);
        ProfileIO.createProfileDirs(TEST_DIR_PATH);
        expect(mocks.createDirsSync).toHaveBeenCalledWith(TEST_DIR_PATH);
    });

    it("should throw an Imperative Error if an IO error occurs when creating profile directories", () => {
        mocks.createDirsSync.mockImplementation((args: any) => {
            throw new Error(err);
        });
        let error;
        try {
            ProfileIO.createProfileDirs(TEST_DIR_PATH);
        } catch (e) {
            error = e;
        }
        expect(mocks.createDirsSync).toHaveBeenCalledWith(TEST_DIR_PATH);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Profile IO Error: An error occurred creating profile directory:");
        expect(error.message).toContain("Error Details: IO ERROR!");
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

        const readMeta = ProfileIO.readMetaFile(TEST_DIR_PATH);
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
            const readMeta = ProfileIO.readMetaFile(TEST_DIR_PATH);
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Profile IO Error: Error reading profile file");
    });

    it("should be able to write a profile", () => {
        const prof: IProfile = {
            name: "strawberries",
            type: "strawberry",
            amount: 1000
        };
        mocks.yamlStringify.mockImplementation((args: any) => {
            return prof;
        });
        let written;
        mocks.writeFileSync.mockImplementation(((fullFilePath: string, profile: IProfile) => {
            written = profile;
            return;
        }) as any);
        ProfileIO.writeProfile(TEST_DIR_PATH, prof);
        expect(written).toBeDefined();
        expect(written).toEqual(prof);
    });

    it("should throw an imperative error if a write profile IO error occurs", () => {
        const prof: IProfile = {
            name: "strawberries",
            type: "strawberry",
            amount: 1000
        };
        mocks.yamlStringify.mockImplementation((args: any) => {
            return prof;
        });
        mocks.writeFileSync.mockImplementation(((fullFilePath: string, profile: IProfile) => {
            throw new Error(err);
        })as never);
        let error;
        try {
            ProfileIO.writeProfile(TEST_DIR_PATH, prof);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Profile IO Error: Error creating profile file");
        expect(error.message).toContain("Error Details: IO ERROR!");
    });

    it("should allow a delete of a profile", () => {
        mocks.unlinkSync.mockImplementation(((args: any): any => {
            return;
        }) as any);
        mocks.existsSync.mockImplementation((args: any): any => {
            return undefined;
        });
        const profname: string = "bad_apple";
        const fullPath: string = TEST_DIR_PATH + "/" + profname + ".yaml";
        ProfileIO.deleteProfile("bad_apple", fullPath);
        expect(mocks.unlinkSync).toHaveBeenCalledWith(fullPath);
        expect(mocks.existsSync).toHaveBeenCalledWith(fullPath);
    });

    it("should throw an imperative error if the file is not deleted", () => {
        const profname: string = "bad_apple";
        const fullPath: string = TEST_DIR_PATH + "/" + profname + ".yaml";
        mocks.unlinkSync.mockImplementation(((args: any) => {
            return;
        }) as any);
        mocks.existsSync.mockImplementation(((args: any) => {
            return fullPath;
        }) as any);
        let error;
        try {
            ProfileIO.deleteProfile("bad_apple", fullPath);
        } catch (e) {
            error = e;
        }
        expect(mocks.unlinkSync).toHaveBeenCalledWith(fullPath);
        expect(mocks.existsSync).toHaveBeenCalledWith(fullPath);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Profile IO Error: The profile bad_apple was unable to be deleted. Please check " +
            "the path indicated here and try to remove the profile manually:");
    });

    it("should throw an imperative error if an IO error occurs during a delete", () => {
        const profname: string = "bad_apple";
        const fullPath: string = TEST_DIR_PATH + "/" + profname + ".yaml";
        mocks.unlinkSync.mockImplementation((args: any) => {
            throw new Error(err);
        });
        mocks.existsSync.mockImplementation(((args: any) => {
            return fullPath;
        }) as any);
        let error;
        try {
            ProfileIO.deleteProfile("bad_apple", fullPath);
        } catch (e) {
            error = e;
        }
        expect(mocks.unlinkSync).toHaveBeenCalledWith(fullPath);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Profile IO Error: An unexpected profile delete error occurred for profile");
        expect(error.message).toContain("Error Details: IO ERROR!");
    });

    it("should allow us to check if a profile exists", () => {
        mocks.existsSync.mockImplementation((args: any): any => {
            return undefined;
        });
        const profname: string = "bad_apple";
        const fullPath: string = TEST_DIR_PATH + "/" + profname + ".yaml";
        const path = ProfileIO.exists(fullPath);
        expect(path).toBeUndefined();
        expect(mocks.existsSync).toHaveBeenCalledWith(fullPath);
    });

    it("should throw an imperative error if an exists IO error occurs", () => {
        mocks.existsSync.mockImplementation((args: any) => {
            throw new Error(err);
        });
        const profname: string = "bad_apple";
        const fullPath: string = TEST_DIR_PATH + "/" + profname + ".yaml";
        let error;
        try {
            const path = ProfileIO.exists(fullPath);
        } catch (e) {
            error = e;
        }
        expect(mocks.existsSync).toHaveBeenCalledWith(fullPath);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Profile IO Error: An error occurred checking for the existance of");
        expect(error.message).toContain("Error Details: IO ERROR!");
    });

    it("should be able to write a meta file", () => {
        const meta: IMetaProfile<IProfileTypeConfiguration> = {
            defaultProfile: "sweet_blueberry",
            configuration: {
                type: BLUEBERRY_PROFILE_TYPE,
                schema: BLUEBERRY_TYPE_SCHEMA
            }
        };
        mocks.yamlStringify.mockImplementation((args: any) => {
            return meta;
        });
        let written;
        mocks.writeFileSync.mockImplementation(((fullFilePath: string, contents: string, args: any) => {
            written = contents;
            return;
        }) as any);
        const metaPath = TEST_DIR_PATH + "/" + BLUEBERRY_PROFILE_TYPE + "_meta.yaml";
        const writeMeta = ProfileIO.writeMetaFile(meta, metaPath);
        expect(mocks.writeFileSync).toHaveBeenCalledWith(metaPath, meta, {encoding: "utf8"});
        expect(written).toBeDefined();
        expect(written).toEqual(meta);
    });

    it("should throw an imperative error if an IO error occurrs during writing the meta file", () => {
        const meta: IMetaProfile<IProfileTypeConfiguration> = {
            defaultProfile: "sweet_blueberry",
            configuration: {
                type: BLUEBERRY_PROFILE_TYPE,
                schema: BLUEBERRY_TYPE_SCHEMA
            }
        };
        mocks.yamlStringify.mockImplementation((args: any) => {
            return meta;
        });
        mocks.writeFileSync.mockImplementation((fullFilePath: string, contents: string, args: any) => {
            throw new Error(err);
        });
        const metaPath = TEST_DIR_PATH + "/" + BLUEBERRY_PROFILE_TYPE + "_meta.yaml";
        let error;
        try {
            ProfileIO.writeMetaFile(meta, metaPath);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(mocks.writeFileSync).toHaveBeenCalledWith(metaPath, meta, {encoding: "utf8"});
        expect(error.message).toContain("Profile IO Error: An error occurred converting and writing the meta profile to");
        expect(error.message).toContain("Error Details: IO ERROR!");
    });

    it("should be able to return the profile name from a file name", () => {
        const path = TEST_DIR_PATH + "/" + BLUEBERRY_PROFILE_TYPE + ".yaml";
        const name: string = ProfileIO.fileToProfileName(path as any, ".yaml");
        expect(name).toBe(BLUEBERRY_PROFILE_TYPE);
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
        const returnedTypes: string[] = ProfileIO.getAllProfileDirectories(TEST_DIR_PATH);
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
        const returnedTypes: string[] = ProfileIO.getAllProfileDirectories(TEST_DIR_PATH);
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
            const returnedTypes: string[] = ProfileIO.getAllProfileDirectories(TEST_DIR_PATH);
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
        const returnedTypes: string[] = ProfileIO.getAllProfileNames(TEST_DIR_PATH, ".yaml", "apple_meta");
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
            const returnedTypes: string[] = ProfileIO.getAllProfileNames(TEST_DIR_PATH, ".yaml", "apple_meta");
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
        const profile = ProfileIO.readProfileFile(TEST_DIR_PATH, "strawberry");
        expect(profile).toBeDefined();
        expect(profile).toEqual(prof);
    });

    it("should throw an imperative error if a profile IO read error occurs", () => {
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
            const profile = ProfileIO.readProfileFile(TEST_DIR_PATH, "strawberry");
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toContain("Error reading profile file");
        expect(error.message).toContain("Error Details: IO ERROR!");
    });
    describe("Profile operations should crash in team-config mode", () => {
        const configModeErr = "Profile IO Error: A Zowe V1 profile operation was attempted with a Zowe V2 configuration in use.";

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

        it("should crash in createProfileDirs", () => {
            let error;
            try {
                ProfileIO.createProfileDirs(TEST_DIR_PATH);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });

        it("should crash in readMetaFile", () => {
            let error;
            try {
                ProfileIO.readMetaFile(TEST_DIR_PATH);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });

        it("should crash in writeProfile", () => {
            const prof: IProfile = {
                name: "strawberries",
                type: "strawberry",
                amount: 1000
            };

            let error;
            try {
                ProfileIO.writeProfile(TEST_DIR_PATH, prof);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });

        it("should crash in deleteProfile", () => {
            let error;
            try {
                ProfileIO.deleteProfile("SomeName", TEST_DIR_PATH);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });

        it("should crash in exists", () => {
            let error;
            try {
                ProfileIO.exists(TEST_DIR_PATH);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });

        it("should crash in writeMetaFile", () => {
            const meta: IMetaProfile<IProfileTypeConfiguration> = {
                defaultProfile: "sweet_blueberry",
                configuration: {
                    type: BLUEBERRY_PROFILE_TYPE,
                    schema: BLUEBERRY_TYPE_SCHEMA
                }
            };

            let error;
            try {
                ProfileIO.writeMetaFile(meta, TEST_DIR_PATH);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });

        it("should crash in fileToProfileName", () => {
            let error;
            try {
                ProfileIO.fileToProfileName(TEST_DIR_PATH, ".yaml");
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
                ProfileIO.getAllProfileDirectories(TEST_DIR_PATH);
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
                ProfileIO.getAllProfileNames(TEST_DIR_PATH, ".yaml", "apple_meta");
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
                ProfileIO.readProfileFile(TEST_DIR_PATH, "strawberry");
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toContain(configModeErr);
        });
    });
});
