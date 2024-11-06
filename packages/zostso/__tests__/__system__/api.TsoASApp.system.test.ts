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

import { ImperativeError, Session } from "@zowe/imperative";
import { IIssueResponse, StartTso, StopTso } from "../../src";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { runCliScript } from "@zowe/cli-test-utils";
import { Upload, Create, CreateDataSetTypeEnum, Delete } from "../../../zosfiles/src";
import { getUniqueDatasetName } from "../../../../__tests__/__src__/TestUtils";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let systemProperties: ITestPropertiesSchema;
let REAL_SESSION: Session;
let ACCOUNT_NUMBER: string;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;

describe("All test", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_tso_as_app",
        });
        systemProperties = testEnvironment.systemTestProperties;
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        ACCOUNT_NUMBER = systemProperties.tso.account;
        defaultSystem = testEnvironment.systemTestProperties;
        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSTEST`);
        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
        await Upload.fileToDataset(REAL_SESSION, __dirname + "/__scripts__/start/test_app.rexx", dsname, {});
    });
    afterAll(async () => {
        await Delete.dataSet(REAL_SESSION, dsname);
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Start TSO app tests", () => {
        it("should create TSO address space and run an application instance at the created AS", async () => {
            let error: ImperativeError;

            const response = runCliScript(
                __dirname + "/__scripts__/start/start_app_new_as.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    dsname+"(TESTAPP)"
                ]
            );

            expect(response.stdout.toString()).toBeDefined();
            expect(response.stdout.toString()).toContain(
                "HELLOW exec processing has started"
            );
            expect(error).toBeUndefined();
            await StopTso.stop(
                REAL_SESSION,
                JSON.parse(response.stdout.toString()).data.servletKey
            );
        });

        it("should create TSO application instance on existing address space", async () => {
            dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSTEST`);
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
            await Upload.fileToDataset(REAL_SESSION, __dirname + "/__scripts__/start/test_app.rexx", dsname, {});

            const startResponse: IIssueResponse = {
                success: false,
                startResponse: await StartTso.start(
                    REAL_SESSION,
                    ACCOUNT_NUMBER
                ),
                startReady: false,
                zosmfResponse: null,
                commandResponse: null,
                stopResponse: null,
            };

            const response = runCliScript(
                __dirname + "/__scripts__/start/start_app_existing_as.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    startResponse.startResponse.zosmfTsoResponse.servletKey,
                    startResponse.startResponse.zosmfTsoResponse.queueID,
                    dsname+"(TESTAPP)"
                ]
            );
            expect(response.stdout.toString()).toBeDefined();
            expect(response.stdout.toString()).toContain(
                "HELLOW exec processing has started"
            );

            //Clean up test
            await StopTso.stop(
                REAL_SESSION,
                startResponse.startResponse.zosmfTsoResponse.servletKey
            );
        });
    });
    describe("Send TSO app tests", () => {
        it("Should send message to TSO address space app", async () => {
            const startResponse = runCliScript(
                __dirname + "/__scripts__/start/start_app_new_as.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    dsname+"(TESTAPP)"
                ]
            );

            const startServletkey = JSON.parse(startResponse.stdout.toString()).data.servletKey;

            const response = runCliScript(
                __dirname + "/__scripts__/send/send_tso_app.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    startServletkey,
                    "LONG 100",
                    "test2",
                ]
            );
            const response2 = runCliScript(
                __dirname + "/__scripts__/receive/receive_tso_app.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    startServletkey,
                    "test2",
                    "true",
                ]
            );
            const responses = response.stdout.toString() + response2.stdout.toString();

            expect(response.stdout.toString()).toBeDefined();
            expect(response2.stdout.toString()).toBeDefined();
            expect(responses).toContain(
                "Application input = LONG 100"
            );
            expect(responses).toContain("READY ");

            //Clean up test
            await StopTso.stop(REAL_SESSION, startServletkey);
        });
    });
    describe("Receive TSO app tests", () => {
        it("should pull from message queue but not reach the end (--no-rur)", async () => {
            const startResponse = runCliScript(
                __dirname + "/__scripts__/start/start_app_new_as.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    dsname+"(TESTAPP)"
                ]
            );
            const startServletkey = JSON.parse(startResponse.stdout.toString()).data.servletKey;
            runCliScript(
                __dirname + "/__scripts__/send/send_tso_app.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    startServletkey,
                    "LONG 4000", // Greater than 1000 such that receive will contain data.
                    "test2",
                ]
            );
            const response = runCliScript(
                __dirname + "/__scripts__/receive/receive_tso_app.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    startServletkey,
                    "test2",
                    "false",
                ]
            );
            expect(response.stdout.toString()).toContain("1");
            expect(response.stdout.toString()).not.toContain("3999");

            //Clean up test
            await StopTso.stop(REAL_SESSION, startServletkey);
        });
        it("should empty message queue using --rur flag", async () => {
            const startResponse = runCliScript(
                __dirname + "/__scripts__/start/start_app_new_as.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    dsname+"(TESTAPP)"
                ]
            );
            const startServletkey = JSON.parse(startResponse.stdout.toString()).data.servletKey;
            runCliScript(
                __dirname + "/__scripts__/send/send_tso_app.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    startServletkey,
                    "LONG 4000", // Greater than 1000 such that receive will contain data.
                    "test2",
                ]
            );
            const response = runCliScript(
                __dirname + "/__scripts__/receive/receive_tso_app.sh",
                testEnvironment,
                [
                    ACCOUNT_NUMBER,
                    defaultSystem.zosmf.host,
                    defaultSystem.zosmf.port,
                    defaultSystem.zosmf.user,
                    defaultSystem.zosmf.password,
                    defaultSystem.zosmf.rejectUnauthorized,
                    startServletkey,
                    "test2",
                    "true",
                ]
            );

            expect(response.stdout.toString()).toContain("1000");
            expect(response.stdout.toString()).toContain("2000");
            expect(response.stdout.toString()).toContain("3000");
            expect(response.stdout.toString()).toContain("4000");
            expect(response.stdout.toString()).toContain(
                "HELLOW exec processing is complete with rc = 0."
            );
            expect(response.stdout.toString()).toContain("READY");

            //Clean up test
            await StopTso.stop(REAL_SESSION, startServletkey);
        });
    });
});
