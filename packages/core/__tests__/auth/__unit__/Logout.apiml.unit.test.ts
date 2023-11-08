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

import { Logout, ZosmfRestClient, ImperativeError, NextVerFeatures, RestConstants } from "../../../src";

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
    ]
};


const realErrorText = "Token is not valid or expired";
const mockErrorText = "Fake error for Auth Logout APIML unit tests";
const throwImperativeError = async () => {
    throw new ImperativeError({ msg: mockErrorText });
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
        it("should throw an error with HTTP 401", async () => {
            ZosmfRestClient.prototype.request = jest.fn();
            (ZosmfRestClient.prototype as any).mResponse = badResponse401;
            let caughtError;
            try {
                await Logout.apimlLogout(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
        });

        it("should be able to catch 401 errors from apimlLogout", async () => {
            const runTest = async (errorString: string): Promise<ImperativeError> => {
                ZosmfRestClient.prototype.request = jest.fn(async () => { throw new Error(errorString); });
                let caughtError;
                try {
                    await Logout.apimlLogout(fakeSession);
                } catch (error) {
                    caughtError = error;
                }
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(realErrorText);
                expect(caughtError).toBeInstanceOf(ImperativeError);
                return caughtError;
            };
            // Token is invalid (logged out but not expired)
            expect(await runTest("org.zowe.apiml.security.query.invalidToken")).toBeDefined();
            // Token is expired (old token)
            expect(await runTest("org.zowe.apiml.security.expiredToken")).toBeDefined();
            // Token is not APIML token
            expect(await runTest("org.zowe.apiml.security.query.tokenNotProvided")).toBeDefined();
        });
    });

    describe("Error handling tests - Token Expired - HTTP 500 - Zowe V1 APIML", () => {
        it("should not throw and be able to catch 500 errors when a expired token was provided", async () => {
            ZosmfRestClient.prototype.request = jest.fn(async function() {
                this.mData = Buffer.from(JSON.stringify(badDataExpired));
                throw new Error("TokenExpireException");
            });
            (ZosmfRestClient.prototype as any).mResponse = badResponse500;

            let caughtError: ImperativeError = undefined as any;
            try {
                await Logout.apimlLogout(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
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
            expect(caughtError.message).toContain("session");
            expect(caughtError).toBeInstanceOf(ImperativeError);
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
            expect(caughtError.message).toContain("apimlAuthenticationToken");
            expect(caughtError).toBeInstanceOf(ImperativeError);
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
            expect(caughtError.message).toContain("token");
            expect(caughtError).toBeInstanceOf(ImperativeError);
        });
    });
});
