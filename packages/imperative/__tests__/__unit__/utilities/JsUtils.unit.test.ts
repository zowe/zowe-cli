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

import { JsUtils } from "../../../src/utilities/JsUtils";

describe("JsUtils", () => {

    describe("isObjEmpty", () => {
        it("should return true when given null", () => {
            expect(JsUtils.isObjEmpty(null)).toBe(true);
        });

        it("should return true when given an empty object", () => {
            expect(JsUtils.isObjEmpty({})).toBe(true);
        });

        it("should return false when given an object with a property", () => {
            expect(JsUtils.isObjEmpty({ anyProperty: "value" })).toBe(false);
        });
    });

    describe("isUrl", () => {
        it("should return false when given null", () => {
            expect(JsUtils.isUrl(null)).toBe(false);
        });

        it("should return false when given an empty string", () => {
            expect(JsUtils.isUrl("")).toBe(false);
        });

        it("should return false when given a path", () => {
            expect(JsUtils.isUrl(__dirname)).toBe(false);
        });

        it("should return false when given a Windows-style path", () => {
            expect(JsUtils.isUrl("C:\\fake")).toBe(false);
        });

        it("should return true when given a URL", () => {
            expect(JsUtils.isUrl("http://localhost/")).toBe(true);
        });

        it("should return false when given an incomplete URL", () => {
            expect(JsUtils.isUrl("example.com")).toBe(false);
        });
    });
});
