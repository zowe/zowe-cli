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

import { SendTsoData } from "../../../__resources__/SendTsoData";

jest.mock("../../../../../../zostso/lib/SendTso");
import { SendTso } from "@zowe/zos-tso-for-zowe-sdk";
import { IHandlerParameters, ImperativeError } from "@zowe/core-for-zowe-sdk";
import * as SendToAddressSpace from "../../../../../src/zostso/send/address_space/SendToAddressSpace.handler";
import { SendToAddressSpaceCommandDefinition } from "../../../../../src/zostso/send/address_space/SendToAddressSpace.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-tso", "send", "address-space"],
    definition: SendToAddressSpaceCommandDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("send address-space handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to send data to address-space", async () => {
        SendTso.sendDataToTSOCollect = jest.fn(async (session, servletKey, data) => {
            return SendTsoData.SAMPLE_SEND_RESPONSE;
        });
        const handler = new SendToAddressSpace.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.servletKey = "ZOSMFAD-SYS2-55-aaakaaac";
        params.arguments.data = "data";
        await handler.process(params);
        expect(SendTso.sendDataToTSOCollect).toHaveBeenCalledTimes(1);
    });

    it("should be able respond with error message", async () => {
        const failMessage = "IZUG1126E: z/OSMF cannot correlate the request for key \"ZOSMFAD-SYS2-55-aaakaaac\"\n" +
            "with an active z/OS application session.";
        let error;
        SendTso.sendDataToTSOCollect = jest.fn((session, servletKey) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new SendToAddressSpace.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.servletKey = "ZOSMFAD-SYS2-55-aaakaaac";
        params.arguments.servletKey = "data";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(SendTso.sendDataToTSOCollect).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
