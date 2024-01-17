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
jest.mock("../../../../utilities/ImperativeConfig");

import { IProfileLoaded } from "../../../../profiles";
import { Imperative } from "../../../src/Imperative";
import { ImperativeConfig } from "../../../../utilities";

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

// "Mocked" version of the imperative API - done here rather than a manual mock
const MockedImperativeAPI = {
    profileManager: (args: any) => {
        return {
            getDefaultProfileName: jest.fn(() => {
                return "fake1";
            }),
            loadAll: jest.fn((loadArgs) => {
                return JSON.parse(JSON.stringify(FAKE_PROFS));
            })
        };
    },
};

// "Mocked" version to thrown an error
const MockedImperativeAPIError = {
    profileManager: (args: any) => {
        return {
            getDefaultProfileName: jest.fn(() => {
                return "fake1";
            }),
            loadAll: jest.fn((loadArgs) => {
                throw new Error("ERROR!");
            })
        };
    },
};

// "Mocked" version of the handler parameters
const HANDLER_PARAMETERS: any = {
    arguments: {
        $0: "zowe",
        _: ["zos-jobs", "submit", "data-set"],
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
            log: jest.fn((logs) => {
                // Nothing
            }),
            error: jest.fn((errors) => {
                // Nothing
            }),
            errorHeader: jest.fn(() => undefined)
        },
        progress: {
            startBar: jest.fn((parms) => undefined),
            endBar: jest.fn(() => undefined)
        },
        format: {
            output: jest.fn((parms) => {
                // Nothing
            })
        }
    },
    definition: {
        customize: {
            profileTypeIdentifier: "fake"
        }
    },
    fullDefinition: undefined,
    profiles: undefined
};

describe("list profiles handler", () => {

    // Reset mocks for counters, etc.
    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("error handling", () => {
        it("should not transform errors from the profile manager", async () => {
            // "Mock" with the object here
            Object.defineProperty(Imperative, "api", { value: MockedImperativeAPIError, configurable: true });
            const handlerReq = require("../../../src/profiles/handlers/ListProfilesHandler");
            const handler = new handlerReq.default();
            const parms = Object.assign({}, ...[HANDLER_PARAMETERS]);
            let error;
            try {
                await handler.process(parms);
            } catch (err) {
                error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toMatchSnapshot();
        });
        it("should catch profileIO errors", async () => {
            let errorText: string = "not_yet_set";

            // "Mocked" version of the handler parameters for a list profile command
            const listProfileParms: any = {
                arguments: {
                    $0: "zowe",
                    _: ["profiles", "list", "zosmf-profiles"],
                },
                response: {
                    console: {
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

            // pretend to crash when profileManager is created
            const fakeProfileIoError = "Pretend a ProfileIO error occurred";
            Object.defineProperty(Imperative, "api", {
                configurable: true,
                value: {
                    profileManager: (args: any) => {
                        throw new Error(fakeProfileIoError);
                    }
                }
            });

            const handlerReq = require("../../../src/profiles/handlers/ListProfilesHandler");
            const handler = new handlerReq.default();
            await handler.process(listProfileParms);
            expect(errorText).toContain("An error occurred trying to list profiles");
            expect(errorText).toContain(fakeProfileIoError);
        });
    });

    describe("response", () => {
        it("should load all profiles and display just the names", async () => {
            // "Mock" with the object here
            Object.defineProperty(Imperative, "api", { value: MockedImperativeAPI, configurable: true });
            const handlerReq = require("../../../src/profiles/handlers/ListProfilesHandler");
            const handler = new handlerReq.default();
            const parms = Object.assign({}, ...[HANDLER_PARAMETERS]);
            parms.response.format.output = jest.fn((args) => {
                expect(args).toMatchSnapshot();
            });
            parms.response.data.setObj = jest.fn((args) => {
                expect(args).toMatchSnapshot();
            });
            parms.response.data.setMessage = jest.fn((args) => {
                expect(args).toMatchSnapshot();
            });
            await handler.process(parms);
            expect(parms.response.data.setMessage).toHaveBeenCalledTimes(1);
            expect(parms.response.data.setObj).toHaveBeenCalledTimes(1);
        });

        it("should load all profiles and display all contents", async () => {
            // "Mock" with the object here
            Object.defineProperty(Imperative, "api", { value: MockedImperativeAPI, configurable: true });
            const handlerReq = require("../../../src/profiles/handlers/ListProfilesHandler");
            const handler = new handlerReq.default();
            const parms = Object.assign({}, ...[HANDLER_PARAMETERS]);
            parms.arguments.showContents = true;
            parms.response.format.output = jest.fn((args) => {
                expect(args).toMatchSnapshot();
            });
            parms.response.data.setObj = jest.fn((args) => {
                expect(args).toMatchSnapshot();
            });
            parms.response.data.setMessage = jest.fn((args) => {
                expect(args).toMatchSnapshot();
            });
            await handler.process(parms);
            expect(parms.response.data.setMessage).toHaveBeenCalledTimes(1);
            expect(parms.response.data.setObj).toHaveBeenCalledTimes(1);
        });
    });
});
