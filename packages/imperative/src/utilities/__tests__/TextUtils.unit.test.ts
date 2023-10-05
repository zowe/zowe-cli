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

const beforeForceColor = process.env.FORCE_COLOR;

describe("TextUtils", () => {

    beforeEach(() => {
        TextUtils.chalk.level = 0;
        process.env.FORCE_COLOR = "";
    });

    afterEach(() => {
        process.env.FORCE_COLOR = beforeForceColor;
    });

    it("should be able to color text yellow", () => {
        TextUtils.chalk.level = 1; // set basic color mode for OS independence
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

    it("should set chalk level to 0 if FORCE_COLOR is 0", () => {
        process.env.FORCE_COLOR = "0";
        expect(TextUtils.chalk.level).toEqual(0);
    });

    it("should set chalk level to 1 if FORCE_COLOR is 1", () => {
        process.env.FORCE_COLOR = "1";
        expect(TextUtils.chalk.level).toEqual(1);
    });

    it("should set chalk level to 2 if FORCE_COLOR is 2", () => {
        process.env.FORCE_COLOR = "2";
        expect(TextUtils.chalk.level).toEqual(2);
    });

    it("should set chalk level to 3 if FORCE_COLOR is 3", () => {
        process.env.FORCE_COLOR = "3";
        expect(TextUtils.chalk.level).toEqual(3);
    });

    it("should not set chalk level to 4 if FORCE_COLOR is 4", () => {
        process.env.FORCE_COLOR = "4";
        expect(TextUtils.chalk.level).not.toEqual(4);
    });

    it("should not set chalk level to fake if FORCE_COLOR is fake", () => {
        process.env.FORCE_COLOR = "fake";
        expect(TextUtils.chalk.level).not.toEqual("fake");
    });
});
