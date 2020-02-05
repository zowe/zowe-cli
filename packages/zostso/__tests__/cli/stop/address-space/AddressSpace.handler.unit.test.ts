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

jest.mock("../../../../src/api/StopTso");
import { StopTso } from "../../../../../zostso";
import { StopTsoData } from "../../../__resources__/api/StopTsoData";
import { CommandProfiles, IHandlerParameters, ImperativeError, IProfile } from "@zowe/imperative";
import * as AddressSpaceHandler from "../../../../src/cli/stop/address-space/AddressSpace.handler";
import * as AddressSpaceDefinition from "../../../../src/cli/stop/address-space/AddressSpace.definition";

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
        _: ["zos-tso", "stop", "address-space"]
    },
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
    definition: AddressSpaceDefinition.AddressSpaceDefinition,
    fullDefinition: AddressSpaceDefinition.AddressSpaceDefinition,
    profiles: PROFILES
};

describe("stop address-space handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to stop address-space", async () => {
        StopTso.stop = jest.fn((session, servletKey) => {
            return StopTsoData.SAMPLE_STOP_RESPONSE;
        });
        const handler = new AddressSpaceHandler.default();
        let  params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        const args = {arguments: ZOSMF_PROF_OPTS};
        params = {...params,...args};
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
        let params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        const args = {arguments: ZOSMF_PROF_OPTS};
        params = {...params,...args};
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
