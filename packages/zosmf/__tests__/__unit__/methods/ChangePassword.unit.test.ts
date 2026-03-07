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

import { RestClientError, Session } from "@zowe/imperative";
import { ZosmfRestClient, IChangePasswordResponse } from "@zowe/core-for-zowe-sdk";
import { ZosmfChangePassword, IZosmfChangePasswordResponse } from "../../../src";

describe("ZosmfChangePassword", () => {
    const testSession = new Session({
        hostname: "dummy",
        port: 443,
        user: "TESTUSER",
        password: "oldPass",
        type: "basic",
        rejectUnauthorized: false
    });

    const goodZosmfResponse: IZosmfChangePasswordResponse = {
        returnCode: 0,
        reasonCode: 0,
        message: "Success."
    };

    let putSpy: jest.SpyInstance;

    beforeEach(() => {
        putSpy = jest.spyOn(ZosmfRestClient, "putExpectJSON");
    });

    afterEach(() => {
        putSpy.mockReset();
        putSpy.mockRestore();
    });

    it("should change password successfully and return generic response", async () => {
        putSpy.mockResolvedValue(goodZosmfResponse);

        const response: IChangePasswordResponse = await ZosmfChangePassword.changePassword(
            testSession,
            { newPassword: "newPass" }
        );

        expect(putSpy).toHaveBeenCalledTimes(1);
        expect(putSpy).toHaveBeenCalledWith(
            testSession,
            "/zosmf/services/authenticate",
            expect.any(Array),
            { userID: "TESTUSER", oldPwd: "oldPass", newPwd: "newPass" }
        );

        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(response.data!.returnCode).toBe(0);
        expect(response.data!.reasonCode).toBe(0);
        expect(response.data!.message).toBe("Success.");
    });

    it("should set success to false when z/OSMF returns non-zero codes", async () => {
        const failZosmfResponse: IZosmfChangePasswordResponse = {
            returnCode: 4,
            reasonCode: 4,
            message: "The user ID is not defined to RACF."
        };
        putSpy.mockResolvedValue(failZosmfResponse);

        const response = await ZosmfChangePassword.changePassword(
            testSession,
            { newPassword: "newPass" }
        );

        expect(response.success).toBe(false);
        expect(response.data!.returnCode).toBe(4);
        expect(response.data!.reasonCode).toBe(4);
    });

    it("should throw when session is null", async () => {
        let error: any;
        try {
            await ZosmfChangePassword.changePassword(null as any, { newPassword: "newPass" });
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("session");
    });

    it("should throw when parms is null", async () => {
        let error: any;
        try {
            await ZosmfChangePassword.changePassword(testSession, null as any);
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
    });

    it("should throw when newPassword is null", async () => {
        let error: any;
        try {
            await ZosmfChangePassword.changePassword(testSession, { newPassword: null as any });
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("password");
    });

    it("should throw when session user is undefined", async () => {
        const noUserSession = new Session({
            hostname: "dummy",
            port: 443,
            rejectUnauthorized: false
        });
        let error: any;
        try {
            await ZosmfChangePassword.changePassword(noUserSession, { newPassword: "newPass" });
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("user");
    });

    it("should throw when session password is undefined", async () => {
        const noPwdSession = new Session({
            hostname: "dummy",
            port: 443,
            user: "TESTUSER",
            rejectUnauthorized: false
        });
        let error: any;
        try {
            await ZosmfChangePassword.changePassword(noPwdSession, { newPassword: "newPass" });
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toContain("password");
    });

    it("should censor passwords in RestClientError payload", async () => {
        const restErr = new RestClientError({
            msg: "REST API failure",
            source: "http",
            payload: { userID: "TESTUSER", oldPwd: "oldPass", newPwd: "newPass" },
            additionalDetails: "Payload:           { userID: 'TESTUSER', oldPwd: 'oldPass', newPwd: 'newPass' }"
        });
        putSpy.mockRejectedValue(restErr);

        let error: any;
        try {
            await ZosmfChangePassword.changePassword(testSession, { newPassword: "newPass" });
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.mDetails.payload.oldPwd).toBe("****");
        expect(error.mDetails.payload.newPwd).toBe("****");
    });

    it("should append extra info for generic 8/2 failure", async () => {
        const restErr = new RestClientError({
            msg: "REST API failure",
            source: "http",
            causeErrors: JSON.stringify({ returnCode: 8, reasonCode: 2, message: "Change password failed." })
        });
        putSpy.mockRejectedValue(restErr);

        let error: any;
        try {
            await ZosmfChangePassword.changePassword(testSession, { newPassword: "newPass" });
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("user ID was revoked");
        expect(error.message).toContain("not defined in RACF");
    });
});
