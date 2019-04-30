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

import { CheckStatus, ListDefinedSystems } from "../../../../../zosmf";
import { ICommandHandler, IHandlerParameters } from "@zowe/imperative";
import CmdHandler from "../../../../src/cli/list/systems/Systems.handler";
import * as cmdDef from "../../../../src/cli/list/systems/Systems.definition";
import { getMockedResponse, UNIT_TEST_ZOSMF_PROF_OPTS, UNIT_TEST_PROFILES_ZOSMF } from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

jest.mock("../../../../src/api/methods/ListDefinedSystems");

const goodCmdParms: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zosmf", "check", "status"],
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    },
    response: getMockedResponse(),
    definition: cmdDef.SystemsDefinition,
    fullDefinition: cmdDef.SystemsDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
};

let listSystemsHandler: ICommandHandler = null;

describe("check status behavior", () => {
    beforeEach(() => {
        ListDefinedSystems.listDefinedSystems = jest.fn((session, servletKey) => {
            return {
                numRows: "1",
                items: [
                    {
                        systemNickName: "SYS1",
                        systemName: "SYS1_001",
                        url: "some.zosmf.url",
                    }
                ]
            };
        });

        listSystemsHandler = new CmdHandler();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should display system properties", async () => {
        const parmsToUse = Object.assign({}, ...[goodCmdParms]);
        parmsToUse.response.console.log = jest.fn((logs) => {
            expect(logs).toMatchSnapshot();
            expect(logs).toContain("Number of retreived system definitions:");
        });

        await listSystemsHandler.process(parmsToUse);
        expect(ListDefinedSystems.listDefinedSystems).toHaveBeenCalledTimes(1);
    });

    it("should return a json object with the right properties", async () => {
        const parmsToUse = Object.assign({}, ...[goodCmdParms]);
        parmsToUse.response.data.setObj = jest.fn((setObjArgs) => {
            expect(setObjArgs).toMatchSnapshot();
            expect(setObjArgs.numRows).toBe("1");
            expect(setObjArgs.items[0].systemNickName).toBe("SYS1");
            expect(setObjArgs.items[0].systemName).toBe("SYS1_001");
            expect(setObjArgs.items[0].url).toBe("some.zosmf.url");
        });

        await listSystemsHandler.process(parmsToUse);
        expect(ListDefinedSystems.listDefinedSystems).toHaveBeenCalledTimes(1);
    });

    it("should pass the rest client error to the command processor (no transformation)", async () => {
        const parmsToUse = Object.assign({}, ...[goodCmdParms]);
        ListDefinedSystems.listDefinedSystems = jest.fn((session, servletKey) => {
            throw new Error("Mock GetInfo Error");
        });
        parmsToUse.response.console.error = jest.fn((errors) => {
            expect(errors).toMatchSnapshot();
            expect(errors).toContain("Mock GetInfo Error");
        });

        let error;
        try {
            await listSystemsHandler.process(parmsToUse);
        } catch (err) {
            error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toMatchSnapshot();
        expect(ListDefinedSystems.listDefinedSystems).toHaveBeenCalledTimes(1);
    });
});
