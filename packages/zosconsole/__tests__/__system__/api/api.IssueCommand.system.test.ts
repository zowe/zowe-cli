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
    CollectCommand,
    ConsoleConstants,
    ICollectParms,
    IConsoleResponse,
    IIssueParms,
    IssueCommand,
    IZosmfIssueParms,
    IZosmfIssueResponse
} from "../../../../zosconsole";
import * as fs from "fs";
import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import { inspect } from "util";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";

/**
 * These tests runs on mainframe, be pretared to provide proper credentials.
 * There tests are long running tests, expecially IssueAndCollect. It tries to collect response of the command in few attempts,
 * with 1 second delay between attempts.
 *
 * Be ready to run these tests separately, exclude them from "dev" unit tests suites.
 */

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let REAL_SESSION: Session;
const PRETEND_SESSION = new Session({
    user: "user",
    password: "password",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false,
});

const IPL_CMD_ZOSMF_PARMS: IZosmfIssueParms = {
    cmd: "D IPLINFO"
};

const ISSUE_PARMS: IIssueParms = {
    command: "D IPLINFO"
};

const COLLECT_PARMS: ICollectParms = {
    followUpAttempts: 1,
    waitToCollect: 1,
    processResponses: true,
    commandResponseKey: ""
};

const INCORRECT_PARMS: string = "cmd: D IPLINFO";

describe("IssueCommand (integration)", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_submit_jobs"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });
    });

    it("issueCommon should succeed with correct parameters.", async () => {
        let error: ImperativeError;
        let response: IConsoleResponse;

        try {
            response = await IssueCommand.issue(REAL_SESSION, ISSUE_PARMS);
            Imperative.console.info("Response: " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error: " + inspect(error));
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();

        const regex: RegExp = new RegExp(fs.readFileSync("./packages/zosconsole/__tests__/__regex__/d_iplinfo_regex.regex").toString(), "g");
        const result: any = regex.exec(response.commandResponse);
        expect(result).not.toBeNull();
    });


    it("issueCommon should fail with incorrect parameters.", async () => {
        let error: ImperativeError;
        let response: IZosmfIssueResponse;

        try {
            response = await IssueCommand.issueCommon(PRETEND_SESSION, ConsoleConstants.RES_DEF_CN, ISSUE_PARMS as any);
            Imperative.console.info("Response: " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error: " + inspect(error));
        }
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
    });
});

describe("CollectCommand (integration)", () => {

    it("collectCommon should succeed with correct parameters.", async () => {
        let error: ImperativeError;
        let issueResponse: IZosmfIssueResponse;
        let collectResponse: IZosmfIssueResponse;

        try {
            issueResponse = await IssueCommand.issueCommon(REAL_SESSION, ConsoleConstants.RES_DEF_CN, IPL_CMD_ZOSMF_PARMS);
            Imperative.console.info("Issue response " + inspect(issueResponse));
            collectResponse = await CollectCommand.collectCommon(REAL_SESSION, ConsoleConstants.RES_DEF_CN, issueResponse["cmd-response-key"]);
            Imperative.console.info("Collect response: " + inspect(collectResponse));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error: " + inspect(error));
        }
        expect(collectResponse).toBeDefined();
        expect(error).not.toBeDefined();
    });


    it("collectCommon should fail with incorrect parameters.", async () => {
        let error: ImperativeError;
        let issueResponse: IZosmfIssueResponse;
        let collectResponse: IZosmfIssueResponse;

        try {
            issueResponse = await IssueCommand.issueCommon(REAL_SESSION, ConsoleConstants.RES_DEF_CN, INCORRECT_PARMS as any);
            Imperative.console.info("Issue response " + inspect(issueResponse));
            collectResponse = await CollectCommand.collectCommon(PRETEND_SESSION, ConsoleConstants.RES_DEF_CN, issueResponse["cmd-response-key"]);
            Imperative.console.info("Collect response " + inspect(collectResponse));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error: " + inspect(error));
        }
        expect(collectResponse).not.toBeDefined();
        expect(error).toBeDefined();
    });

    it("collect should succeed with correct parameters.", async () => {
        let error: ImperativeError;
        let issueResponse: IConsoleResponse;
        let collectResponse: IConsoleResponse;

        try {
            issueResponse = await IssueCommand.issue(REAL_SESSION, ISSUE_PARMS);
            Imperative.console.info("Issue response " + inspect(issueResponse));
            collectResponse = await CollectCommand.collect(REAL_SESSION,
                {
                    commandResponseKey: issueResponse.lastResponseKey,
                    followUpAttempts: 1,
                    waitToCollect: 3
                });
            Imperative.console.info("Collect response " + inspect(collectResponse));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error: " + inspect(error));
        }
        expect(collectResponse).toBeDefined();
        expect(error).not.toBeDefined();
    });
});

describe("IssueAndCollect (integration)", () => {

    it("issueAndCollect should succeed with correct parameters", async () => {
        let error: ImperativeError;
        let response: IConsoleResponse;

        try {
            response = await IssueCommand.issueAndCollect(REAL_SESSION, ISSUE_PARMS, COLLECT_PARMS);
            Imperative.console.info("Response " + inspect(response));
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info("Error: " + inspect(error));
        }
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
        expect(response.zosmfResponse.length).toBe(2);
    });
});
