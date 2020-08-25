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

import { ImperativeError, Session } from "@zowe/imperative";
import { CheckStatus, ZosmfConstants, IZosmfInfoResponse } from "../../../";
import { ZosmfRestClient } from "../../../";

describe("Check Status api", () => {
    const dummySession: any = {};
    const endpoint = ZosmfConstants.RESOURCE + ZosmfConstants.INFO;
    const dummyResponse: IZosmfInfoResponse = {};
    let mySpy: any;
    const restErrMsgText = "The error message thrown by our Rest API";

    beforeEach(() => {
        mySpy = jest.spyOn(ZosmfRestClient, "getExpectJSON");
    });

    afterEach(() => {
        mySpy.mockReset();
        mySpy.mockRestore();
    });

    describe("Success scenarios", () => {
        it("should be able to get info from Zosmf", async () => {
            let response;
            let error;
            mySpy.mockImplementation( async () => {
                return dummyResponse;
            });
            try {
                response = await CheckStatus.getZosmfInfo(dummySession);
            } catch (err) {
                error = err;
            }
            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
        });

        it("should throw appropriate error when unable to reach host", async () => {
            let response;
            let error;
            mySpy.mockRejectedValue(new ImperativeError({
                msg: restErrMsgText,
                causeErrors: {
                    code: ZosmfConstants.ERROR_CODES.BAD_HOST_NAME
                }
            }));

            try {
                response = await CheckStatus.getZosmfInfo(dummySession);
            } catch (err) {
                error = err;
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(restErrMsgText);
            expect(error.mDetails.causeErrors.code).toContain(ZosmfConstants.ERROR_CODES.BAD_HOST_NAME);
         });

        it("should throw appropriate error when unable to connect to port", async () => {
            let response;
            let error;
            mySpy.mockRejectedValue(new ImperativeError({
                msg: restErrMsgText,
                causeErrors: {
                    code: ZosmfConstants.ERROR_CODES.BAD_PORT
                }
            }));

            try {
                response = await CheckStatus.getZosmfInfo(dummySession);
            } catch (err) {
                error = err;
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(restErrMsgText);
            expect(error.mDetails.causeErrors.code).toContain(ZosmfConstants.ERROR_CODES.BAD_PORT);
        });

        it("should throw appropriate error when unsigned cert is in chain", async () => {
            let response;
            let error;
            mySpy.mockRejectedValue(new ImperativeError({
                msg: restErrMsgText,
                causeErrors: {
                    code: ZosmfConstants.ERROR_CODES.SELF_SIGNED_CERT_IN_CHAIN,
                    message: "Some cert in the chain is unsigned"
                }
            }));

            const testSession = new Session({
                hostname: "testHostName",
                rejectUnauthorized: true
            });

            try {
                response = await CheckStatus.getZosmfInfo(testSession);
            } catch (err) {
                error = err;
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(restErrMsgText);
            expect(error.mDetails.causeErrors.code).toContain(ZosmfConstants.ERROR_CODES.SELF_SIGNED_CERT_IN_CHAIN);
        });

        it("should throw appropriate error when the first (leaf) cert is unsigned", async () => {
            let response;
            let error;
            mySpy.mockRejectedValue(new ImperativeError({
                msg: restErrMsgText,
                causeErrors: {
                    code: ZosmfConstants.ERROR_CODES.UNABLE_TO_VERIFY_LEAF_SIGNATURE,
                    message: "The first, aka leaf, cert is unsigned"
                }
            }));

            const testSession = new Session({
                hostname: "testHostName",
                rejectUnauthorized: true
            });

            try {
                response = await CheckStatus.getZosmfInfo(testSession);
            } catch (err) {
                error = err;
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(restErrMsgText);
            expect(error.mDetails.causeErrors.code).toContain(ZosmfConstants.ERROR_CODES.UNABLE_TO_VERIFY_LEAF_SIGNATURE);
        });
    });
});
