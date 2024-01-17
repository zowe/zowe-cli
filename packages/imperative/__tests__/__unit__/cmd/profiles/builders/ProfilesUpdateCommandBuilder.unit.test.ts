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

import { deleteHandlerPaths, testBuilderProfiles } from "./ProfileBuilderTestConstants";
import { TestLogger } from "../../../../../__tests__/src/TestLogger";
import { ProfilesUpdateCommandBuilder } from "../../../../../src/imperative/profiles/builders/ProfilesUpdateCommandBuilder";

describe("Profile Update Command Builder", () => {
    const logger = TestLogger.getTestLogger();
    it("should provide a valid command definition for the " +
        "profile update command based on our test profile type", () => {
        const firstProfileType = testBuilderProfiles[0];
        let commands = new ProfilesUpdateCommandBuilder(firstProfileType.type, logger, firstProfileType).buildFull();
        commands = deleteHandlerPaths(commands);
        expect(commands).toMatchSnapshot();
    });

    it("should expose options for nested properties", () => {
        const command = new ProfilesUpdateCommandBuilder("test",
            logger, {
                type: "test",
                schema: {
                    title: "Type A profile",
                    type: "object",
                    description: "Type A profile for builder tests",
                    properties: {
                        myParent: {
                            type: "object",
                            properties: {
                                middleProperty: {
                                    type: "object",
                                    properties: {
                                        myNestedProperty: {
                                            optionDefinition: {
                                                description: "The nested property",
                                                type: "string",
                                                name: "nested",
                                                required: true
                                            },
                                            type: "string"
                                        }
                                    }
                                }
                            }
                        },
                    }
                },
                validationPlanModule: "dummy"
            }).buildFull();
        let nestedOptionFound = false;
        for (const option of command.options) {
            if (option.name === "nested") {
                nestedOptionFound = true;
                break;
            }
        }
        expect(nestedOptionFound).toEqual(true);
    });

    it("should expose multiple options for nested properties", () => {
        const command = new ProfilesUpdateCommandBuilder("test",
            logger, {
                type: "test",
                schema: {
                    title: "Type A profile",
                    type: "object",
                    description: "Type A profile for builder tests",
                    properties: {
                        myParent: {
                            type: "object",
                            properties: {
                                middleProperty: {
                                    type: "object",
                                    properties: {
                                        myNestedProperty: {
                                            optionDefinitions: [{
                                                description: "The first nested property",
                                                type: "string",
                                                name: "nested1",
                                                required: true
                                            }, {
                                                description: "The second nested property",
                                                type: "string",
                                                name: "nested2",
                                                required: true
                                            }],
                                            type: "string"
                                        }
                                    }
                                }
                            }
                        },
                    }
                },
                validationPlanModule: "dummy"
            }).buildFull();
        let nestedOption1Found = false;
        let nestedOption2Found = false;
        for (const option of command.options) {
            if (option.name === "nested1") {
                nestedOption1Found = true;
            } else if (option.name === "nested2") {
                nestedOption2Found = true;
            }
        }
        expect(nestedOption1Found).toEqual(true);
        expect(nestedOption2Found).toEqual(true);
    });
});
