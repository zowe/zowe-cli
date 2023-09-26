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

import * as diff from "diff";
import { DiffUtils } from "../../src/diff/DiffUtils";
import { IDiffOptions } from "../../src/diff/doc/IDiffOptions";
import { WebDiffManager } from "../../src/diff/WebDiffManager";
import * as jestDiff from "jest-diff";
import * as diff2html from "diff2html";
jest.mock("diff");

describe("DiffUtils", () => {

    describe("getDiffString", () => {
        const string1: string = "random string one";
        const string2: string = "random string two";
        const diffOptions: IDiffOptions = {
            outputFormat: 'unifiedstring'
        };

        it("should return a diff string in unified string format", async () => {
            jest.spyOn(jestDiff, "diff").mockImplementation(jest.fn());
            expect(await DiffUtils.getDiffString(string1, string2, diffOptions)).toMatchSnapshot();
        });
        it("should return a diff string in format for terminal i.e, json diff", async () => {
            diffOptions.outputFormat = "terminal";
            const response = await DiffUtils.getDiffString(string1, string2, diffOptions);
            expect(response).toMatchSnapshot();
            expect(jestDiff.diff).toHaveBeenCalledTimes(1);
        });
        it("should return a diff string in html format", async () => {
            diffOptions.outputFormat = "html";
            jest.spyOn(diff2html, "html").mockImplementation(jest.fn());
            const response = await DiffUtils.getDiffString(string1, string2, diffOptions);
            expect(response).toMatchSnapshot();
            expect(diff2html.html).toHaveBeenCalledTimes(1);
        });
    });

    describe("openDiffInbrowser", () => {

        it("should open the diffs in browser", async () => {
            jest.spyOn(diff, "createTwoFilesPatch").mockReturnValue("test");

            const string1 = "test string one";
            const string2 = "test string two";

            const openDiffSpy = jest.spyOn(WebDiffManager.instance, "openDiffs").mockImplementation(jest.fn());
            await DiffUtils.openDiffInbrowser(string1, string2);
            expect(diff.createTwoFilesPatch).toHaveBeenCalledWith('file-a', 'file-b', string1, string2);
            expect(openDiffSpy).toHaveBeenCalledWith("test");
        });
        it("should open the diffs in browser with optionally supplied file names", async () => {
            jest.spyOn(diff, "createTwoFilesPatch").mockReturnValue("test");
            const options: IDiffOptions = {
                name1: "file-a",
                name2: "file-b"
            };
            const string1 = "test string one";
            const string2 = "test string two";

            const openDiffSpy = jest.spyOn(WebDiffManager.instance, "openDiffs").mockImplementation(jest.fn());
            await DiffUtils.openDiffInbrowser(string1, string2, options);
            expect(diff.createTwoFilesPatch).toHaveBeenCalledWith(options.name1, options.name2, string1, string2);
            expect(openDiffSpy).toHaveBeenCalledWith("test");
        });
    });

});
