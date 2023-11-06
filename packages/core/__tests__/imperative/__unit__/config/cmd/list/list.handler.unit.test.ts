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

jest.mock("../../../../../utilities/src/ImperativeConfig");

import { Config, ConfigConstants, IConfig, IConfigLayer } from "../../../../../config";
import { ImperativeConfig } from "../../../../../utilities";
import { cloneDeep } from "lodash";
import ListHandler from "../../../../src/config/cmd/list/list.handler";

let dataObj: any;
let formatObj: any;
let errorText: string;
let logText: string;

// "Mocked" version of the handler parameters for a config list command
const handlerParms: any = {
    response: {
        data: {
            setObj: jest.fn((jsonObj) => {
                dataObj = JSON.parse(JSON.stringify(jsonObj));
            })
        },
        format: {
            output: jest.fn((formatArgs) => {
                formatObj = JSON.parse(JSON.stringify(formatArgs.output));
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

const configLayers: IConfigLayer[] = [
    {
        exists: true,
        path: "fakePath",
        user: false,
        global: false,
        properties: {
            profiles: {
                email: {
                    properties: {
                        host: "fakeHost",
                        port: 25,
                        user: "admin"
                    },
                    secure: [
                        "user",
                        "password"
                    ]
                }
            },
            defaults: {},
            plugins: [
                "fakePlugin"
            ]
        }
    },
    { exists: false, properties: Config.empty() } as any,
    { exists: false, properties: Config.empty() } as any,
    { exists: false, properties: Config.empty() } as any
];

const configMaskedProps: IConfig = cloneDeep(configLayers[0].properties); // Because otherwise it is modifying the original
configMaskedProps.profiles.email.properties.user = ConfigConstants.SECURE_VALUE;

describe("Configuration List command handler", () => {
    const fakeConfig: Config = new (Config as any)();

    beforeAll(() => {
        (fakeConfig as any).mActive = { user: false, global: false };
        Object.defineProperty(ImperativeConfig.instance, "config", {
            get: jest.fn(() => fakeConfig)
        });
    });

    beforeEach(() => {
        dataObj = null;
        formatObj = null;
        errorText = null;
        logText = null;
    });

    it("should output empty object when there is no config", async () => {
        jest.spyOn(fakeConfig, "exists", "get").mockReturnValueOnce(false);
        handlerParms.arguments = {};

        await (new ListHandler()).process(handlerParms);
        expect(errorText).toBeNull();
        expect(dataObj).toEqual({});
        expect(formatObj).toEqual(dataObj);
    });

    it("should output entire config", async () => {
        (fakeConfig as any).mLayers = configLayers;
        handlerParms.arguments = {};

        await (new ListHandler()).process(handlerParms);
        expect(errorText).toBeNull();
        expect(dataObj).toEqual(configMaskedProps);
        expect(dataObj.profiles.email.properties.user).toBe(ConfigConstants.SECURE_VALUE);
        expect(dataObj.profiles.email.properties.password).toBeUndefined();
        expect(formatObj).toEqual(dataObj);
    });

    it("should output config property", async () => {
        (fakeConfig as any).mLayers = configLayers;
        handlerParms.arguments = { property: "plugins" };

        await (new ListHandler()).process(handlerParms);
        expect(errorText).toBeNull();
        expect(dataObj).toEqual(["fakePlugin"]);
        expect(formatObj).toEqual(dataObj);
    });

    it("should output entire config listed by location", async () => {
        (fakeConfig as any).mLayers = configLayers;
        handlerParms.arguments = { locations: true };

        await (new ListHandler()).process(handlerParms);
        expect(errorText).toBeNull();
        expect(dataObj.fakePath).toEqual(configMaskedProps);
        expect(dataObj.fakePath.profiles.email.properties.user).toBe(ConfigConstants.SECURE_VALUE);
        expect(dataObj.fakePath.profiles.email.properties.password).toBeUndefined();
        expect(formatObj).toEqual(dataObj);
    });

    it("should output config property listed by location 1", async () => {
        (fakeConfig as any).mLayers = configLayers;
        handlerParms.arguments = { locations: true, property: "plugins" };

        await (new ListHandler()).process(handlerParms);
        expect(errorText).toBeNull();
        expect(dataObj.fakePath).toEqual(["fakePlugin"]);
        expect(formatObj).toEqual(dataObj);
    });

    it("should output config property listed by location 2", async () => {
        (fakeConfig as any).mLayers = configLayers;
        handlerParms.arguments = { locations: true, property: "profiles" };

        await (new ListHandler()).process(handlerParms);
        expect(errorText).toBeNull();
        expect(dataObj.fakePath).toEqual(configMaskedProps.profiles);
        expect(dataObj.fakePath.email.properties.user).toBe(ConfigConstants.SECURE_VALUE);
        expect(dataObj.fakePath.email.properties.password).toBeUndefined();
        expect(formatObj).toEqual(dataObj);
    });

    it("should output entire config at root level", async () => {
        (fakeConfig as any).mLayers = configLayers;
        handlerParms.arguments = { root: true };

        await (new ListHandler()).process(handlerParms);
        expect(errorText).toBeNull();
        expect(dataObj).toEqual(Object.keys(configLayers[0].properties));
        expect(formatObj).toEqual(dataObj);
    });
});
