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

import { Services } from "../../../src/apiml/Services";
import { ZosmfRestClient } from "../../../src/rest/ZosmfRestClient";
import { ConfigConstants, ImperativeError, RestConstants } from "@zowe/imperative";
import { IApimlProfileInfo } from "../../../src/apiml/doc/IApimlProfileInfo";
import * as JSONC from "comment-json";

describe("APIML Services unit tests", () => {

    describe("Constants", () => {
        it("should be tested", () => {
            expect(true).toBe(false);
        });
    });

    describe("getPluginApimlConfigs", () => {
        it("should be tested", () => {
            expect(true).toBe(false);
        });
    });

    describe("getServicesByConfig", () => {
        it("should be tested", () => {
            expect(true).toBe(false);
        });
    });

    describe("convertApimlProfileInfoToProfileConfig", () => {
        const temp: IApimlProfileInfo[] = [
            {
                profName: "test1",
                profType: "type1",
                basePaths: [
                    "test1/v1",
                    "test1/v2",
                    "test1/v3"
                ]
            },
            {
                profName: "test2",
                profType: "type2",
                basePaths: []
            },
            {
                profName: "test3",
                profType: "type3",
                basePaths: [
                    "test3/v1"
                ]
            },
            {
                profName: "test4",
                profType: "type4",
                basePaths: [
                    "test4/v1",
                    "test4/v1"
                ]
            }
        ];

        it("should produce json object with commented conflicts", () => {
            const expectedJson = `{
    "properties": {},
    "profiles": {
        "test1": {
            "type": "type1",
            "properties": {
                // Multiple base paths were detected for this service.
                // Uncomment one of the lines below to use a different one.
                "basePath": "test1/v1"
                //"basePath": "test1/v2"
                //"basePath": "test1/v3"
            }
        },
        "test2": {
            "type": "type2",
            "properties": {}
        },
        "test3": {
            "type": "type3",
            "properties": {
                "basePath": "test3/v1"
            }
        },
        "test4": {
            "type": "type4",
            "properties": {
                // Multiple base paths were detected for this service.
                // Uncomment one of the lines below to use a different one.
                "basePath": "test4/v1"
                //"basePath": "test4/v1"
            }
        }
    }
}`;
        expect(JSONC.stringify(Services.convertApimlProfileInfoToProfileConfig(temp), null, ConfigConstants.INDENT)).toMatchSnapshot();
        expect(JSONC.stringify(Services.convertApimlProfileInfoToProfileConfig(temp), null, ConfigConstants.INDENT)).toEqual(expectedJson);
        });
    });

});
