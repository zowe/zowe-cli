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

import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { SendTsoApp } from "@zowe/zos-tso-for-zowe-sdk";
import * as SendASAppHandler from "../../../../../src/zostso/send/as-app/SendASApp.handler";
import * as SendASAppDefinition from "../../../../../src/zostso/send/as-app/SendASApp.definition";
import { IHandlerParameters } from "@zowe/imperative";
import { mockHandlerParameters } from "@zowe/cli-test-utils";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-tso","send","app","--app-key","test2"],
    definition: SendASAppDefinition.SendASApp
});
const MOCK_SEND_RESPONSE = Promise.resolve({
    servletKey: "JR897694-127-aabeaaag",
    ver: "0100",
    tsoData: [
        {
            "TSO MESSAGE": {
                VERSION: "0100",
                DATA: "HELLOW exec processing has started.",
            },
        },
        {
            "TSO MESSAGE": {
                VERSION: "0100",
                DATA: "UNIX message queue id = 1048608",
            },
        },
    ],
    reused: false,
    timeout: false,
});

describe("receive TSO app handler behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should properly receive and parse data from receive TSO response", async () => {
        jest.spyOn(ZosmfRestClient, "putExpectJSON").mockResolvedValueOnce(
            MOCK_SEND_RESPONSE
        );
        const sendSpy = jest.spyOn(SendTsoApp,"send");
        const handler = new SendASAppHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        let error = undefined;
        params.arguments = {...params.arguments,account: "izuacct", appKey: "test2", servletKey: "JR897694-129-aaceaaap", message: "LONG 100"};
        try{
            await handler.process(params);
        }
        catch(e)
        {
            error = e;
        }
        expect(error).toBeUndefined();
        expect(sendSpy).toHaveBeenCalledTimes(1);
    });
});
