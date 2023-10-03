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

jest.mock("../../../src/Imperative");
jest.mock("../../../../utilities/src/ImperativeConfig");

import { IProfileLoaded } from "../../../../profiles";
import { Imperative } from "../../../src/Imperative";
import { ImperativeConfig } from "../../../../utilities";

const fakeProfileIoError = "Pretend a ProfileIO error occurred";
const noMsgText = "No message text";

let errorText: string = noMsgText;
let logText: string = noMsgText;

// "Mocked" version of the handler parameters for a create profile command
const createProfileParms: any = {
    arguments: {
        $0: "zowe",
        _: ["profiles", "create", "zosmf-profiles", "newProfName"],
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

const ProfileSaved = {
    overwritten: true,
    path: "this/is/a/great/path",
    profile: {
        type: "fakeProfileType"
    }
};

// "Mocked" version of a crashings imperative API
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
            save: jest.fn(() => {
                return ProfileSaved;
            }),
        };
    },
};


describe("create profile handler", () => {

    // Reset mocks for counters, etc.
    beforeEach(() => {
        errorText = noMsgText;
        logText = noMsgText;
    });

    describe("successful operation", () => {
        it("should create a profile", async () => {
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

            Object.defineProperty(Imperative, "api", { value: impApiMockedOk, configurable: true });
            const parms = Object.assign({}, ...[createProfileParms]);
            const handlerReq = require("../../../src/profiles/handlers/CreateProfilesHandler");
            const handler = new handlerReq.default();

            await handler.process(createProfileParms);
            expect(errorText).toBe(noMsgText);
            expect(logText).toContain("Review the created profile");
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
            const handlerReq = require("../../../src/profiles/handlers/CreateProfilesHandler");
            const handler = new handlerReq.default();
            await handler.process(createProfileParms);
            expect(errorText).toContain("An error occurred trying to create a profile");
            expect(errorText).toContain(fakeProfileIoError);
        });
    });
});
