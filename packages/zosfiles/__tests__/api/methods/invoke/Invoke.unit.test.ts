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

jest.mock("fs");
jest.mock("../../../../../utils");

import { Headers, Session } from "@zowe/imperative";
import { posix } from "path";
import { IZosFilesResponse, ZosFilesConstants, ZosFilesMessages } from "../../../../";
import { stripNewLines } from "../../../../../../__tests__/__src__/TestUtils";
import { ZosmfRestClient } from "../../../../../rest";
import { getErrorContext } from "../../../../../utils";
import { Invoke } from "../../../../src/api";

const fs = require("fs");

describe("Invoke", () => {
    const invokeExpectJsonSpy = jest.spyOn(ZosmfRestClient, "putExpectJSON");
    const dummyFileName = "./path/to/dummyFile";
    const statements = "test statement\nwith multiple lines\r\nand a special line break too";
    const MOCK_FILE_INFO = {
        [dummyFileName]: statements
    };
    const invokeAPIRespose = {
        rc         : 0,
        output     : [] as any,
        JSONversion: 1
    };

    beforeEach(() => {
        fs.__setMockFiles(MOCK_FILE_INFO);

        invokeExpectJsonSpy.mockClear();
        invokeExpectJsonSpy.mockImplementation(async () => {
            return invokeAPIRespose;
        });
    });

    const dummySession = new Session({
        user    : "dummy",
        password: "dummy",
        hostname: "machine",
        port    : 443,
        protocol: "https",
        type    : "basic"
    });
    const reqPayload = {input: statements.split(/\r?\n/).map((x) => x.toUpperCase())};
    const reqHeaders = [
        Headers.APPLICATION_JSON,
        {
            [Headers.CONTENT_LENGTH]: JSON.stringify(reqPayload).length.toString()
        }
    ];

    describe("ams", () => {
        const dummyReturnObject: IZosFilesResponse = {
            success        : true,
            commandResponse: "GOOD",
            apiResponse    : {}
        };

        it("should throw an error when options/keys are null, undefined or empty string/array", async () => {
            let caughtError;

            try {
                await Invoke.ams(dummySession, null);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(invokeExpectJsonSpy).not.toHaveBeenCalled();
            expect(caughtError.message).toContain(ZosFilesMessages.missingStatements.message);

            caughtError = undefined;

            try {
                await Invoke.ams(dummySession, undefined);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(invokeExpectJsonSpy).not.toHaveBeenCalled();
            expect(caughtError.message).toContain(ZosFilesMessages.missingStatements.message);

            caughtError = undefined;

            try {
                await Invoke.ams(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(invokeExpectJsonSpy).not.toHaveBeenCalled();
            expect(caughtError.message).toContain(ZosFilesMessages.missingStatements.message);

            caughtError = undefined;

            try {
                await Invoke.ams(dummySession, []);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeDefined();
            expect(invokeExpectJsonSpy).not.toHaveBeenCalled();
            expect(caughtError.message).toContain(ZosFilesMessages.missingStatements.message);
        });

        it("should throw and error if we cannot find the file", async () => {
            let response;
            let caughtError;

            try {
                response = await Invoke.ams(dummySession, dummyFileName + "WRONG");
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(invokeExpectJsonSpy).not.toHaveBeenCalled();
            expect(caughtError).toBeDefined();
        });

        it("should throw and error if there is a statement longer than the maximum allowed length", async () => {
            const errorContextMock = getErrorContext as jest.Mock<typeof getErrorContext>;

            // Formulate the long string
            let longStatement = "";

            while (longStatement.length <= ZosFilesConstants.MAX_AMS_LINE) {
                longStatement += "A";
            }

            longStatement += "\n" + statements;

            // Mock the return value expected
            const returnString = "This should be returned";
            errorContextMock.mockReturnValue(returnString);

            // Run the command and see if the correct line is reported
            let response;
            let caughtError;

            try {
                response = await Invoke.ams(dummySession, longStatement.split(/\r?\n/));
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(invokeExpectJsonSpy).not.toHaveBeenCalled();
            expect(caughtError).toBeDefined();

            let errorMessage = stripNewLines(caughtError.message);
            expect(errorMessage).toContain(`is longer than ${ZosFilesConstants.MAX_AMS_LINE} characters`);
            expect(errorMessage).toContain(returnString);

            expect(errorContextMock).toHaveBeenCalledTimes(1);
            expect(errorContextMock).toHaveBeenLastCalledWith(longStatement.toUpperCase().split(/\r?\n/), 0);

            // We should do everything again to ensure that it isn't a fluke
            // that the long line happened to be first.
            response = undefined;
            caughtError = undefined;

            // Formulate a new long line
            longStatement = `Insert\r\nstuff\r\nbefore\r\n${longStatement}`;
            const longLineIdx = 3;

            try {
                response = await Invoke.ams(dummySession, longStatement.split(/\r?\n/));
            } catch (e) {
                caughtError = e;
            }

            // Repeat the above test
            expect(response).toBeUndefined();
            expect(invokeExpectJsonSpy).not.toHaveBeenCalled();
            expect(caughtError).toBeDefined();

            errorMessage = stripNewLines(caughtError.message);
            expect(errorMessage).toContain(`is longer than ${ZosFilesConstants.MAX_AMS_LINE} characters`);
            expect(errorMessage).toContain(returnString);

            expect(errorContextMock).toHaveBeenCalledTimes(2);
            expect(errorContextMock).toHaveBeenLastCalledWith(longStatement.toUpperCase().split(/\r?\n/), longLineIdx);
        });

        it("should process statements contained in an array of strings", async () => {
            let response;
            let caughtError;

            try {
                response = await Invoke.ams(dummySession, statements.split(/\r?\n/));
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success        : true,
                commandResponse: ZosFilesMessages.amsCommandExecutedSuccessfully.message,
                apiResponse    : invokeAPIRespose
            });

            expect(invokeExpectJsonSpy).toHaveBeenCalledTimes(1);
            expect(invokeExpectJsonSpy).toHaveBeenCalledWith(
                dummySession,
                posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_AMS),
                reqHeaders,
                reqPayload
            );
        });

        it("should process statements from the specified file path", async () => {
            let response;
            let caughtError;

            try {
                response = await Invoke.ams(dummySession, dummyFileName);
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success        : true,
                commandResponse: ZosFilesMessages.amsCommandExecutedSuccessfully.message,
                apiResponse    : invokeAPIRespose
            });

            expect(invokeExpectJsonSpy).toHaveBeenCalledTimes(1);
            expect(invokeExpectJsonSpy).toHaveBeenCalledWith(
                dummySession,
                posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_AMS),
                reqHeaders,
                reqPayload
            );
        });

        it("should handle an error from the ZosmfRestClient", async () => {
            const error = new Error("This is a test");

            invokeExpectJsonSpy.mockImplementation(async () => {
                throw error;
            });

            let caughtError;

            try {
                await Invoke.ams(dummySession, statements.split(/\r?\n/));
            } catch (e) {
                caughtError = e;
            }

            expect(caughtError).toBe(error);
        });
    });
});
