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

/* eslint-disable deprecation/deprecation */
import { ImperativeError, Session } from "@zowe/imperative";
import { IIssueResponse, IIssueTsoParms, IssueTso, IStartTsoParms } from "../../src";
import * as fs from "fs";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { IIssueTsoCmdOpts } from "../../src/doc/input/IIssueTsoCmdOpts";
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let systemProperties: ITestPropertiesSchema;
let REAL_SESSION: Session;
let ACCOUNT_NUMBER: string;

let START_PARAMS: IStartTsoParms;
let ISSUE_PARAMS: IIssueTsoParms;
let AS_OPTIONS: IIssueTsoCmdOpts;
describe("IssueTso.issueTsoCommand", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_tso_issue"
        });
        systemProperties = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ACCOUNT_NUMBER = systemProperties.tso.account;

        START_PARAMS = {
            logonProcedure: "IZUFPROC",
            characterSet: "697",
            codePage: "1047",
            rows: "24",
            columns: "80",
            regionSize: "4096",
            account: ACCOUNT_NUMBER
        };
        ISSUE_PARAMS = {
            command: "time",
            accountNumber: ACCOUNT_NUMBER,
            startParams: START_PARAMS
        };
        AS_OPTIONS = {
            addressSpaceOptions: START_PARAMS
        };
    });
    afterAll(async () => {
        AS_OPTIONS = {
            addressSpaceOptions: START_PARAMS
        };
    });
    it("should display time", async () => {
        let error: ImperativeError;
        let response: IIssueResponse;
        try {
            response = await IssueTso.issueTsoCommand(REAL_SESSION, ACCOUNT_NUMBER, "time");

        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        const regex = fs.readFileSync(__dirname + "/__regex__/d_time.regex").toString();
        expect(new RegExp(regex, "g").test(response.commandResponse.toString())).toBe(true);
    });
    it("should display time (with params)", async () => {
        let error: ImperativeError;
        let response: IIssueResponse;
        try {
            response = await IssueTso.issueTsoCommandCommon(REAL_SESSION, ISSUE_PARAMS);

        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        const regex = fs.readFileSync(__dirname + "/__regex__/d_time.regex").toString();
        expect(new RegExp(regex, "g").test(response.commandResponse.toString())).toBe(true);
    });
    it("should display time - issueTsoCmd() - new API - pass", async () => {
        let error: ImperativeError;
        let response: IIssueResponse;
        try {
            response = await IssueTso.issueTsoCmd(REAL_SESSION, "TIME", AS_OPTIONS);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
        expect(response).toBeDefined();
        const regex = fs.readFileSync(__dirname + "/__regex__/d_time.regex").toString();
        expect(new RegExp(regex, "g").test(response.commandResponse.toString())).toBe(true);
    });
    it("should fail - issueTsoCmd() - 404 error", async () => {
        REAL_SESSION.ISession.basePath = "/bad/path/to/nothing";
        let error: ImperativeError;
        let response: IIssueResponse;
        try {
            response = await IssueTso.issueTsoCmd(REAL_SESSION, "TIME", AS_OPTIONS);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeDefined();
        expect(response).toBeUndefined();
    });
});
