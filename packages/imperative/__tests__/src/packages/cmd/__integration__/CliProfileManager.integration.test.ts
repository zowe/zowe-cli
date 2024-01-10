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

jest.mock("../../../../../src/utilities/src/ImperativeConfig");

import { TestLogger } from "../../../../src/TestLogger";
import { CliProfileManager } from "../../../../../src/cmd/src/profiles/CliProfileManager";
import { ICommandProfileTypeConfiguration } from "../../../../../src/cmd";

describe("Cli Profile Manager", () => {
    const profileDir = __dirname + "/__resources__/cliprofilemanager";
    const addTwoNumbersHandler = __dirname + "/../profileHandlers/AddTwoNumbersHandler";
    const testLogger = TestLogger.getTestLogger();
    const profileTypeOne = "banana";

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

    it("should be able to load properties from an existing profile", async () => {
        const profileName = "myprofile";
        const configs = getTypeConfigurations();
        configs[0].createProfileFromArgumentsHandler = addTwoNumbersHandler;
        const manager = new CliProfileManager({
            profileRootDirectory: profileDir,
            type: profileTypeOne,
            logger: testLogger,
            typeConfigurations: configs
        });
        const loadedProfile: any = await manager.load({name: profileName});
        expect(loadedProfile.profile.sum).toEqual(3);
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

        let caughtError;
        try {
            new CliProfileManager({
                profileRootDirectory: profileDir,
                type: profileTypeOne,
                logger: testLogger,
                typeConfigurations: configs
            });
        } catch (error) {
            caughtError = error;
        }
        expect(caughtError).toBeUndefined();
    });
});
