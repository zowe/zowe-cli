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
import { StartTso, AddressSpaceApps, IStartStopResponses } from "@zowe/zos-tso-for-zowe-sdk";
import * as StartASAppHandler from "../../../../../src/zostso/start/as-app/StartASApp.handler";
import * as StartASAppDefinition from "../../../../../src/zostso/start/as-app/StartASApp.definition";
import { IHandlerParameters } from "@zowe/imperative";
import { mockHandlerParameters } from "@zowe/cli-test-utils";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

const NEW_AS_SPACE_PARAMS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-tso", "start", "app"],
    definition: StartASAppDefinition.StartASApp,
});
const EXISTING_AS_SPACE_PARAMS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["zos-tso", "start", "app"],
    definition: StartASAppDefinition.StartASApp,
});
const MOCK_RESPONSE = Promise.resolve({
    version: "0100",
    reused: false,
    timeout: false,
    servletKey: "ZOWEUSER-123-aaaaaa",
    queueID: "983068",
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
                DATA: "UNIX message queue id = 983068",
            },
        },
        {
            "TSO MESSAGE": {
                VERSION: "0100",
                DATA: "Input message type = 32772",
            },
        },
        { "TSO MESSAGE": { VERSION: "0100", DATA: "Output message type = 4" } },
        {
            "TSO MESSAGE": {
                VERSION: "0100",
                DATA: "Reading application input from the UNIX message queue.",
            },
        },
    ],
});

const MOCK_START_RESPONSE: Promise<IStartStopResponses> = Promise.resolve({
    collectedResponses: [],
    messages:
        "IKJ56455I ZOWEUSER LOGON IN PROGRESS AT 11:18:56 ON OCTOBER 14, 2024\nIKJ56951I NO BROADCAST MESSAGES\nREADY \n",
    servletKey: "ZOWEUSER-123-aaaaaa",
    success: true,
    zosmfTsoResponse: {
        ver: "0100",
        queueID: "983068",
        reused: false,
        servletKey: "ZOWEUSER-123-aaaaaa",
        sessionID: "0x00",
        timeout: false,
        tsoData: [{}],
    },
});
describe("receive TSO app handler behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should properly start TSO address space and run an application at the created address space", async () => {
        jest.spyOn(StartTso, "start").mockReturnValue(MOCK_START_RESPONSE);
        jest.spyOn(ZosmfRestClient, "postExpectJSON").mockReturnValue(
            MOCK_RESPONSE
        );

        const startSpy = jest.spyOn(AddressSpaceApps, "start");
        const startASSpaceSpy = jest.spyOn(StartTso, "start");
        const zosmfSpy = jest.spyOn(ZosmfRestClient, "postExpectJSON");
        const handler = new StartASAppHandler.default();
        const params = Object.assign({}, ...[NEW_AS_SPACE_PARAMS]);
        let error = undefined;
        params.arguments = {
            ...params.arguments,
            account: "izuacct",
            startup: "EXEC 'ZOWEUSER.PUBLIC.REXX(VAREXX)'",
            appKey: "test2",
        };
        try {
            await handler.process(params);
        } catch (e) {
            error = e;
        }
        expect(error).toBeUndefined();
        expect(startSpy).toHaveBeenCalledTimes(1);
        expect(startASSpaceSpy).toHaveBeenCalledTimes(1);
        expect(zosmfSpy).toHaveBeenCalledTimes(1);
    });
    it("should properly start TSO address space at an existing TSO address space", async () => {
        jest.spyOn(StartTso, "start").mockReturnValue(MOCK_START_RESPONSE);
        jest.spyOn(ZosmfRestClient, "postExpectJSON").mockReturnValue(
            MOCK_RESPONSE
        );

        const startSpy = jest.spyOn(AddressSpaceApps, "start");
        const startASSpaceSpy = jest.spyOn(StartTso, "start");
        const zosmfSpy = jest.spyOn(ZosmfRestClient, "postExpectJSON");
        const handler = new StartASAppHandler.default();
        const params = Object.assign({}, ...[EXISTING_AS_SPACE_PARAMS]);
        let error = undefined;
        params.arguments = {
            ...params.arguments,
            account: "izuacct",
            startup: "EXEC 'ZOWEUSER.PUBLIC.REXX(VAREXX)'",
            queueId: "983068",
            servletKey: "ZOWEUSER-123-aaaaaa",
            appKey: "test2",
        };
        try {
            await handler.process(params);
        } catch (e) {
            error = e;
        }
        expect(error).toBeUndefined();
        expect(startSpy).toHaveBeenCalledTimes(1);
        expect(startASSpaceSpy).toHaveBeenCalledTimes(0);
        expect(zosmfSpy).toHaveBeenCalledTimes(1);
    });
});
