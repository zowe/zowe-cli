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

import { ImperativeError, Session } from "@brightside/imperative";
import { IIssueResponse, IIssueTsoParms, IssueTso, IStartTsoParms } from "../../../../zostso";
import * as fs from "fs";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";


let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let REAL_SESSION: Session;
let ACCOUNT_NUMBER: string;

let START_PARAMS: IStartTsoParms;
let ISSUE_PARAMS: IIssueTsoParms;

describe("IssueTso.issueTsoCommand", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
                        testName: "zos_tso_issue"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ACCOUNT_NUMBER = defaultSystem.tso.account;

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
});
