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

import { GetLogsData } from "../../../__resources__/GetLogsData";

import { CommandProfiles, IHandlerParameters, ImperativeError, IProfile, Session, Imperative } from "@zowe/imperative";
import * as LogsHandler from "../../../../../src/zoslogs/list/logs/Logs.handler";
import * as LogsDefinition from "../../../../../src/zoslogs/list/logs/Logs.definition";
import { GetZosLog, IZosLogParms } from "@zowe/zos-logs-for-zowe-sdk";

process.env.FORCE_COLOR = "0";

const ZOSMF_PROF_OPTS = {
    host: "somewhere.com",
    port: "43443",
    user: "someone",
    password: "somesecret"
};

const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set("zosmf", [
    {
        name: "zosmf",
        type: "zosmf",
        ...ZOSMF_PROF_OPTS
    }
]);
const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);

const DEFAULT_PARAMETERS: IHandlerParameters = {
    arguments: {
        $0: "zowe",
        _: ["zos-logs", "get"],
        startTime: "2021-08-11T07:02:52.022Z",
        ...ZOSMF_PROF_OPTS
    },
    positionals: [],
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
                expect(logs.toString()).toMatchSnapshot();
            }),
            error: jest.fn((errors) => {
                expect(errors.toString()).toMatchSnapshot();
            }),
            errorHeader: jest.fn(() => undefined),
            prompt: jest.fn()
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
    definition: LogsDefinition.LogsDefinition,
    fullDefinition: LogsDefinition.LogsDefinition,
    profiles: PROFILES
};
describe("get logs handler tests", () => {
    it("should be able to get logs using defaults", async () => {
        let passedSession: Session;
        let passedParms: IZosLogParms;
        GetZosLog.getZosLog = jest.fn((session, parms) => {
            passedSession = session;
            passedParms = parms;
            return GetLogsData.SAMPLE_RESP_DATA;
        });
        const handler = new LogsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        await handler.process(params);
        expect(GetZosLog.getZosLog).toHaveBeenCalledTimes(1);
        expect(GetZosLog.getZosLog).toHaveBeenCalledWith(passedSession, passedParms);
    });

    it("should be able to get logs using defaults to get empty items", async () => {
        let passedSession: Session;
        let passedParms: IZosLogParms;
        GetZosLog.getZosLog = jest.fn((session, parms) => {
            passedSession = session;
            passedParms = parms;
            return GetLogsData.SAMPLE_RESP_DATA_EMPTY;
        });
        const handler = new LogsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        await handler.process(params);
        expect(GetZosLog.getZosLog).toHaveBeenCalledTimes(1);
        expect(GetZosLog.getZosLog).toHaveBeenCalledWith(passedSession, passedParms);
    });

    it("should be able to get logs using all options", async () => {
        let passedSession: Session;
        let passedParms: IZosLogParms;
        GetZosLog.getZosLog = jest.fn((session, parms) => {
            passedSession = session;
            passedParms = parms;
            return GetLogsData.SAMPLE_RESP_DATA;
        });
        const handler = new LogsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.startTime = "1626912000000";
        params.arguments.range = "5m";
        params.arguments.direction = "backward";
        Imperative.console.info(params.arguments);
        await handler.process(params);
        expect(GetZosLog.getZosLog).toHaveBeenCalledTimes(1);
        expect(GetZosLog.getZosLog).toHaveBeenCalledWith(passedSession, passedParms);
    });

    it("should not transform an error from the zosmf rest client", async () => {
        const failMessage = "You fail";
        let error;
        GetZosLog.getZosLog = jest.fn(async (session, parms) => {
            throw new ImperativeError({ msg: failMessage });
        });
        const handler = new LogsHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetZosLog.getZosLog).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
