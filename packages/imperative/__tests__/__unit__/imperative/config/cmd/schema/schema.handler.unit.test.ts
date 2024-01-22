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
import SchemaHandler from "../../../../../../src/imperative/config/cmd/schema/schema.handler";

let dataObj: any;
let errorText: string;
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
            }),
            error: jest.fn((msgText) => {
                errorText = msgText;
            })
        }
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

const expectedSchemaObj: any = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$version": "1.0",
    "type": "object",
    "description": "Zowe configuration",
    "properties": {
        "profiles": {},
        "defaults": {},
        "autoStore": {}
    }
};

describe("Configuration Schema command handler", () => {
    const loadedConfigMock = jest.fn();

    beforeAll(() => {
        Object.defineProperty(ImperativeConfig.instance, "loadedConfig", {
            get: loadedConfigMock
        });
    });

    beforeEach(() => {
        dataObj = null;
        errorText = null;
        logText = null;
    });

    it("should print schema JSON", async () => {
        loadedConfigMock.mockReturnValueOnce({
            profiles: testProfileConfiguration
        });

        await (new SchemaHandler()).process(handlerParms);
        expect(errorText).toBeNull();
        expect(dataObj).toMatchObject(expectedSchemaObj);
        expect(JSON.parse(logText)).toMatchObject(dataObj);
    });

    it("should fail when Imperative config not loaded", async () => {
        loadedConfigMock.mockReturnValueOnce(undefined);

        await (new SchemaHandler()).process(handlerParms);
        expect(errorText).toBe("Failed to load profile schemas");
        expect(logText).toBeNull();
    });
});
