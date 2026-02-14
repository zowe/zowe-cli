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
import { ChangePassword } from "@zowe/zosmf-for-zowe-sdk";
import { ICommandHandler, IHandlerParameters } from "@zowe/imperative";
import CmdHandler from "../../../../src/zosmf/change-password/ChangePassword.handler";
import * as cmdDef from "../../../../src/zosmf/change-password/ChangePassword.definition";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../__tests__/__src__/TestConstants";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

jest.mock("../../../../../zosmf/src/ChangePassword");

const goodResponse = {
    returnCode: 0,
    reasonCode: 0,
    message: "Success."
};

const goodCmdParms: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zosmf", "change-password"],
    definition: cmdDef.ChangePasswordCommand
});

let changePasswordHandler: ICommandHandler = null;

describe("zosmf change-password handler", () => {
    beforeEach(() => {
        (ChangePassword.zosmfChangePassword as any) = jest.fn(async () => goodResponse);
        changePasswordHandler = new CmdHandler();
    });

    const withPrompt = (
        parms: IHandlerParameters,
        oldPwd: string = "promptedOldPass",
        newPwd: string = "promptedNewPass"
    ): IHandlerParameters => {
        let callCount = 0;
        parms.response.console.prompt = jest.fn(async () => {
            return callCount++ === 0 ? oldPwd : newPwd;
        }) as any;
        return parms;
    };

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should change the password and display success message", async () => {
        const parmsToUse = withPrompt(Object.assign({}, ...[goodCmdParms]));
        parmsToUse.response.console.log = jest.fn((logs) => {
            expect(logs).toContain("Successfully changed password or passphrase.");
        }) as any;

        await changePasswordHandler.process(parmsToUse);
        expect(parmsToUse.response.console.prompt).toHaveBeenCalledTimes(2);
        expect(ChangePassword.zosmfChangePassword).toHaveBeenCalledTimes(1);
    });

    it("should set the response data object with the z/OSMF response", async () => {
        const parmsToUse = withPrompt(Object.assign({}, ...[goodCmdParms]));
        parmsToUse.response.data.setObj = jest.fn((setObjArgs) => {
            expect(setObjArgs).toBeDefined();
            expect(setObjArgs.returnCode).toBe(0);
            expect(setObjArgs.reasonCode).toBe(0);
            expect(setObjArgs.message).toBe("Success.");
        });

        await changePasswordHandler.process(parmsToUse);
        expect(ChangePassword.zosmfChangePassword).toHaveBeenCalledTimes(1);
    });

    it("should pass the REST client error to the command processor", async () => {
        const parmsToUse = withPrompt(Object.assign({}, ...[goodCmdParms]));
        (ChangePassword.zosmfChangePassword as any) = jest.fn(() => {
            throw new Error("Mock ChangePassword Error");
        });

        let error;
        try {
            await changePasswordHandler.process(parmsToUse);
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("Mock ChangePassword Error");
        expect(ChangePassword.zosmfChangePassword).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if user is missing from session", async () => {
        const parmsNoAuth: IHandlerParameters = mockHandlerParameters({
            arguments: {
                ...UNIT_TEST_ZOSMF_PROF_OPTS,
                user: undefined
            },
            positionals: ["zosmf", "change-password"],
            definition: cmdDef.ChangePasswordCommand
        });
        withPrompt(parmsNoAuth);

        let error;
        try {
            await changePasswordHandler.process(parmsNoAuth);
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("Username is required");
    });

    it("should throw an error if old password prompt returns empty string", async () => {
        const parmsEmptyPrompt: IHandlerParameters = mockHandlerParameters({
            arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
            positionals: ["zosmf", "change-password"],
            definition: cmdDef.ChangePasswordCommand
        });
        withPrompt(parmsEmptyPrompt, "", "newPass");

        let error;
        try {
            await changePasswordHandler.process(parmsEmptyPrompt);
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("Current password or passphrase is required");
    });

    it("should throw an error if new password prompt returns empty string", async () => {
        const parmsEmptyPrompt: IHandlerParameters = mockHandlerParameters({
            arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
            positionals: ["zosmf", "change-password"],
            definition: cmdDef.ChangePasswordCommand
        });
        withPrompt(parmsEmptyPrompt, "oldPass", "");

        let error;
        try {
            await changePasswordHandler.process(parmsEmptyPrompt);
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.message).toContain("New password or passphrase is required");
    });
});
