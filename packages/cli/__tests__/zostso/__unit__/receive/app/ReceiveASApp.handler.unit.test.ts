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
import { ReceiveTsoApp } from "@zowe/zos-tso-for-zowe-sdk";
import * as ReceiveASAppHandler from "../../../../../src/zostso/receive/app/ReceiveASApp.handler";
import * as ReceiveASAppDefinition from "../../../../../src/zostso/receive/app/ReceiveASApp.definition";
import { IHandlerParameters } from "@zowe/imperative";
import { mockHandlerParameters } from "@zowe/cli-test-utils";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-tso","r","app"],
    definition: ReceiveASAppDefinition.ReceiveASApp
});
const MOCK_RECEIVE_RESPONSE: any = {
    version: undefined,
    reused: false,
    timeout: false,
    servletKey: "JR897694-122-aabyaaaj",
    queueID: null,
    tsoData: [
        {
            "TSO MESSAGE": { VERSION: "0100", DATA: "Processing started." },
        },
        {
            "TSO MESSAGE": { VERSION: "0100", DATA: "READY" },
        },
    ],
};

describe("receive TSO app handler behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should properly receive and parse data from receive TSO response", async () => {
        jest.spyOn(ZosmfRestClient, "getExpectJSON").mockResolvedValueOnce(
            MOCK_RECEIVE_RESPONSE
        );
        const receiveSpy = jest.spyOn(ReceiveTsoApp,"receive");
        const handler = new ReceiveASAppHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        let error = undefined;
        params.arguments = {...params.arguments,account: "izuacct", appKey: "test2", servletKey: "JR897694-122-aabyaaaj", runUntilReady: true};
        try{
            await handler.process(params);
        }
        catch(e)
        {
            error = e;
        }
        expect(error).toBeUndefined();
        expect(receiveSpy).toHaveBeenCalledTimes(1);
    });
});
