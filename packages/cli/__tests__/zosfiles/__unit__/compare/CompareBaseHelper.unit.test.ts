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

import { CompareBaseHelper } from "../../../../src/zosfiles/compare/CompareBaseHelper";
import {DiffUtils} from "@zowe/imperative";

describe("Comapare Base Helper", () => {

    const fakeCommandParam = {
        arguments: {
            $0: "fake",
            _: ["fake"],
            browserView: false,
        },
    };

    const helper = new CompareBaseHelper(fakeCommandParam as any);
    const string1: string = "test string 1";
    const string2: string = "test string 2";

    helper.prepareContent = jest.fn((string: string | Buffer)=> {
        return "prepared string 1";
    });
    describe("it should prepare the comtent strings for comparison", () => {
        it("should return the prepared strings", async ()=>{
            const returnedStrings = await helper.prepareContent(string1);
            expect(returnedStrings).toContain("prepared");
        });

    });

    describe("it should return the response as per the options passed either in termianl or in browser", () => {
        it("should give response in terminal", ()=>{
            DiffUtils.getDiffString = jest.fn( async () => {
                return "compared string";
            });
            helper.getResponse(string1, string2);
            expect(DiffUtils.getDiffString).toBeCalled();
        });


        it("should initiate the diff opening in browser", ()=>{
            helper.browserView = true;
            jest.spyOn(DiffUtils, "openDiffInbrowser").mockImplementation(jest.fn());
            helper.getResponse(string1, string2);
            expect(DiffUtils.openDiffInbrowser).toBeCalled();
            expect(DiffUtils.openDiffInbrowser).toBeCalledWith(string1, string2);

        });
    });
});
