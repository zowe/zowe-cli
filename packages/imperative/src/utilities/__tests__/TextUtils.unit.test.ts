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

const tableObjects = [
    { header1: "value1", 2: "value2", header3: "value3" },
    { header1: "value1", 2: "value2", header3: "value3" },
    { header1: "value1", 2: "value2", header3: "value3" },
];

import { TextUtils } from "../src/TextUtils";

describe("TextUtils", () => {

    it("should be able to color text yellow", () => {
        const chalk = TextUtils.chalk;
        chalk.level = 1; // set basic color mode for OS independence
        const text = TextUtils.chalk.yellow("highlighting with chalk") + " hello";
        expect(text).toMatchSnapshot();
    });

    it("should be able to color text red", () => {
        TextUtils.chalk.level = 1; // set basic color mode for OS independence
        const text = TextUtils.chalk.red("highlighting with chalk") + " hello";
        expect(text).toMatchSnapshot();
    });

    it("should grab headers from object properties", () => {
        TextUtils.chalk.level = 0; // turn off color
        const color = "yellow"; // any color
        const table = TextUtils.getTable(tableObjects, color);
        expect(table).toMatchSnapshot();
    });

    it("should accept headers from user", () => {
        TextUtils.chalk.level = 0; // turn off color
        const color = "yellow"; // any color
        const headers = ["header1", "2", "header3"];
        const table = TextUtils.getTable(tableObjects, color, Infinity, true, false, false, headers);
        expect(table).toMatchSnapshot();
    });

    it(".wordWrap should properly wrap any given text", () => {
        TextUtils.chalk.level = 0; // turn off color
        const text = "testing can be interesting";
        const expected = "++testing\n++can be\n++interesting";
        const results = TextUtils.wordWrap(text, 10, "++");
        expect(results).toEqual(expected);
    });

    it(".indentLines should properly indent any given text", () => {
        TextUtils.chalk.level = 0; // turn off color
        const text = "testing\ncan be\ninteresting";
        const expected = "----testing\n----can be\n----interesting";
        const results = TextUtils.indentLines(text, "----");
        expect(results).toEqual(expected);
    });
});
