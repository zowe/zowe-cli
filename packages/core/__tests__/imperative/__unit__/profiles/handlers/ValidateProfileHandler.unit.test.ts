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

jest.mock("../../../../../src/imperative/Imperative");
jest.mock("../../../../../src/utils/ImperativeConfig");

import {
    IProfileLoaded, ProfileValidator, ICommandProfileTypeConfiguration, ImperativeConfig, Imperative
} from "../../../../../src";

const fakeProfileIoError = "Pretend a ProfileIO error occurred";
const noMsgText = "No message text";

let errorText: string = noMsgText;
let logText: string = noMsgText;

// "Mocked" version of the handler parameters for a validate profile command
const validateProfileParms: any = {
    arguments: {
        $0: "zowe",
        _: ["profiles", "validate", "endevor-profile", "endvProfName", "--print-plan-only"],
        "print-plan-only": true
    },
    response: {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                // Nothing
            }),
            setObj: jest.fn((setObjArgs) => {
                // Nothing
            })
        },
        console: {
            log: jest.fn((msgText) => {
                logText = msgText;
            }),
            error: jest.fn((msgText) => {
                errorText = msgText;
            })
        }
    },
    definition: {
        customize: {
            profileTypeIdentifier: "fakeType"
        }
    }
};

// "Mocked" profiles
const FAKE_PROFS: IProfileLoaded[] = [
    {
        message: "loaded",
        type: "fake",
        failNotFound: true,
        name: "fake1",
        profile: {
            name: "fake1",
            type: "fake",
            data: "some data",
            info: "some info",
            nested: {
                data: "nested data"
            }
        }
    },
    {
        message: "loaded",
        type: "fake",
        failNotFound: true,
        name: "fake",
        profile: {
            name: "fake2",
            type: "fake",
            data: "some data",
            info: "some info",
            nested: {
                data: "nested data"
            }
        }
    }
];

const ProfileLoaded = {
    overwritten: true,
    path: "this/is/a/great/path",
    profile: {
        type: "fakeProfileType"
    }
};

// "Mocked" version of a crashing imperative API
const impApiMockedCrash = {
    profileManager: (args: any) => {
        throw new Error(fakeProfileIoError);
    },
};

// "Mocked" version of a successful imperative API - done here rather than a manual mock
const impApiMockedOk = {
    profileManager: (args: any) => {
        return {
            getDefaultProfileName: jest.fn(() => {
                return "fake1";
            }),
            loadAll: jest.fn((loadArgs) => {
                return JSON.parse(JSON.stringify(FAKE_PROFS));
            }),
            load: jest.fn(() => {
                return ProfileLoaded;
            }),
        };
    },
};


describe("validate endevor profile handler", () => {

    // Reset mocks for counters, etc.
    beforeEach(() => {
        errorText = noMsgText;
        logText = noMsgText;
    });

    describe("successful operation", () => {
        it("should validate a profile", async () => {
            /* Pretend that we have **no** team config.
             * config is a getter of a property, so mock we the property.
             */
            Object.defineProperty(ImperativeConfig.instance, "config", {
                configurable: true,
                get: jest.fn(() => {
                    return {
                        exists: false
                    };
                })
            });

            const profConfig: ICommandProfileTypeConfiguration = {
                type: "endevor",
                schema: {
                    type: "endevor",
                    title: "some title",
                    description: "some description",
                    properties: {
                        type: {
                            type: "boolean"
                        },
                    }
                },
                validationPlanModule: "../../../../../__tests__/src/packages/imperative/plugins/test_cli/TestProfileValidationPlan1"
            };
            Imperative.getProfileConfiguration = jest.fn(() => profConfig);

            // print-plan-only forced printing the plan, not validating
            const printedPlanText = "Printed plan for profile validation";
            ProfileValidator.getTextDisplayForPlan = jest.fn(() => {
                return printedPlanText;
            });

            Object.defineProperty(Imperative, "api", { value: impApiMockedOk, configurable: true });
            const parms = Object.assign({}, ...[validateProfileParms]);
            const handlerReq = require("../../../../../src/imperative/profiles/handlers/ValidateProfileHandler");
            const handler = new handlerReq.default();

            await handler.process(validateProfileParms);
            expect(errorText).toBe(noMsgText);
            expect(logText.toString()).toContain(printedPlanText);
        });
    });

    describe("error handling", () => {
        it("should catch profileIO errors", async () => {
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

            Object.defineProperty(Imperative, "api", { value: impApiMockedCrash, configurable: true });
            const handlerReq = require("../../../../../src/imperative/profiles/handlers/ValidateProfileHandler");
            const handler = new handlerReq.default();
            await handler.process(validateProfileParms);
            expect(errorText).toContain("An error occurred trying to validate a profile");
            expect(errorText).toContain(fakeProfileIoError);
        });
    });
});
