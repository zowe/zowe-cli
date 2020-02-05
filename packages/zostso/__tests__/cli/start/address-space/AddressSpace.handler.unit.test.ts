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

jest.mock("../../../../src/api/StartTso");
import { IStartTsoParms, StartTso } from "../../../../../zostso";
import { StartTsoData } from "../../../__resources__/api/StartTsoData";
import { CommandProfiles, IHandlerParameters, ImperativeError, IProfile } from "@zowe/imperative";
import * as AddressSpaceHandler from "../../../../src/cli/start/address-space/AddressSpace.handler";
import * as AddressSpaceDefinition from "../../../../src/cli/start/address-space/AddressSpace.definition";

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

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zos-tso", "start", "address-space"]
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

describe("start address-space handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to start address-space", async () => {
        StartTso.start = jest.fn((session, commandParms, startParms) => {
            expect(startParms).toBeDefined();
            expect(startParms).toMatchSnapshot();
            return StartTsoData.SAMPLE_START_RESPONSE;
        });
        const handler = new AddressSpaceHandler.default();
        let params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        const args = {...ZOSMF_PROF_OPTS, ...TSO_PROF_OPTS};
        params = { ...params, arguments: args};

        await handler.process(params);
        expect(StartTso.start).toHaveBeenCalledTimes(1);
    });

    it("should be able respond with error message, if required z/OSMF parameters were not passed", async () => {
        const handler = new AddressSpaceHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
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
        StartTso.start = jest.fn((session, commandParms) => {
            return {
                success: false,
                failureResponse: {
                    message: failure
                }
            };
        });
        const handler = new AddressSpaceHandler.default();
        let params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        const args = {...ZOSMF_PROF_OPTS, ...TSO_PROF_OPTS};
        params = { ...params, arguments: args};
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
