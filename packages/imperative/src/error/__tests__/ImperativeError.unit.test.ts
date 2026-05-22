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

import { ImperativeError } from "../src/ImperativeError";

describe("ImperativeError", () => {
    it("should not throw any deprecation warnings", () => {
        jest.spyOn(console, "warn").mockImplementation(() => { return; });

        /* eslint-disable no-console */
        new ImperativeError({msg: "test"});

        new ImperativeError({msg: "test"}, {
            tag: "test"
        });

        expect(console.warn).not.toHaveBeenCalled();

        (console.warn as any).mockRestore();
        /* eslint-enable no-console */
    });

    describe("newImpErrorFromExistingError", () => {
        it("should reject a null existing error", () => {
            const newImpErr: ImperativeError = ImperativeError.newImpErrorFromExistingError(
                null, "first parm cannot be null"
            );
            expect(newImpErr.message).toBe(
                "The supplied parameter 'existingErr' was incorrectly null or undefined"
            );
        });

        it("should tolerate a missing mainMsg", () => {
            const existingErr = {
                causeErrors: "Fake cause error",
                additionalDetails: "Fake additional details"
            };
            const newImpErr: ImperativeError = ImperativeError.newImpErrorFromExistingError(existingErr);
            expect(newImpErr.message).toBe(
                "No problem text was supplied."
            );
        });

        it("should resort to existingErr's causeErrors.mMessage as the new causeError", () => {
            const mMessageInCause = "With no existingErr.mMessage or existingErr.message, " +
                "use existingErr.causeErrors.mMessage";
            const existingErr = {
                causeErrors: {
                    mMessage: mMessageInCause
                },
                additionalDetails: "Fake additional details"
            };
            const newImpErr: ImperativeError = ImperativeError.newImpErrorFromExistingError(
                existingErr, "Fake main message"
            );
            expect(newImpErr.causeErrors).toBe(mMessageInCause);
        });

        it("should resort to existingErr's causeErrors.message as the new causeError", () => {
            const messageInCause = "With no existingErr.mMessage or existingErr.message or " +
                "existingErr.causeErrors.mMessage, use existingErr.cause.message";
            const existingErr = {
                cause: {
                    message: messageInCause
                },
                additionalDetails: "Fake additional details"
            };
            const newImpErr: ImperativeError = ImperativeError.newImpErrorFromExistingError(
                existingErr, "Fake main message"
            );
            expect(newImpErr.causeErrors).toBe(messageInCause);
        });
    });

    describe("recordPropForOutput", () => {
        it("should return false when a string propertyVal contains stringified raw data", () => {
            const RAW_ERR_MSG = "Raw error data from operation:\n";
            const errOutputData = {
                stringVal: "",
                rawVal: {}
            };
            const result = ImperativeError["recordPropForOutput"](
                RAW_ERR_MSG + "Already stringified property", errOutputData
            );
            expect(result).toBe(false);
        });

        it("should append a string propertyVal to existing errOutputData.stringVal", () => {
            const errOutputData = {
                stringVal: "Some existing text",
                rawVal: {}
            };
            const result = ImperativeError["recordPropForOutput"](
                "Some new text", errOutputData
            );
            expect(result).toBe(true);

            const os = require("os");
            expect(errOutputData.stringVal).toBe("Some existing text" + os.EOL + "Some new text");
        });

        it("should return false when propertyVal is an object and errOutputData.rawValue already contains an object", () => {
            const errOutputData = {
                stringVal: "",
                rawVal: {
                    objProp: "rawVal already contains an object"
                }
            };
            const result = ImperativeError["recordPropForOutput"](
                {newVal: "some new object"}, errOutputData
            );
            expect(result).toBe(false);
        });
    });
});
