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

import { ChangePassword } from "../../../src/ChangePassword";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { ImperativeError, RestClientError } from "@zowe/imperative";

const goodResponse = {
    returnCode: 0,
    reasonCode: 0,
    message: "Success."
};

const mockErrorText = "Fake error for ChangePassword unit tests";
const throwImperativeError = async () => {
    throw new ImperativeError({ msg: mockErrorText });
};

let fakeSession: any;

describe("ChangePassword unit tests", () => {

    beforeEach(() => {
        fakeSession = {
            ISession: {
                hostname: "fake.host.com",
                port: 10443,
                user: "fakeUser",
                password: "fakeOldPassword"
            }
        };
    });

    describe("Positive tests", () => {
        it("should allow users to call zosmfChangePassword with correct parameters", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(async () => goodResponse) as any;

            let caughtError;
            let response;
            try {
                response = await ChangePassword.zosmfChangePassword(fakeSession, "fakeUser", "oldPass", "newPass");
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.returnCode).toBe(0);
            expect(response.reasonCode).toBe(0);
            expect(response.message).toBe("Success.");
        });

        it("should call ZosmfRestClient.putExpectJSON with correct parameters", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(async () => goodResponse) as any;

            await ChangePassword.zosmfChangePassword(fakeSession, "testUser", "oldPwd123", "newPwd456");

            expect(ZosmfRestClient.putExpectJSON).toHaveBeenCalledTimes(1);
            expect(ZosmfRestClient.putExpectJSON).toHaveBeenCalledWith(
                fakeSession,
                "/zosmf/services/authenticate",
                [{ "Content-Type": "application/json" }],
                { userID: "testUser", oldPwd: "oldPwd123", newPwd: "newPwd456" }
            );
        });
    });

    describe("Error handling tests", () => {
        it("should be able to catch errors from zosmfChangePassword with async/await syntax", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(throwImperativeError) as any;

            let caughtError;
            try {
                await ChangePassword.zosmfChangePassword(fakeSession, "user", "old", "new");
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toEqual(mockErrorText);
        });

        it("should be able to catch errors from zosmfChangePassword with Promise.catch() syntax", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(throwImperativeError) as any;

            await expect(
                ChangePassword.zosmfChangePassword(fakeSession, "user", "old", "new")
            ).rejects.toThrow(mockErrorText);
        });
    });

    describe("Parameter validation", () => {
        it("should reject calls that omit session", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(throwImperativeError) as any;

            let caughtError;
            try {
                await ChangePassword.zosmfChangePassword(null as any, "user", "old", "new");
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("session");
        });

        it("should reject calls that omit user ID", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(throwImperativeError) as any;

            let caughtError;
            try {
                await ChangePassword.zosmfChangePassword(fakeSession, null as any, "old", "new");
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("User ID");
        });

        it("should reject calls that omit old password", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(throwImperativeError) as any;

            let caughtError;
            try {
                await ChangePassword.zosmfChangePassword(fakeSession, "user", null as any, "new");
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("Old password");
        });

        it("should reject calls that omit new password", async () => {
            ZosmfRestClient.putExpectJSON = jest.fn(throwImperativeError) as any;

            let caughtError;
            try {
                await ChangePassword.zosmfChangePassword(fakeSession, "user", "old", null as any);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError instanceof ImperativeError).toEqual(true);
            expect(caughtError.message).toContain("New password");
        });
    });

    describe("Error sanitisation", () => {
        const oldPassword = "s3cretOldPwd!";
        const newPassword = "n3wS3cure#456";

        it("should cencor passwords from RestClientError payload", async () => {
            const restError = new RestClientError({
                msg: "Rest API failure with HTTP(S) status 401",
                source: "http",
                payload: { userID: "testUser", oldPwd: oldPassword, newPwd: newPassword },
                additionalDetails: `Payload: { userID: 'testUser', oldPwd: '${oldPassword}', newPwd: '${newPassword}' }`
            });
            ZosmfRestClient.putExpectJSON = jest.fn(async () => { throw restError; }) as any;

            let caughtError: any;
            try {
                await ChangePassword.zosmfChangePassword(fakeSession, "testUser", oldPassword, newPassword);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError instanceof RestClientError).toBe(true);
            expect(caughtError.mDetails.payload.oldPwd).toBe("****");
            expect(caughtError.mDetails.payload.newPwd).toBe("****");
            expect(caughtError.mDetails.payload.userID).toBe("testUser");
        });

        it("should cencor passwords from RestClientError additionalDetails string", async () => {
            const detailsString =
                `Received HTTP(S) error 500 = Internal Server Error.\n` +
                `\nProtocol:          https` +
                `\nHost:              fake.host.com` +
                `\nPort:              10443` +
                `\nBase Path:         ` +
                `\nResource:          /zosmf/services/authenticate` +
                `\nRequest:           PUT` +
                `\nHeaders:           [{"Content-Type":"application/json"},{"X-CSRF-ZOSMF-HEADER":true}]` +
                `\nPayload:           { userID: 'testUser', oldPwd: '${oldPassword}', newPwd: '${newPassword}' }` +
                `\nAllow Unauth Cert: true` +
                `\nAvailable creds:   user,password,base64EncodedAuth` +
                `\nYour auth order:   basic,token,bearer,cert-pem` +
                `\nAuth type used:    basic`;
            const restError = new RestClientError({
                msg: "Rest API failure with HTTP(S) status 500",
                source: "http",
                payload: { userID: "testUser", oldPwd: oldPassword, newPwd: newPassword },
                additionalDetails: detailsString
            });
            ZosmfRestClient.putExpectJSON = jest.fn(async () => { throw restError; }) as any;

            let caughtError: any;
            try {
                await ChangePassword.zosmfChangePassword(fakeSession, "testUser", oldPassword, newPassword);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.mDetails.additionalDetails).not.toContain(oldPassword);
            expect(caughtError.mDetails.additionalDetails).not.toContain(newPassword);
            expect(caughtError.mDetails.additionalDetails).toContain("****");
            expect(caughtError.mDetails.additionalDetails).toContain("testUser");
            expect(caughtError.mDetails.additionalDetails).toContain("Received HTTP(S) error 500");
            expect(caughtError.mDetails.additionalDetails).toContain("Headers:");
            expect(caughtError.mDetails.additionalDetails).toContain("Available creds:");
        });

        it("should pass through non RestClientError errors unchanged", async () => {
            const plainError = new ImperativeError({ msg: "Some other error" });
            ZosmfRestClient.putExpectJSON = jest.fn(async () => { throw plainError; }) as any;

            let caughtError: any;
            try {
                await ChangePassword.zosmfChangePassword(fakeSession, "user", oldPassword, newPassword);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError).toBe(plainError);
            expect(caughtError.message).toBe("Some other error");
        });

        it("should add extra details for return code 8 reason code 2 errors", async () => {
            const errorResponse = {
                returnCode: 8,
                reasonCode: 2,
                message: "Change password failed. Check whether the user ID and old password you provided is correct."
            };
            const restError = new RestClientError({
                msg: "Rest API failure with HTTP(S) status 500",
                source: "http",
                causeErrors: JSON.stringify(errorResponse),
                payload: { userID: "testUser", oldPwd: oldPassword, newPwd: newPassword },
                additionalDetails: "Diagnostic information"
            });
            ZosmfRestClient.putExpectJSON = jest.fn(async () => { throw restError; }) as any;

            let caughtError: any;
            try {
                await ChangePassword.zosmfChangePassword(fakeSession, "testUser", oldPassword, newPassword);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError instanceof RestClientError).toBe(true);
            expect(caughtError.message).toContain("Note: This generic failure message may also indicate:");
            expect(caughtError.message).toContain("The user ID was revoked");
            expect(caughtError.message).toContain("The user ID is not defined in RACF");
            expect(caughtError.message).toContain("Display error details when login fails");
        });

        it("should not add extra details for other return codes", async () => {
            const errorResponse = {
                returnCode: 4,
                reasonCode: 4,
                message: "The user ID is not defined to RACF."
            };
            const restError = new RestClientError({
                msg: "Rest API failure with HTTP(S) status 400",
                source: "http",
                causeErrors: JSON.stringify(errorResponse),
                payload: { userID: "testUser", oldPwd: oldPassword, newPwd: newPassword },
                additionalDetails: "Diagnostic information"
            });
            ZosmfRestClient.putExpectJSON = jest.fn(async () => { throw restError; }) as any;

            let caughtError: any;
            try {
                await ChangePassword.zosmfChangePassword(fakeSession, "testUser", oldPassword, newPassword);
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError instanceof RestClientError).toBe(true);
            expect(caughtError.message).not.toContain("Note: This generic failure message may also indicate:");
            expect(caughtError.message).toContain("Rest API failure with HTTP(S) status 400");
        });
    });
});
