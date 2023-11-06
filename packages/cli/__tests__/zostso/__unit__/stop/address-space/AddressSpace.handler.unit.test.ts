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

jest.mock("../../../../../../zostso/lib/StopTso");
import { StopTso } from "@zowe/zos-tso-for-zowe-sdk";
import { StopTsoData } from "../../../__resources__/StopTsoData";
import { IHandlerParameters, ImperativeError } from "@zowe/core-for-zowe-sdk";
import * as AddressSpaceHandler from "../../../../../src/zostso/stop/address-space/AddressSpace.handler";
import * as AddressSpaceDefinition from "../../../../../src/zostso/stop/address-space/AddressSpace.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-tso", "stop", "address-space"],
    definition: AddressSpaceDefinition.AddressSpaceDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("stop address-space handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to stop address-space", async () => {
        StopTso.stop = jest.fn(async (session, servletKey) => {
            return StopTsoData.SAMPLE_STOP_RESPONSE;
        });
        const handler = new AddressSpaceHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.servletKey = "ZOSMFAD-SYS2-55-aaakaaac";
        await handler.process(params);
        expect(StopTso.stop).toHaveBeenCalledTimes(1);
    });

    it("should be able respond with error message", async () => {
        const failMessage = "IZUG1126E: z/OSMF cannot correlate the request for key \"ZOSMFAD-SYS2-55-aaakaaac\"\n" +
            "with an active z/OS application session.";
        let error;
        StopTso.stop = jest.fn((session, servletKey) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new AddressSpaceHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.servletKey = "ZOSMFAD-SYS2-55-aaakaaac";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(StopTso.stop).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
