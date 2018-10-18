/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { CheckStatus } from "../../../../../zosmf";
import { CommandProfiles, ICommandHandler, IHandlerParameters, IProfile } from "@brightside/imperative";
import CmdHandler from "../../../../src/cli/check/status/Status.handler";
import * as cmdDef from "../../../../src/cli/check/status/Status.definition";

jest.mock("../../../../src/api/methods/CheckStatus");

const ZOSMF_PROF_OPTS = {
    host: "somewhere.com",
    port: "43443",
    user: "someone",
    pass: "somesecret"
};

const goodProfileMap = new Map<string, IProfile[]>();
goodProfileMap.set(
    "zosmf", [{
        name: "zosmf",
        type: "zosmf",
        ...ZOSMF_PROF_OPTS
    }]
);
const goodProfiles: CommandProfiles = new CommandProfiles(goodProfileMap);

const goodCmdParms: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zosmf", "check", "status"],
        ...ZOSMF_PROF_OPTS
    },
    response: {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                expect(setMsgArgs).toMatchSnapshot();
            }),
            setObj: jest.fn((setObjArgs) => {
                expect(setObjArgs).toMatchSnapshot();
            })
        },
        console: {
            log: jest.fn((logs) => {
                expect(logs).toMatchSnapshot();
            }),
            error: jest.fn((errors) => {
                expect(errors).toMatchSnapshot();
            }),
            errorHeader: jest.fn(() => undefined)
        },
        progress: {
            startBar: jest.fn((parms) => undefined),
            endBar: jest.fn(() => undefined)
        },
        format: {
            output: jest.fn((parms) => undefined)
        }
    },
    definition: cmdDef.StatusDefinition,
    fullDefinition: cmdDef.StatusDefinition,
    profiles: goodProfiles
};

let checkStatHandler: ICommandHandler = null;

describe("check status behavior", () => {
    beforeEach(() => {
        CheckStatus.getZosmfInfo = jest.fn((session, servletKey) => {
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

    it("should display an error when getZosmfInfo throws an exception", async () => {
        const parmsToUse = Object.assign({}, ...[goodCmdParms]);
        CheckStatus.getZosmfInfo = jest.fn((session, servletKey) => {
            throw new Error("Mock GetInfo Error");
        });
        parmsToUse.response.console.error = jest.fn((errors) => {
            expect(errors).toMatchSnapshot();
            expect(errors).toContain("Mock GetInfo Error");
        });

        await checkStatHandler.process(parmsToUse);
        expect(CheckStatus.getZosmfInfo).toHaveBeenCalledTimes(1);
    });
});
