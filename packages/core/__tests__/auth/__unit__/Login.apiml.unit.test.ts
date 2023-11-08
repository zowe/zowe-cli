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

import { Login, ZosmfRestClient, ImperativeError, NextVerFeatures, RestConstants } from "../../../src";

const goodResponse: any = {
    statusCode: RestConstants.HTTP_STATUS_204
};
const badResponse: any = {
    statusCode: RestConstants.HTTP_STATUS_401
};
const mockErrorText = "Fake error for Auth Login APIML unit tests";
const throwImperativeError = async () => {
    throw new ImperativeError({msg: mockErrorText});
};
const fakeSession: any = {
    ISession: {
        tokenType: "apimlAuthenticationToken",
        tokenValue: "fakeToken"
    }
};

describe("Auth Login APIML unit tests", () => {

    beforeEach(() => {
        /* This avoids having to mock ImperativeConfig.envVariablePrefix.
         * Unless the choice below is overridden, tests will use our legacy format for errors.
         */
        jest.spyOn(NextVerFeatures, "useV3ErrFormat").mockReturnValue(false);
    });

    describe("Positive tests", () => {
        it("should allow users to call apimlLogin with correct parameters", async () => {
            ZosmfRestClient.prototype.request = jest.fn();
            (ZosmfRestClient.prototype as any).mResponse = goodResponse;
            let caughtError;
            try {
                await Login.apimlLogin(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeUndefined();
        });
    });

    describe("Error handling tests - HTTP 401", () => {
        it("should be able to raise an error with HTTP 401", async () => {
            ZosmfRestClient.prototype.request = jest.fn();
            (ZosmfRestClient.prototype as any).mResponse = badResponse;
            let caughtError;
            try{
                await Login.apimlLogin(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.mDetails).toMatchSnapshot();
            expect(caughtError).toBeInstanceOf(ImperativeError);
        });
    });

    describe("Error handling tests - async/await", () => {
        it("should be able to catch errors from apimlLogin with async/await syntax", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Login.apimlLogin(fakeSession);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toEqual(mockErrorText);
            expect(caughtError).toBeInstanceOf(ImperativeError);
        });
    });

    describe("Error handling tests - Promise catch() syntax", () => {
        // eslint-disable-next-line jest/no-done-callback
        it("should be able to catch errors from apimlLogin with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            Login.apimlLogin(fakeSession).then(() => {
                expect(".catch() should have been called").toEqual("test failed");
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.message).toEqual(mockErrorText);
                expect(err).toBeInstanceOf(ImperativeError);
                done();
            });
        });
    });

    describe("Parameter validation", () => {
        it("should reject calls to apimlLogin that omit session", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Login.apimlLogin(null);
            } catch (error) {
                caughtError = error;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("session");
            expect(caughtError).toBeInstanceOf(ImperativeError);
        });

        it("should reject calls to apimlLogin that omit token type in session", async () => {
            ZosmfRestClient.prototype.request = jest.fn(throwImperativeError);
            let caughtError;
            try {
                await Login.apimlLogin({
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
    });
});
