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

jest.mock("../../../../../utilities/ImperativeConfig");

import { IConfig } from "../../../../../../src/config";
import { ImperativeConfig } from "../../../../../../src/utilities/ImperativeConfig";
import ProfilesHandler from "../../../../../../src/imperative/config/cmd/profiles/profiles.handler";

let dataObj: any;
let formatObj: any;
let errorText: string;
let logText: string;

// "Mocked" version of the handler parameters for a config list command
const handlerParms: any = {
    response: {
        data: {
            setObj: jest.fn((jsonObj) => {
                dataObj = jsonObj;
            })
        },
        format: {
            output: jest.fn((formatArgs) => {
                formatObj = formatArgs.output;
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
    }
};

const configProps: IConfig = {
    profiles: {
        email: {
            profiles: {
                incoming: {
                    type: "imap",
                    properties: {
                        host: "fakeHost",
                        port: 143
                    },
                    secure: []
                },
                outgoing: {
                    type: "smtp",
                    properties: {
                        host: "fakeHost",
                        port: 25
                    },
                    secure: []
                }
            },
            properties: {}
        }
    },
    defaults: {}
};

describe("Configuration Profiles command handler", () => {
    const configMock = jest.fn();

    beforeAll(() => {
        Object.defineProperty(ImperativeConfig.instance, "config", {
            get: configMock
        });
    });

    beforeEach(() => {
        dataObj = null;
        formatObj = null;
        errorText = null;
        logText = null;
    });

    it("should output list of nested profiles", async () => {
        configMock.mockReturnValueOnce({
            exists: true,
            properties: configProps
        });

        await (new ProfilesHandler()).process(handlerParms);
        expect(errorText).toBeNull();
        expect(dataObj).toEqual(["email", "email.incoming", "email.outgoing"]);
        expect(formatObj).toEqual(dataObj);
    });
});
