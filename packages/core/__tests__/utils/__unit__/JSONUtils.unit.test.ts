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

import { JSONUtils } from "../../utilities";

interface ITestObj {
    name: string;
    val: number;
}

describe("JSONUtils tests", () => {

    it("should parse a JSON object", () => {
        const stringTestObj = "{\"name\": \"user\", \"val\": 80}";
        expect(JSONUtils.parse<ITestObj>(stringTestObj)).toMatchSnapshot();
    });

    it("should return null for input that has no content", () => {
        expect(JSONUtils.parse<any>("")).toBeNull();
        expect(JSONUtils.parse<any>("          ")).toBeNull();
    });

    it("should give a message for a failed JSON object", () => {
        const stringTestObj = "{ fail }";
        let error;
        try {
            JSONUtils.parse<ITestObj>(stringTestObj);
        } catch (thrownError) {
            error = thrownError;
        }
        const regex = /(Unexpected token f in JSON at position 2)|(Expected property name or '}' in JSON at position 2)/;
        expect(error.message).toMatch(regex);
    });

    it("should give a message for a failed JSON object with custom fail message", () => {
        const stringTestObj = "{ fail }";
        let error;
        try {
            JSONUtils.parse<ITestObj>(stringTestObj, "test message");
        } catch (thrownError) {
            error = thrownError;
        }
        const regex = /(Unexpected token f in JSON at position 2)|(Expected property name or '}' in JSON at position 2)/;
        expect(error.message).toMatch(regex);
    });

    it("should give an error message for an undefined input", () => {
        let error;
        try {
            JSONUtils.parse<ITestObj>(undefined);
        } catch (thrownError) {
            error = thrownError;
        }
        const regex = /(Unexpected token u in JSON at position 0)|("undefined" is not valid JSON)/;
        expect(error.message).toMatch(regex);
    });
});
