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

import {
    IStartStopResponse,
    IStartTsoParms,
    IZosmfTsoResponse,
    noAccountNumber,
    noSessionTso,
    noTsoStartInput,
    StartTso,
    TsoConstants
} from "../../../zostso";
import { Headers, Imperative, ImperativeError, Session } from "@brightside/imperative";
import { ZosmfHeaders, ZosmfRestClient } from "../../../rest";
import { inspect } from "util";
import { SendTso } from "../../src/api/SendTso";


const START_HEADERS: any[] = [ZosmfHeaders.X_CSRF_ZOSMF_HEADER, Headers.APPLICATION_JSON];

const ACCOUNT_NUMBER: string = "DEFAULT";

let RESOURCES_QUERY = `/zosmf/tsoApp/tso?`;
RESOURCES_QUERY += `${TsoConstants.PARM_ACCT}=DEFAULT&`;
RESOURCES_QUERY += `${TsoConstants.PARM_PROC}=${TsoConstants.DEFAULT_PROC}&${TsoConstants.PARM_CHSET}=${TsoConstants.DEFAULT_CHSET}&`;
RESOURCES_QUERY += `${TsoConstants.PARM_CPAGE}=${TsoConstants.DEFAULT_CPAGE}&${TsoConstants.PARM_ROWS}=${TsoConstants.DEFAULT_ROWS}&`;
RESOURCES_QUERY += `${TsoConstants.PARM_COLS}=${TsoConstants.DEFAULT_COLS}&${TsoConstants.PARM_RSIZE}=${TsoConstants.DEFAULT_RSIZE}`;

const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const FULL_START_PARMS: IStartTsoParms = {
    logonProcedure: "PROCEDURE",
    characterSet: "CHARACTER SET",
    codePage: "CODE PAGE",
    rows: "ROWS",
    columns: "COLUMNS",
    regionSize: "REGION SIZE"
};

const HALF_EMPTY_PARMS: IStartTsoParms = {
    logonProcedure: "PROCEDURE",
    codePage: "CODE PAGE",
    columns: "COLUMNS"
};

const EMPTY_START_PARMS: IStartTsoParms = {};


const SET_DEFAULT_PARMS_FULL: IStartTsoParms = {
    logonProcedure: "PROCEDURE",
    characterSet: "CHARACTER SET",
    codePage: "CODE PAGE",
    rows: "ROWS",
    columns: "COLUMNS",
    regionSize: "REGION SIZE"
};

const SET_DEFAULT_PARMS_HALF_EMPTY: IStartTsoParms = {
    logonProcedure: "PROCEDURE",
    characterSet: TsoConstants.DEFAULT_CHSET,
    codePage: "CODE PAGE",
    rows: TsoConstants.DEFAULT_ROWS,
    columns: "COLUMNS",
    regionSize: TsoConstants.DEFAULT_RSIZE
};

const SET_DEFAULT_PARMS_EMPTY: IStartTsoParms = {
    logonProcedure: TsoConstants.DEFAULT_PROC,
    characterSet: TsoConstants.DEFAULT_CHSET,
    codePage: TsoConstants.DEFAULT_CPAGE,
    rows: TsoConstants.DEFAULT_ROWS,
    columns: TsoConstants.DEFAULT_COLS,
    regionSize: TsoConstants.DEFAULT_RSIZE
};

const PRETEND_REQUIRED_PARMS: IStartTsoParms = {
    logonProcedure: "IZUFPROC",
    characterSet: "697",
    codePage: "1047",
    rows: "24",
    columns: "80",
    regionSize: "4096",
    account: "DEFAULT"
};

const ZOSMF_RESPONSE: IZosmfTsoResponse = {
    servletKey: "ZOSMFAD-SYS2-55-aaakaaac",
    queueID: "4",
    ver: "0100",
    reused: false,
    timeout: false,
    sessionID: "0x37",
    tsoData: [{
        "TSO MESSAGE": {
            VERSION: "0100",
            DATA: "ZOSMFAD LOGON IN PROGRESS AT 01:12:04 ON JULY 17, 2017"
        }
    }],
};

const PRETEND_START_RESPONSE: IStartStopResponse = {
    success: true,
    zosmfTsoResponse: ZOSMF_RESPONSE,
    servletKey: ZOSMF_RESPONSE.servletKey
};

