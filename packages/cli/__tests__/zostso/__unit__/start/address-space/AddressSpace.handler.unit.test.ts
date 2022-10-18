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

import { StartTso } from "@zowe/zos-tso-for-zowe-sdk";
import { StartTsoData } from "../../../__resources__/StartTsoData";
import { CommandProfiles, IHandlerParameters, ImperativeError, IProfile } from "@zowe/imperative";
import * as AddressSpaceHandler from "../../../../../src/zostso/start/address-space/AddressSpace.handler";
import * as AddressSpaceDefinition from "../../../../../src/zostso/start/address-space/AddressSpace.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set(
    "zosmf", [{
        name: "zosmf",
        type: "zosmf",
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    }]
);

const TSO_PROF_OPTS = {
    logonProcedure: "IZUFPROC",
    characterSet: "697",
    codePage: "1047",
    rows: "24",
    columns: "80",
    regionSize: "4096",
    account: "DEFAULT"
};

PROFILE_MAP.set(
    "tso", [{
        name: "tso",
        type: "tso",
        ...TSO_PROF_OPTS
    }]
);

const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-tso", "start", "address-space"],
    definition: AddressSpaceDefinition.AddressSpaceDefinition,
    profiles: PROFILES
});

describe("start address-space handler tests", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should be able to start address-space", async () => {
        jest.spyOn(StartTso, "start").mockImplementation(async (session, commandParms, startParms) => {
            expect(startParms).toBeDefined();
            expect(startParms).toMatchSnapshot();
            return StartTsoData.SAMPLE_START_RESPONSE;
        });
        const handler = new AddressSpaceHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = { ...params.arguments, ...TSO_PROF_OPTS };

        await handler.process(params);
        expect(StartTso.start).toHaveBeenCalledTimes(1);
    });

    it("should be able to respond with error message, if required z/OSMF parameters were not passed", async () => {
        const handler = new AddressSpaceHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.user = "FakeUser";
        params.arguments.password = "FakePassword";
        let error;
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should throw an error if the response is not successful", async () => {
        const failure = "failed to start the address space";
        let error;
        jest.spyOn(StartTso, "start").mockImplementation(async (session, commandParms): Promise<any> => {
            return {
                success: false,
                failureResponse: {
                    message: failure
                }
            };
        });
        const handler = new AddressSpaceHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = { ...params.arguments, ...TSO_PROF_OPTS };
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(StartTso.start).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
        expect(error.additionalDetails).toEqual(failure);
    });
});
