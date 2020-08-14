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

import { PingTsoData } from "../../../../../../../packages/zostso/__tests__/__resources__/PingTsoData";

jest.mock("../../../../src/PingTso");
import { SendTso } from "../../../../../../zostso";
import { CommandProfiles, IHandlerParameters, ImperativeError, IProfile } from "@zowe/imperative";
import * as SendToAddressSpace from "../../../../src/send/address_space/SendToAddressSpace.handler";
import { SendToAddressSpaceCommandDefinition } from "../../../../src/send/address_space/SendToAddressSpace.definition";

const ZOSMF_PROF_OPTS = {
    host: "somewhere.com",
    port: "43443",
    user: "someone",
    password: "somesecret"
};

const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set(
    "zosmf", [{
        name: "zosmf",
        type: "zosmf",
        ...ZOSMF_PROF_OPTS
    }]
);
const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zos-tso", "ping", "address-space"]
    },
    positionals: ["zos-tso", "ping", "address-space"],
    response: {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                expect(setMsgArgs).toMatchSnapshot();
            }),
            setObj: jest.fn((setObjArgs) => {
                expect(setObjArgs).toMatchSnapshot();
            }),
            setExitCode: jest.fn()
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
            output: jest.fn((parms) => {
                expect(parms).toMatchSnapshot();
            })
        }
    },
    definition: SendToAddressSpaceCommandDefinition,
    fullDefinition: SendToAddressSpaceCommandDefinition,
    profiles: PROFILES
};

describe("ping address-space handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to ping address-space", async () => {
        SendTso.sendDataToTSOCollect = jest.fn((session, servletKey, data) => {
            return PingTsoData.SAMPLE_PING_RESPONSE;
        });
        const handler = new SendToAddressSpace.default();
        let params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        const args = {arguments: ZOSMF_PROF_OPTS};
        params = {...params,...args};
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
        let params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        const args = {arguments: ZOSMF_PROF_OPTS};
        params = {...params,...args};
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
