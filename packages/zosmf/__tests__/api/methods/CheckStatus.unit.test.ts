/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ImperativeError } from "@brightside/imperative";
import { CheckStatus, ZosmfConstants, ZosmfMessages, IZosmfInfoResponse } from "../../../../zosmf";
import { ZosmfRestClient } from "../../../../rest";

describe("Check Status api", () => {
    const dummySession: any = {};
    const endpoint = ZosmfConstants.RESOURCE + ZosmfConstants.INFO;
    const dummyResponse: IZosmfInfoResponse = {};
    let mySpy: any;

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
                msg: "dummy msg",
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
            expect(error.message).toContain(ZosmfMessages.invalidHostName.message);
         });

        it("should throw appropriate error when unable to connect to port", async () => {
            let response;
            let error;
            mySpy.mockRejectedValue(new ImperativeError({
                msg: "dummy msg",
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
            expect(error.message).toContain(ZosmfMessages.invalidPort.message);
        });

        it("should throw appropriate error when improper reject unauthorized flag", async () => {
            let response;
            let error;
            mySpy.mockRejectedValue(new ImperativeError({
                msg: "dummy msg",
                causeErrors: {
                    code: ZosmfConstants.ERROR_CODES.SELF_SIGNED_CERT_IN_CHAIN
                }
            }));

            try {
                response = await CheckStatus.getZosmfInfo(dummySession);
            } catch (err) {
                error = err;
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(ZosmfMessages.improperRejectUnauthorized.message);
        });
    });
});
