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

import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { ICommandProfileTypeConfiguration } from "../../src/doc/profiles/definition/ICommandProfileTypeConfiguration";
import { ProfileIO } from "../../../profiles/src/utils/ProfileIO";
import { CliProfileManager } from "../../src/profiles/CliProfileManager";
import { IProfile } from "../../../profiles/src/doc/definition/IProfile";
import { inspect } from "util";
import { ImperativeError } from "../../../error/src/ImperativeError";
import { PROFILE_TYPE } from "../../../../__tests__/src/packages/profiles/src/constants/BasicProfileManagerTestConstants";
import { TEST_PROFILE_ROOT_DIR } from "../../../profiles/__tests__/TestConstants";
import { IProfileLoaded } from "../../..";

jest.mock("../../../profiles/src/utils/ProfileIO");
jest.mock("../../../security/src/DefaultCredentialManager");

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
});
