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

import { Logout } from "../../../src/auth/Logout";
import { ZosmfRestClient } from "../../../src/rest/ZosmfRestClient";
import { ImperativeError, NextVerFeatures, RestConstants } from "@zowe/imperative";

const goodResponse: any = {
    statusCode: RestConstants.HTTP_STATUS_204
};
const badResponse401: any = {
    statusCode: RestConstants.HTTP_STATUS_401
};
const badResponse500: any = {
    statusCode: RestConstants.HTTP_STATUS_500
};
const badDataExpired = {
    messages: [
        {
            messageType: "ERROR",
            messageNumber: "ZWEAM701E",
            messageContent: "The request to the URL '/gateway/api/v1/auth/logout' has failed: TokenExpireException: " +
                "Token is expired. caused by: TokenExpireException: Token is expired.",
            messageKey: "org.zowe.apiml.common.internalRequestError"
        }
    ]};


const mockErrorText = "Fake error for Auth Logout APIML unit tests";
const throwImperativeError = async () => {
    throw new ImperativeError({msg: mockErrorText});
};
const fakeSession: any = {
    ISession: {
        tokenType: "apimlAuthenticationToken",
        tokenValue: "fakeToken"
    }
};

describe("Auth Logout APIML unit tests", () => {

    beforeEach(() => {
        /* This avoids having to mock ImperativeConfig.envVariablePrefix.
         * Unless overridden, tests will use our legacy format for errors.
         */
        jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(false);
    });

    describe("Positive tests", () => {
        it("should allow users to call apimlLogout with correct parameters", async () => {
            ZosmfRestClient.prototype.request = jest.fn();
            (ZosmfRestClient.prototype as any).mResponse = goodResponse;
            let caughtError;
            try {
                await Logout.apimlLogout(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
        });
    });

    describe("Error handling tests - HTTP 401", () => {
        it("should be able to raise an error with HTTP 401", async () => {
            ZosmfRestClient.prototype.request = jest.fn();
            (ZosmfRestClient.prototype as any).mResponse = badResponse401;
            let caughtError;
            try{
                await Logout.apimlLogout(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.mDetails.message).toContain("This operation requires authentication.");
            expect(caughtError.mDetails.message).toContain("z/OSMF REST API Error:");
            expect(caughtError.mDetails.message).toContain("REST API Failure with HTTP(S) status 401");
            expect(caughtError.mDetails.message).toContain("Host:      undefined");
            expect(caughtError.mDetails.message).toContain("Port:      undefined");
            expect(caughtError.mDetails.additionalDetails).toContain("HTTP(S) error status \"401\" received.");
            expect(caughtError.mDetails.additionalDetails).toContain(
                "Review request details (resource, base path, credentials, payload) and ensure correctness."
            );
            expect(caughtError.mDetails.additionalDetails).toContain("Host:      undefined");
            expect(caughtError.mDetails.additionalDetails).toContain("Port:      undefined");
        });
    });

    describe("Error handling tests - async/await", () => {
        it("should be able to catch errors from apimlLogout with async/await syntax", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Logout.apimlLogout(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toEqual(mockErrorText);
        });
    });

    describe("Error handling tests - Promise catch() syntax", () => {
        // eslint-disable-next-line jest/no-done-callback
        it("should be able to catch errors from apimlLogout with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            Logout.apimlLogout(fakeSession).then(() => {
                expect(".catch() should have been called").toEqual("test failed");
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toEqual(mockErrorText);
                done();
            });
        });
    });

    describe("Parameter validation", () => {
        it("should reject calls to apimlLogout that omit session", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Logout.apimlLogout(null);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("session");
        });

        it("should reject calls to apimlLogout that omit token type in session", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Logout.apimlLogout({
                    ISession: {
                        tokenValue: "fakeToken"
                    }
                } as any);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("apimlAuthenticationToken");
        });

        it("should reject calls to apimlLogout that omit token value in session", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Logout.apimlLogout({
                    ISession: {
                        tokenType: "apimlAuthenticationToken"
                    }
                } as any);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("token");
        });
    });
});
