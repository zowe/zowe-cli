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

import { IHandlerParameters, ImperativeError, Session, Imperative } from "@zowe/imperative";
import * as LogsHandler from "../../../../../src/zoslogs/list/logs/Logs.handler";
import * as LogsDefinition from "../../../../../src/zoslogs/list/logs/Logs.definition";
import { GetZosLog, IZosLogParms } from "@zowe/zos-logs-for-zowe-sdk";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

process.env.FORCE_COLOR = "0";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: {
        startTime: "2021-08-11T07:02:52.022Z",
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    },
    positionals: ["zos-logs", "list", "logs"],
    definition: LogsDefinition.LogsDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

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
