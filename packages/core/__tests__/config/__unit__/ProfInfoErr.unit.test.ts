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

import { ProfInfoErr } from "../../../src";

describe("ProfInfoErr tests", () => {
    it("should throw error with only impErrDetails", async () => {
        const myMessage = "Only impErrDetails";
        try {
            throw new ProfInfoErr({
                errorCode: ProfInfoErr.CANT_GET_SCHEMA_URL,
                msg: myMessage
            });
        } catch (error) {
            expect(error instanceof ProfInfoErr).toEqual(true);
            expect(error.name).toEqual("ProfInfoErr");
            expect(error.errorCode).toEqual(ProfInfoErr.CANT_GET_SCHEMA_URL);
            expect(error.message).toContain(myMessage);
        }
    });

    it("should throw error with impErrDetails and profErrParms", async () => {
        const myMessage = "impErrDetails and profErrParms";
        const badStuff = ["bad item 1", "bad item 2", "bad item 3"];
        try {
            throw new ProfInfoErr(
                {
                    errorCode: ProfInfoErr.INVALID_PROF_LOC_TYPE,
                    msg: myMessage
                },
                {
                    itemsInError: badStuff
                }
            );
        } catch (error) {
            expect(error instanceof ProfInfoErr).toEqual(true);
            expect(error.name).toEqual("ProfInfoErr");
            expect(error.errorCode).toEqual(ProfInfoErr.INVALID_PROF_LOC_TYPE);
            expect(error.message).toContain(myMessage);
            expect(error.itemsInError.length).toEqual(badStuff.length);
            for (let index = 0;  index < error.itemsInError.length; index++) {
                expect(error.itemsInError[index]).toEqual(badStuff[index]);
            }
        }
    });

    it("should throw error with impErrDetails, profErrParms, and impErrParms", async () => {
        const myMessage = "impErrDetails, profErrParms, and impErrParms";
        const prependErrText = "Stuff before error message";
        const badStuff = ["bad item 1", "bad item 2", "bad item 3"];
        try {
            throw new ProfInfoErr(
                {
                    errorCode: ProfInfoErr.INVALID_PROF_LOC_TYPE,
                    msg: myMessage
                },
                {
                    itemsInError: badStuff,
                    tag:prependErrText
                }
            );
        } catch (error) {
            expect(error instanceof ProfInfoErr).toEqual(true);
            expect(error.name).toEqual("ProfInfoErr");
            expect(error.errorCode).toEqual(ProfInfoErr.INVALID_PROF_LOC_TYPE);
            expect(error.message).toContain(myMessage);
            expect(error.itemsInError.length).toEqual(badStuff.length);
            for (let index = 0;  index < error.itemsInError.length; index++) {
                expect(error.itemsInError[index]).toEqual(badStuff[index]);
            }
            expect(error.message).toEqual(prependErrText + ": " + myMessage);
        }
    });
});