function expectZosmfResponseSucceeded(response: IZosmfTsoResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: IZosmfTsoResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

function expectStartResponseSucceeded(response: IStartStopResponse, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
    expect(response).toEqual(PRETEND_START_RESPONSE);
}

function expectStartResponseFailed(response: IStartStopResponse, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("StartTso setDefaultAddressSpaceParams", () => {
    it("should return object with provided options, not using default parameters", () => {
        const fullParms = StartTso.setDefaultAddressSpaceParams(FULL_START_PARMS, ACCOUNT_NUMBER);

        expect(fullParms).toBeDefined();
        expect(fullParms.logonProcedure).toEqual(SET_DEFAULT_PARMS_FULL.logonProcedure);
        expect(fullParms.characterSet).toEqual(SET_DEFAULT_PARMS_FULL.characterSet);
        expect(fullParms.codePage).toEqual(SET_DEFAULT_PARMS_FULL.codePage);
        expect(fullParms.rows).toEqual(SET_DEFAULT_PARMS_FULL.rows);
        expect(fullParms.columns).toEqual(SET_DEFAULT_PARMS_FULL.columns);
        expect(fullParms.account).toEqual(ACCOUNT_NUMBER);
    });

    it("should return object with provided options if something left it uses default parameters", () => {
        const halfParms = StartTso.setDefaultAddressSpaceParams(HALF_EMPTY_PARMS, ACCOUNT_NUMBER);

        expect(halfParms).toBeDefined();
        expect(halfParms.logonProcedure).toEqual(SET_DEFAULT_PARMS_HALF_EMPTY.logonProcedure);
        expect(halfParms.characterSet).toEqual(SET_DEFAULT_PARMS_HALF_EMPTY.characterSet);
        expect(halfParms.codePage).toEqual(SET_DEFAULT_PARMS_HALF_EMPTY.codePage);
        expect(halfParms.rows).toEqual(SET_DEFAULT_PARMS_HALF_EMPTY.rows);
        expect(halfParms.columns).toEqual(SET_DEFAULT_PARMS_HALF_EMPTY.columns);
        expect(halfParms.account).toEqual(ACCOUNT_NUMBER);
    });

    it("should return object with default parameters and account number key", () => {
        const emptyParms = StartTso.setDefaultAddressSpaceParams(EMPTY_START_PARMS, ACCOUNT_NUMBER);

        expect(emptyParms).toBeDefined();
        expect(emptyParms.logonProcedure).toEqual(SET_DEFAULT_PARMS_EMPTY.logonProcedure);
        expect(emptyParms.characterSet).toEqual(SET_DEFAULT_PARMS_EMPTY.characterSet);
        expect(emptyParms.codePage).toEqual(SET_DEFAULT_PARMS_EMPTY.codePage);
        expect(emptyParms.rows).toEqual(SET_DEFAULT_PARMS_EMPTY.rows);
        expect(emptyParms.columns).toEqual(SET_DEFAULT_PARMS_EMPTY.columns);
        expect(emptyParms.account).toEqual(ACCOUNT_NUMBER);
    });

});

describe("StartTso getResourcesQuery", () => {
    it("should return resources query from provided parameters", () => {
        const resourcesQuery = StartTso.getResourcesQuery(PRETEND_REQUIRED_PARMS);
        Imperative.console.info(`RESULT IS ${resourcesQuery}`);
        Imperative.console.info(`TEST IS ${RESOURCES_QUERY}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(RESOURCES_QUERY);
    });
});


describe("StartTso startCommon", () => {
    it("should succeed with correct parameters", async () => {
        (ZosmfRestClient.postExpectJSON as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });
        let error: ImperativeError;
        let response: IZosmfTsoResponse;
        try {
            response = await StartTso.startCommon(PRETEND_SESSION, PRETEND_REQUIRED_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, RESOURCES_QUERY,
            START_HEADERS);
        expectZosmfResponseSucceeded(response, error);
    });

    it("should throw an error if session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IZosmfTsoResponse;
        try {
            response = await StartTso.startCommon(undefined, PRETEND_REQUIRED_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noSessionTso.message);
    });

    it("should throw an error if z/OSMF parameters are undefined", async () => {
        let error: ImperativeError;
        let response: IZosmfTsoResponse;
        try {
            response = await StartTso.startCommon(PRETEND_SESSION, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }
        expectZosmfResponseFailed(response, error, noTsoStartInput.message);
    });

});

describe("StartTso start", () => {
    it("should succeed with all correctly provided parameters", async () => {
        (StartTso.startCommon as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });
        (SendTso.getAllResponses as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IStartStopResponse;

        try {
            response = await StartTso.start(PRETEND_SESSION, ACCOUNT_NUMBER, PRETEND_REQUIRED_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }

        expect((StartTso.startCommon as any)).toHaveBeenCalledTimes(1);
        expect((StartTso.startCommon as any)).toHaveBeenCalledWith(PRETEND_SESSION, PRETEND_REQUIRED_PARMS);
        expectStartResponseSucceeded(response, error);
    });

    it("should throw an error if session parameter is undefined", async () => {
        (StartTso.startCommon as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });

        let error: ImperativeError;
        let response: IStartStopResponse;

        try {
            response = await StartTso.start(undefined, ACCOUNT_NUMBER, PRETEND_REQUIRED_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }

        expectStartResponseFailed(response, error, noSessionTso.message);
    });

    it("should throw an error if account number parameter is undefined", async () => {
        let error: ImperativeError;
        let response: IStartStopResponse;

        try {
            response = await StartTso.start(PRETEND_SESSION, undefined, PRETEND_REQUIRED_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }

        expectStartResponseFailed(response, error, noAccountNumber.message);
    });

    it("should throw an error if account number parameter is empty string", async () => {
        let error: ImperativeError;
        let response: IStartStopResponse;

        try {
            response = await StartTso.start(PRETEND_SESSION, "", PRETEND_REQUIRED_PARMS);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }

        expectStartResponseFailed(response, error, noAccountNumber.message);
    });

    it("should succeed even if z/OSMF parameters are undefined, it will use default parameters", async () => {
        let error: ImperativeError;
        let response: IStartStopResponse;
        (StartTso.startCommon as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });
        (SendTso.getAllResponses as any) = jest.fn<object>((): Promise<object> => {
            return new Promise((resolve) => {
                process.nextTick(() => {
                    resolve(ZOSMF_RESPONSE);
                });
            });
        });
        try {
            response = await StartTso.start(PRETEND_SESSION, ACCOUNT_NUMBER, undefined);
            Imperative.console.info(`Response ${inspect(response)}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${inspect(error)}`);
        }

        expect((StartTso.startCommon as any)).toHaveBeenCalledTimes(1);
        expect((StartTso.startCommon as any)).toHaveBeenCalledWith(PRETEND_SESSION, PRETEND_REQUIRED_PARMS);
        expectStartResponseSucceeded(response, error);
    });

});

