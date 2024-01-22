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

import { ProfileUtils } from "../../../../src/profiles/utils/ProfileUtils";
import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { ICommandProfileTypeConfiguration } from "../../../../src/cmd/doc/profiles/definition/ICommandProfileTypeConfiguration";
import { ProfileIO } from "../../../../src/profiles/utils/ProfileIO";
import { CliProfileManager } from "../../../../src/cmd/profiles/CliProfileManager";
import { IProfile } from "../../../../src/profiles/doc/definition/IProfile";
import { inspect } from "util";
import { ISaveProfileFromCliArgs } from "../../../../src/profiles/doc/parms/ISaveProfileFromCliArgs";
import { ImperativeError } from "../../../../src/error/ImperativeError";
import { STRAWBERRY_PROFILE_TYPE } from "../../../../__tests__/__unit__/profiles/TestConstants";
import { TEST_PROFILE_ROOT_DIR } from "../../../../__tests__/__unit__/profiles/TestConstants";
import { IProfileLoaded } from "../../../..";

jest.mock("../../../../src/profiles/utils/ProfileIO");
jest.mock("../../../../src/security/DefaultCredentialManager");

describe("Cli Profile Manager", () => {
    let writtenProfile: any;

    const originalSaveProfile = (CliProfileManager.prototype as any).saveProfile;
    afterEach(() => {
        (CliProfileManager.prototype as any).saveProfile = originalSaveProfile;
    });
    ProfileIO.writeProfile = jest.fn((fullFilePath: string, profile: IProfile) => {
        writtenProfile = profile;
    });

    ProfileIO.exists = jest.fn((path: string) => {
        return path.indexOf("meta") === -1 ? path : undefined;
    });

    (ProfileIO.readMetaFile as any) = jest.fn((fullFilePath: string) => {
        return {
            defaultProfile: "mybana",
            configuration: {
                type: "",
                schema: {
                    type: "object",
                    title: "test profile",
                    description: "test profile",
                    properties: {
                        sum: {
                            type: "number"
                        }
                    },
                    required: ["sum"]
                }
            }
        };
    });
    afterEach(() => {
        writtenProfile = undefined; // clear any saved profile to not pollute results across tests
    });

    const profileDir = "dummy";
    const testLogger = TestLogger.getTestLogger();
    const profileTypeOne = "banana";
    const profileTypeTwo = "dependencies";
    const profileTypeThree = "differentOptions";
    const addTwoNumbersHandler = __dirname + "/profileHandlers/AddTwoNumbersHandler";
    const doNothingHandler = __dirname + "/profileHandlers/DoNothingHandler";
    const throwErrorHandler = __dirname + "/profileHandlers/ThrowErrorHandler";
    const getTypeConfigurations: () => ICommandProfileTypeConfiguration[] = () => {
        return [{
            type: profileTypeOne,
            schema: {
                type: "object",
                title: "test profile",
                description: "test profile",
                properties: {
                    sum: {
                        type: "number"
                    }
                },
                required: ["sum"]
            },
        }, {
            type: profileTypeTwo,
            schema: {
                type: "object",
                title: "profile with dependencies",
                description: "profile with dependencies",
                properties: {},
                required: ["dependencies"]
            },
            dependencies: [
                {type: profileTypeOne, description: profileTypeOne + " dependency", required: true}
            ]
        },
        {
            type: profileTypeThree,
            title: "profile with different option names compare to schema fields",
            schema: {
                type: "object",
                title: "test profile",
                description: "test profile",
                properties: {
                    property1: {
                        type: "number",
                        optionDefinition: {
                            name: "differentProperty1",
                            type: "number",
                            description: "property1"
                        }
                    },
                    property2: {
                        type: "string",
                        optionDefinition: {
                            name: "differentProperty2",
                            type: "string",
                            description: "property2"
                        }
                    },
                    hasChild: {
                        type: "object",
                        properties: {
                            hasGrandChild: {
                                type: "object",
                                properties: {
                                    grandChild: {
                                        optionDefinition: {
                                            name: "myGrandChild",
                                            type: "string",
                                            description: "my grand child",
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                required: ["property2"]
            },
        }];
    };

    it("should only load all profiles of the manager type if requested", async () => {
        // Mock the profile IO functions
        ProfileIO.getAllProfileNames = jest.fn((dir, ext, meta) => {
            expect(dir).toContain(profileTypeOne);
            return ["prof_banana"];
        });

        // Create an instance of the manager
        const configs = getTypeConfigurations();
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });

        // Load "all" profiles
        const loads: IProfileLoaded[] = await manager.loadAll({typeOnly: true});
        expect(ProfileIO.getAllProfileNames).toHaveBeenCalledTimes(1);
    });

    it("should take a handler to create a profile from command line arguments, and " +
        "the handler should be called and the resulting profile should have the created fields in it.", async () => {
        const configs = getTypeConfigurations();

        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });

        configs[0].createProfileFromArgumentsHandler = addTwoNumbersHandler;
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const a = 1;
        const b = 2;
        const profileName = "myprofile";
        const saveResult = await manager.save({
            name: profileName, type: profileTypeOne,
            profile: {},
            args: {_: [], $0: "test", a, b},
            overwrite: true
        });
        testLogger.info("Save profile result: " + inspect(saveResult));
        expect(saveResult.profile.sum).toEqual(a + b);
        expect(writtenProfile.sum).toEqual(a + b);
    });

    it("should take a handler to update a profile from command line arguments, and " +
        "the handler should be called and the resulting profile should have the created fields in it.", async () => {
        const configs = getTypeConfigurations();
        const oldSum = 55;
        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        ProfileIO.readProfileFile = jest.fn((fullFilePath: string, type: "string") => {
            return {name: profileName, type: profileTypeOne, sum: oldSum};
        });
        configs[0].updateProfileFromArgumentsHandler = addTwoNumbersHandler;
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const a = 1;
        const b = 2;
        const profileName = "myprofile";
        const saveResult = await manager.update({
            name: profileName, type: profileTypeOne,
            profile: {},
            args: {_: [], $0: "test", a, b}
        });
        testLogger.info("Update profile result: " + inspect(saveResult));
        expect(saveResult.profile.sum).toEqual(a + b);
    });

    it("should take a handler to create a profile from command line arguments, but if " +
        "the profile handler does not add a field required by the schema, " +
        "we should get a validation error", async () => {
        const configs = getTypeConfigurations();
        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        ProfileIO.writeProfile = jest.fn((fullFilePath: string, profile: IProfile) => {
            writtenProfile = profile;
        });
        configs[0].createProfileFromArgumentsHandler = doNothingHandler;
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const a = 1;
        const b = 2;
        const profileName = "myprofile";
        try {
            await manager.save({
                name: profileName, type: profileTypeOne,
                profile: {},
                args: {_: [], $0: "test", a, b},
                overwrite: true
            });
        } catch (e) {
            expect(e.message).toContain("content");
        }
    });

    it("should still create a profile properly without providing args", async () => {
        const configs = getTypeConfigurations();

        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        ProfileIO.writeProfile = jest.fn((fullFilePath: string, profile: IProfile) => {
            writtenProfile = profile;
        });
        configs[0].createProfileFromArgumentsHandler = doNothingHandler;
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const profileName = "myprofile";
        let caughtError;

        try {
            await manager.save({
                name: profileName, type: profileTypeOne,
                profile: {sum: 55},
                overwrite: true
            });
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
    });

    it("should still update a profile properly without providing args", async () => {
        const configs = getTypeConfigurations();
        const oldSum = 55;
        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        ProfileIO.readProfileFile = jest.fn((fullFilePath: string, type: "string") => {
            return {name: profileName, type: profileTypeOne, sum: oldSum};
        });
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const processSecurePropertiesSpy = jest.spyOn(manager as any, "processSecureProperties");
        const newSum = 66;
        const profileName = "myprofile";
        const saveResult = await manager.update({
            name: profileName, type: profileTypeOne,
            profile: {sum: newSum}
        });
        testLogger.info("Update profile result: " + inspect(saveResult));
        expect(saveResult.profile.sum).toEqual(newSum);
        // Should have only processed secure properties once
        expect(processSecurePropertiesSpy).toHaveBeenCalledTimes(1);
    });

    it("should still fail profile validation on creation if no args are provided", async () => {
        const configs = getTypeConfigurations();

        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        ProfileIO.writeProfile = jest.fn((fullFilePath: string, profile: IProfile) => {
            writtenProfile = profile;
        });
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const profileName = "myprofile";

        try {
            await manager.save({
                name: profileName, type: profileTypeOne,
                profile: {},
                overwrite: true
            });
        } catch (e) {
            testLogger.warn("Got error as expected:" + inspect(e.stack, {depth: null, breakLength: 40}));
            expect(e.message).toContain("content");
        }
    });

    it("should still fail profile validation on update if no args are provided", async () => {
        const configs = getTypeConfigurations();

        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        ProfileIO.writeProfile = jest.fn((fullFilePath: string, profile: IProfile) => {
            writtenProfile = profile;
        });
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const profileName = "myprofile";

        try {
            await manager.update({
                name: profileName, type: profileTypeOne,
                profile: {},
                overwrite: true
            });
        } catch (e) {
            expect(e.message).toContain("content");
        }
    });

    it("If we provide a non existent handler to create a profile from command line arguments, " +
        "we should get a helpful error.", async () => {
        const configs = getTypeConfigurations();
        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        configs[0].createProfileFromArgumentsHandler = __dirname + "/profileHandlers/fakearooni";
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        try {
            await manager.save({
                name: "badprofile", type: profileTypeOne,
                profile: {sum: 2},
                args: {_: [], $0: "test", doesNotMatter: "hi"},
                overwrite: true
            });
        } catch (e) {
            testLogger.info("Received error as expected: " + inspect(e));
            expect(e.message).toContain("handler");
            expect(e.message.toLowerCase()).toContain("error");
        }
    });

    it("If we provide a non existent handler to update a profile from command line arguments, " +
        "we should get a helpful error.", async () => {
        const configs = getTypeConfigurations();
        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        configs[0].updateProfileFromArgumentsHandler = __dirname + "/profileHandlers/fakearooni";
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        try {
            await manager.update({
                name: "badprofile", type: profileTypeOne,
                profile: {sum: 2},
                args: {_: [], $0: "test", doesNotMatter: "hi"},
                overwrite: true
            });
        } catch (e) {
            testLogger.info("Received error as expected: " + inspect(e));
            expect(e.message).toContain("handler");
            expect(e.message.toLowerCase()).toContain("error");
        }
    });

    it("should catch errors thrown by custom profile create handler and expose them " +
        "to the user", async () => {
        const configs = getTypeConfigurations();

        ProfileIO.writeProfile = jest.fn((fullFilePath: string, profile: IProfile) => {
            // do nothing
        });
        ProfileIO.readProfileFile = jest.fn((fullFilePath: string, type: "string") => {
            return {name: profileName, type: profileTypeOne};
        });
        configs[0].createProfileFromArgumentsHandler = throwErrorHandler;
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const a = 1;
        const b = 2;
        const profileName = "myprofile";
        try {
            await manager.save({
                name: profileName, type: profileTypeOne,
                profile: {},
                args: {_: [], $0: "test", a, b},
                overwrite: true
            });
        } catch (e) {
            testLogger.info("Received error as expected: " + inspect(e));
            expect(e.message).toContain("custom");
            expect(e.message).toContain("handler");
            expect(e.message).toContain("threw"); // expect the output from the error in the handler
        }

    });
    it("should catch errors thrown by custom profile update handler and expose them " +
        "to the user", async () => {
        const configs = getTypeConfigurations();

        ProfileIO.writeProfile = jest.fn((fullFilePath: string, profile: IProfile) => {
            // do nothing
        });
        ProfileIO.readProfileFile = jest.fn((fullFilePath: string, type: "string") => {
            return {name: profileName, type: profileTypeOne};
        });
        configs[0].updateProfileFromArgumentsHandler = throwErrorHandler;
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const a = 1;
        const b = 2;
        const profileName = "myprofile";
        try {
            await manager.update({
                name: profileName, type: profileTypeOne,
                profile: {},
                args: {_: [], $0: "test", a, b},
                overwrite: true
            });
        } catch (e) {
            testLogger.info("Received error as expected: " + inspect(e));
            expect(e.message).toContain("custom");
            expect(e.message).toContain("handler");
            expect(e.message).toContain("threw"); // expect the output from the error in the handler
        }

    });
    it("should create a profile with dependencies if the proper command line arguments are provided",
        async () => {
            (ProfileIO.exists as any) = jest.fn(() => {
                return true; // pretend the dependent profile already exists
            });
            const configs = getTypeConfigurations();
            ProfileIO.writeProfile = jest.fn(
                (fullFilePath: string, profile: IProfile) => {
                    // do nothing
                });
            ProfileIO.readProfileFile = jest.fn(
                (fullFilePath: string, type: "string") => {
                    return {name: profileName, type: profileTypeOne, sum: 55};
                });

            const manager = new CliProfileManager({
                profileRootDirectory: profileDir,
                type: profileTypeTwo,
                logger: testLogger,
                typeConfigurations: configs
            });
            const dependentProfileName = "myFirstProfile";
            const profileName = "myprofile";

            const args: any = {_: [], $0: "test"};
            args[ProfileUtils.getProfileOption(profileTypeOne)] = dependentProfileName;
            const saveResult = await manager.save({
                name: profileName, type: profileTypeTwo,
                profile: {},
                args,
                overwrite: true
            });
            expect(saveResult.profile.dependencies[0].name).toEqual(dependentProfileName);
            expect(saveResult.profile.dependencies[0].type).toEqual(profileTypeOne);
        });

    it("should be able to map option definitions back to differently named " +
        "profile fields on update", async () => {
        const configs = getTypeConfigurations();
        const oldSum = 55;
        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        ProfileIO.readProfileFile = jest.fn((fullFilePath: string,
            type: "string") => {
            return {
                name: profileName,
                type: profileTypeThree,
                sum: oldSum
            };
        });
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeThree,
            logger: testLogger,
            typeConfigurations: configs
        });

        const profileName = "myprofile";
        const property1Value = 5;
        const property2Value = "hello";
        const updateResult = await manager.update({
            name: profileName, type: profileTypeThree,
            profile: {},
            args: {
                _: [], $0: "test",
                differentProperty1: property1Value,
                differentProperty2: property2Value,
                myGrandChild: "johnny"
            }
        });
        testLogger.info("Update profile result: " + inspect(updateResult, {depth: null}));
        expect(updateResult.profile.property1).toEqual(property1Value);
        expect(updateResult.profile.property2).toEqual(property2Value);
        expect(updateResult.profile.hasChild.hasGrandChild.grandChild).toEqual("johnny");
    });

    it("should be able to map option definitions back to differently named " +
        "profile fields on creation", async () => {
        const configs = getTypeConfigurations();
        const oldSum = 55;
        (ProfileIO.exists as any) = jest.fn(() => {
            return true; // pretend the profile already exists
        });
        ProfileIO.readProfileFile = jest.fn((fullFilePath: string,
            type: "string") => {
            return {
                name: profileName,
                type: profileTypeThree,
                sum: oldSum
            };
        });
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeThree,
            logger: testLogger,
            typeConfigurations: configs
        });

        const profileName = "myprofile";
        const property1Value = 5;
        const property2Value = "hello";
        const saveResult = await manager.save({
            name: profileName, type: profileTypeThree,
            profile: {},
            args: {
                _: [], $0: "test",
                differentProperty1: property1Value,
                differentProperty2: property2Value,
                myGrandChild: "johnny"
            },
            overwrite: true
        });
        testLogger.info("Save profile result: " + inspect(saveResult, {depth: null}));
        expect(saveResult.profile.property1).toEqual(property1Value);
        expect(saveResult.profile.property2).toEqual(property2Value);
        expect(saveResult.profile.hasChild.hasGrandChild.grandChild).toEqual("johnny");
    });


    it("should provide a helpful error message if an error is encountered saving the profile " +
        "while updating", async () => {
        const configs = getTypeConfigurations();
        const oldSum = 55;
        (ProfileIO.exists as any)= jest.fn(() => {
            return true; // pretend the profile already exists
        });
        ProfileIO.readProfileFile = jest.fn((fullFilePath: string,
            type: "string") => {
            return {
                name: profileName,
                type: profileTypeThree,
                sum: oldSum
            };
        });

        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeThree,
            logger: testLogger,
            typeConfigurations: configs
        });
        const errMessage = "weasel";
        (CliProfileManager.prototype as any).saveProfile = jest.fn(async (parms: ISaveProfileFromCliArgs) => {
            throw new ImperativeError({msg: errMessage});
        });
        const profileName = "myprofile";
        const property1Value = 5;
        const property2Value = "hello";
        try {
            await manager.update({
                name: profileName, type: profileTypeThree,
                profile: {},
                args: {
                    _: [], $0: "test",
                    differentProperty1: property1Value,
                    differentProperty2: property2Value,
                    myGrandChild: "johnny"
                }
            });
        } catch (e) {
            expect(e.message).toContain(errMessage);
            expect(e.message).toContain("profile");
            return;
        }
        expect("should have encountered an error").toBeFalsy();
    });

    it("should merge on update if \"merge\" is specified on the parms and no CLI args are specfied", async () => {
        const prof = new CliProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: [{
                type: STRAWBERRY_PROFILE_TYPE,
                schema: {
                    type: "object",
                    title: "test profile for updating on merging",
                    description: "ditto",
                    properties: {
                        myArrayVariable: {
                            type: "array"
                        },
                        hasNestedArray: {
                            type: "object"
                        }
                    }
                }
            }],
            type: STRAWBERRY_PROFILE_TYPE,
            logger: testLogger
        });
        const profileA = {
            type: STRAWBERRY_PROFILE_TYPE, name: "first",
            myArrayVariable: ["old_value1", "oldValue2"],
            // test that the array replacement still works on deeply nested fields
            hasNestedArray: {hasNestedArray: {hasNestedArray: ["old_value1", "old_value2"]}},
        };
        ProfileIO.writeProfile = jest.fn((path: string, profile: any) => {
            // do nothing
        });
        ProfileIO.exists = jest.fn((path: string) => {
            return path.indexOf("meta") === -1 ? path : undefined;
        });
        ProfileIO.readProfileFile = jest.fn((filePath: string, type: string) => {
            if (type === STRAWBERRY_PROFILE_TYPE) {
                return profileA;
            } else {
                return {
                    type: "apple",
                    name: "thing"
                };
            }
        });
        const profileB: IProfile = {
            myArrayVariable: ["new_value1", "new_value2", "new_value3"],
            hasNestedArray: {hasNestedArray: {hasNestedArray: ["new_value1", "new_value2", "new_value3", "new_value4"]}},
        };
        const updateResult = await prof.update({
            type: STRAWBERRY_PROFILE_TYPE,
            name: "first", profile: profileB, merge: true
        });
        const merged = updateResult.profile;
        testLogger.info("Merged profile result: " + inspect(merged, {depth: null}));
        expect(merged.myArrayVariable.length).toEqual(profileB.myArrayVariable.length);
        for (const oldValue of profileA.myArrayVariable) {
            expect(merged.myArrayVariable.indexOf(oldValue)).toEqual(-1);
        }

        for (const oldValue of profileA.hasNestedArray.hasNestedArray.hasNestedArray) {
            expect(merged.hasNestedArray.hasNestedArray.hasNestedArray.indexOf(oldValue)).toEqual(-1);
        }
        expect(merged.hasNestedArray.hasNestedArray.hasNestedArray.length).toEqual(profileB.hasNestedArray.hasNestedArray.hasNestedArray.length);
        expect(merged.hasNestedArray).toEqual(profileB.hasNestedArray);
    });

    it("should merge on update if \"merge\" is specified on the parms and CLI args are specfied", async () => {
        const prof = new CliProfileManager({
            profileRootDirectory: TEST_PROFILE_ROOT_DIR,
            typeConfigurations: [{
                type: STRAWBERRY_PROFILE_TYPE,
                schema: {
                    type: "object",
                    title: "test profile for updating on merging",
                    description: "ditto",
                    properties: {
                        myArrayVariable: {
                            type: "array",
                            optionDefinition: {
                                type: "array",
                                description: "my array variable",
                                name: "myArrayVariable"
                            }
                        },
                        hasNestedArray: {
                            type: "object",
                            properties: {
                                hasNestedArray: {
                                    type: "object", properties: {
                                        hasNestedArray: {
                                            type: "array",
                                            optionDefinition: {
                                                type: "array",
                                                name: "hasNestedArray",
                                                description: "nested array property"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }],
            type: STRAWBERRY_PROFILE_TYPE,
            logger: testLogger
        });
        const profileA = {
            myArrayVariable: ["old_value1", "oldValue2"],
            // test that the array replacement still works on deeply nested fields
            hasNestedArray: {hasNestedArray: {hasNestedArray: ["old_value1", "old_value2"]}},
        };
        ProfileIO.writeProfile = jest.fn((path: string, profile: any) => {
            // do nothing
        });
        ProfileIO.exists = jest.fn((path: string) => {
            return path.indexOf("meta") === -1 ? path : undefined;
        });
        ProfileIO.readProfileFile = jest.fn((filePath: string, type: string) => {
            if (type === STRAWBERRY_PROFILE_TYPE) {
                return profileA;
            } else {
                return {
                    type: "apple",
                    name: "thing"
                };
            }
        });
        const profileB: IProfile = {
            type: STRAWBERRY_PROFILE_TYPE,
            name: "first"
        };
        const newArrayVariable = ["new_value1", "new_value2", "new_value3"];
        const newNestedArray = ["new_value1", "new_value2", "new_value3", "new_value4"];
        const updateResult = await prof.update({
            type: STRAWBERRY_PROFILE_TYPE, name: "first",
            profile: profileB, args: {
                $0: "dummy", _: [],
                hasNestedArray: newNestedArray,
                myArrayVariable: newArrayVariable,
            },
            merge: true
        });
        const merged = updateResult.profile;
        testLogger.info("Merged profile result: " + inspect(merged, {depth: null}));
        expect(merged.myArrayVariable.length).toEqual(newArrayVariable.length);
        for (const oldValue of profileA.myArrayVariable) {
            expect(merged.myArrayVariable.indexOf(oldValue)).toEqual(-1);
        }

        for (const oldValue of profileA.hasNestedArray.hasNestedArray.hasNestedArray) {
            expect(merged.hasNestedArray.hasNestedArray.hasNestedArray.indexOf(oldValue)).toEqual(-1);
        }
        expect(merged.hasNestedArray.hasNestedArray.hasNestedArray.length).toEqual(newNestedArray.length);
        expect(merged.hasNestedArray.hasNestedArray.hasNestedArray).toEqual(newNestedArray);
    });
});
