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

import { inspect } from "util";
import { ZosmfRestClient, ZosmfHeaders } from "@zowe/core-for-zowe-sdk";
import { Session, ImperativeError, Imperative } from "@zowe/imperative";
import { IZosLogType, IZosLogParms, GetZosLog, noSessionMessage } from "../../src/";
import { GetZosLogsData } from "../__resources__/GetZosLogData";
const PRETEND_SESSION: Session = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const COMMAND_PARAMS_FULL: IZosLogParms = { startTime: "2021-08-11T07:02:52.022Z", direction: "forward", range: "1m" };
const COMMAND_PARAMS_FULL_PR: IZosLogParms = { startTime: "2021-08-11T07:02:52.022Z", direction: "forward", range: "1m", processResponses: false };
const EXPECTED_PATH_FULL: string = "/zosmf/restconsoles/v1/log?time=2021-08-11T07:02:52.022Z&direction=forward&timeRange=1m&";

const COMMAND_PARAMS_NUMBER: IZosLogParms = { startTime: "1626912000000" };
const EXPECTED_PATH_NUMBER: string = "/zosmf/restconsoles/v1/log?time=2021-07-22T00:00:00.000Z&";

const COMMAND_PARAMS_EMPTY: IZosLogParms = {};
const EXPECTED_PATH_EMPTY: string = "/zosmf/restconsoles/v1/log?";

function expectZosmfResponseFailed(response: IZosLogType, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("GetZosLog getResourcePath", () => {
    it("should successfully build a query from passed parameters", () => {
        const resourcesQuery = GetZosLog.getResourcePath(COMMAND_PARAMS_FULL);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(EXPECTED_PATH_FULL);
    });
    it("should successfully build a query from passed parameters with number startTime", () => {
        const resourcesQuery = GetZosLog.getResourcePath(COMMAND_PARAMS_NUMBER);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(EXPECTED_PATH_NUMBER);
    });
    it("should successfully build a query from passed empty parameters", () => {
        const resourcesQuery = GetZosLog.getResourcePath(COMMAND_PARAMS_EMPTY);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(EXPECTED_PATH_EMPTY);
    });
});

describe("GetZosLog getZosLog", () => {
    it("should succeed and return logs", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(GetZosLogsData.SAMPLE_RESP_DATA);
                });
            });
        });

        let error: ImperativeError;
        let response: IZosLogType;
        try {
            response = await GetZosLog.getZosLog(PRETEND_SESSION, COMMAND_PARAMS_FULL);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect(ZosmfRestClient.getExpectJSON as any).toHaveBeenCalledTimes(1);
        expect(ZosmfRestClient.getExpectJSON as any).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_PATH_FULL, [ZosmfHeaders.X_CSRF_ZOSMF_HEADER]);
        expect(response.totalitems).toBeGreaterThan(0);
    });

    it("should succeed and return unprocessed logs", async () => {
        (ZosmfRestClient.getExpectJSON as any) = jest.fn((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(GetZosLogsData.SAMPLE_RESP_DATA);
                });
            });
        });

        let error: ImperativeError;
        let response: IZosLogType;
        try {
            response = await GetZosLog.getZosLog(PRETEND_SESSION, COMMAND_PARAMS_FULL_PR);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect(ZosmfRestClient.getExpectJSON as any).toHaveBeenCalledTimes(1);
        expect(ZosmfRestClient.getExpectJSON as any).toHaveBeenCalledWith(PRETEND_SESSION, EXPECTED_PATH_FULL, [ZosmfHeaders.X_CSRF_ZOSMF_HEADER]);
        expect(response.totalitems).toBeGreaterThan(0);
    });

    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IZosLogType;
        try {
            response = await GetZosLog.getZosLog(undefined, COMMAND_PARAMS_FULL);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionMessage.message);
    });
});
