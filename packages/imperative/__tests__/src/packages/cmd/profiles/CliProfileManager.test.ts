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

import { inspect } from "util";
import { rimraf, TEST_RESULT_DIR } from "../../../TestUtil";
import { TestLogger } from "../../../../TestLogger";
import { CliProfileManager } from "../../../../../packages/cmd/src/profiles/CliProfileManager";
import { ICommandProfileTypeConfiguration } from "../../../../../packages/cmd";

describe("Cli Profile Manager", () => {
    const profileDir = TEST_RESULT_DIR + "/cliprofilemanager";
    const testLogger = TestLogger.getTestLogger();
    const profileTypeOne = "banana";

    const addTwoNumbersHandler = __dirname + "/profileHandlers/AddTwoNumbersHandler";
    afterEach(() => {
        rimraf(profileDir);
    });

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
        }];
    };
    it("should take a handler to create a profile from command line arguments, and " +
        "the handler should be called and the resulting profile should have the created fields in it.", async () => {
        const configs = getTypeConfigurations();
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
            args: {_: [], $0: "test", a, b}
        });
        testLogger.info("Save profile result: " + inspect(saveResult));
        const loadedProfile: any = await manager.load({name: profileName});
        expect(loadedProfile.profile.sum).toEqual(a + b);
    });


    it("If we provide a non existent handler to create a profile from command line arguments, " +
        "we should get a helpful error.", async () => {
        const configs = getTypeConfigurations();
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
                args: {_: [], $0: "test", doesNotMatter: "hi"}
            });
        } catch (e) {
            testLogger.info("Received error as expected: " + inspect(e));
            expect(e.message).toContain("handler");
            expect(e.message.toLowerCase()).toContain("error");
        }
    });

    it("should take a handler to update a profile that has already been created," +
        " call the handler and update the profile from arguments.",
    async () => {
        const configs = getTypeConfigurations();
        configs[0].updateProfileFromArgumentsHandler = addTwoNumbersHandler;
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const a = 1;
        const b = 2;
        const originalSum = 55;
        const profileName = "myprofile";
        const saveResult = await manager.save({
            name: profileName, type: profileTypeOne,
            profile: {sum: originalSum}
        });
        expect(saveResult.overwritten).toEqual(false);

        testLogger.info("Save profile result: " + inspect(saveResult));

        const updateResult = await manager.update({
            name: profileName, type: profileTypeOne,
            profile: {
                sum: 1
            },
            args: {_: [], $0: "fake", a, b}
        });
        expect(updateResult.profile.sum).toEqual(a + b);

        testLogger.info("Update profile result: " + inspect(updateResult));
        const loadedProfile: any = await manager.load({name: profileName});
        testLogger.info("Loaded profile after update: " + inspect(loadedProfile));
        expect(loadedProfile.profile.sum).toEqual(a + b);
    });

    it("If we provide a non existent handler to update a profile from command line arguments, " +
        "we should get a helpful error.", async () => {
        const configs = getTypeConfigurations();
        configs[0].updateProfileFromArgumentsHandler = __dirname + "/profileHandlers/fakearooni";
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const profileName = "badprofile";
        await manager.save({
            name: profileName, type: profileTypeOne,
            profile: {sum: 30}
        });
        try {
            await manager.update({
                name: profileName, type: profileTypeOne,
                profile: {sum: 2},
                args: {_: [], $0: "test", doesNotMatter: "hi"}
            });
        } catch (e) {
            testLogger.info("Received error as expected: " + inspect(e));
            expect(e.message).toContain("handler");
            expect(e.message.toLowerCase()).toContain("error");
        }
    });

    it("should be able to automatically map command line options to " +
        "profile fields without a handler for a simple single layer " +
        "profile schema", async () => {
        // use different option names than the field names
        // of the profile to test that the properties are associated
        // with the correct command line options
        const configs: ICommandProfileTypeConfiguration[] = [{
            type: profileTypeOne,
            schema: {
                type: "object",
                title: "test profile",
                description: "test profile",
                properties: {
                    property1: {
                        type: "number",
                        optionDefinition: {
                            name: "differentProperty1", type: "number", description: "property1"
                        }
                    },
                    property2: {
                        type: "string",
                        optionDefinition: {
                            name: "differentProperty2", type: "string", description: "property2"
                        }
                    }
                },
                required: ["property1"]
            },
        }];

        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const propertyOneValue = 345;
        const propertyTwoValue = "cell phone";
        const profileName = "myprofile";
        const saveResult = await manager.save({
            name: profileName, type: profileTypeOne,
            profile: {},
            args: {_: [], $0: "test", differentProperty1: propertyOneValue, differentProperty2: propertyTwoValue}
        });
        testLogger.info("Save profile result: " + inspect(saveResult));
        const loadedProfile: any = await manager.load({name: profileName});
        expect(loadedProfile.profile.property1).toEqual(propertyOneValue);
        expect(loadedProfile.profile.property2).toEqual(propertyTwoValue);
    });
});
