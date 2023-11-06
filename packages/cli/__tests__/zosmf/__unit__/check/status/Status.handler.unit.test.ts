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

jest.mock("../../../../../../zosmf/lib/CheckStatus");
import { CheckStatus } from "@zowe/zosmf-for-zowe-sdk";
import { ICommandHandler, IHandlerParameters } from "@zowe/core-for-zowe-sdk";
import CmdHandler from "../../../../../src/zosmf/check/status/Status.handler";
import * as cmdDef from "../../../../../src/zosmf/check/status/Status.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const goodCmdParms: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zosmf", "check", "status"],
    definition: cmdDef.StatusDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

let checkStatHandler: ICommandHandler = null;

describe("check status behavior", () => {
    beforeEach(() => {
        CheckStatus.getZosmfInfo = jest.fn(async (session): Promise<any> => {
            return {
                zos_version: "zosv123",
                zosmf_port: "1234",
                zosmf_version: "v123",
                zosmf_hostname: "CAMainframe",
                zosmf_saf_realm: "MakeBelieve",
                zosmf_full_version: "v123456",
                api_version: "apiV1",
                plugins: []
            };
        });

        checkStatHandler = new CmdHandler();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should display zosmf properties", async () => {
        const parmsToUse = Object.assign({}, ...[goodCmdParms]);
        parmsToUse.response.console.log = jest.fn((logs) => {
            expect(logs).toMatchSnapshot();
            expect(logs).toContain("successfully connected to z/OSMF");
        });

        await checkStatHandler.process(parmsToUse);
        expect(CheckStatus.getZosmfInfo).toHaveBeenCalledTimes(1);
    });

    it("should return a json object with the right properties", async () => {
        const parmsToUse = Object.assign({}, ...[goodCmdParms]);
        parmsToUse.response.data.setObj = jest.fn((setObjArgs) => {
            expect(setObjArgs).toMatchSnapshot();
            expect(setObjArgs.zos_version).toBe("zosv123");
            expect(setObjArgs.zosmf_hostname).toBe("CAMainframe");
            expect(setObjArgs.zosmf_saf_realm).toBe("MakeBelieve");
        });

        await checkStatHandler.process(parmsToUse);
        expect(CheckStatus.getZosmfInfo).toHaveBeenCalledTimes(1);
    });

    it("should pass the rest client error to the command processor (no transformation)", async () => {
        const parmsToUse = Object.assign({}, ...[goodCmdParms]);
        CheckStatus.getZosmfInfo = jest.fn((session) => {
            throw new Error("Mock GetInfo Error");
        });
        parmsToUse.response.console.error = jest.fn((errors) => {
            expect(errors).toMatchSnapshot();
            expect(errors).toContain("Mock GetInfo Error");
        });

        let error;
        try {
            await checkStatHandler.process(parmsToUse);
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
        expect(CheckStatus.getZosmfInfo).toHaveBeenCalledTimes(1);
    });
});
