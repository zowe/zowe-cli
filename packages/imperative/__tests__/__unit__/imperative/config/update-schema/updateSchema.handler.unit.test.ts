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

import { ImperativeConfig } from "../../../../../../src/utilities/ImperativeConfig";
import { IProfileTypeConfiguration } from "../../../../../../src/profiles";
import UpdateSchemasHandler from "../../../../../../src/imperative/config/cmd/update-schemas/update-schemas.handler";
import { ConfigSchema } from "../../../../../../";

let dataObj: any;
let formatObj: any;
let logText: string;

// "Mocked" version of the handler parameters for a config schema command
const handlerParms: any = {
    response: {
        data: {
            setObj: jest.fn((jsonObj) => {
                dataObj = jsonObj;
            })
        },
        console: {
            log: jest.fn((msgText) => {
                logText = msgText;
            })
        },
        format: {
            output: jest.fn((jsonObj) => {
                formatObj = jsonObj;
            })
        }
    },
    arguments: {
        depth: 0
    }
};

const testProfileConfiguration: IProfileTypeConfiguration[] = [
    {
        type: "zosmf",
        schema: {
            title: "zosmf",
            description: "A fake zosmf profile",
            type: "zosmf",
            required: [],
            properties: {
                host: {
                    type: "string",
                    secure: true
                }
            }
        }
    },
    {
        type: "base",
        schema: {
            title: "base",
            description: "A fake base profile",
            type: "base",
            required: [],
            properties: {
                port: {
                    type: "number",
                    secure: false
                }
            }
        }
    }
];

const expectedDataObj: any = {
    "-----test-path-01-----": {
        "schema": "./test-01.schema.json",
        "updated": false
    },
    "-----test-path-02-----": {
        "schema": "./test-02.schema.json",
        "updated": true
    },
};
const expectedFormatObj: any = {
    "-----test-path-01-----": {
        "skipped": "./test-01.schema.json"
    },
    "-----test-path-02-----": {
        "updated": "./test-02.schema.json"
    },
};

const oldForceColorOption = process.env.FORCE_COLOR;

describe("Configuration Update-Schema command handler", () => {
    const loadedConfigMock = jest.fn();

    beforeAll(() => {
        process.env.FORCE_COLOR = "0";
        Object.defineProperty(ImperativeConfig.instance, "loadedConfig", {
            get: loadedConfigMock.mockReturnValue({ profiles: testProfileConfiguration })
        });
        jest.spyOn(ConfigSchema, "updateSchema").mockReturnValue(expectedDataObj);
    });

    beforeEach(() => {
        dataObj = null;
        formatObj = null;
        logText = null;
    });

    afterAll(() => {
        process.env.FORCE_COLOR = oldForceColorOption;
    });

    it("should fail when Imperative config not loaded", async () => {
        loadedConfigMock.mockReturnValueOnce(undefined);
        let caughtError = null;
        try {
            await (new UpdateSchemasHandler()).process(handlerParms);
        } catch (err) {
            caughtError = err.message;
        }
        expect(caughtError).toContain("Failed to load profile schemas");
        expect(dataObj).toBeNull();
        expect(formatObj).toBeNull();
        expect(logText).toBeNull();
    });

    it("should print schema JSON", async () => {
        await (new UpdateSchemasHandler()).process(handlerParms);
        expect(dataObj).toMatchObject(expectedDataObj);
        expect(logText).toEqual(`Configuration files found: ${Object.keys(expectedDataObj).length}`);
        expect(formatObj).toMatchObject({
            format: "object",
            output: expectedFormatObj
        });
    });
});
