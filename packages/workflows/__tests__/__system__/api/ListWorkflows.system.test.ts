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

import { CreateWorkflow, DeleteWorkflow, ListWorkflows } from "../../../src";
import { Imperative, ImperativeError, Session } from "@zowe/imperative";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ICreatedWorkflow } from "../../../src/doc/ICreatedWorkflow";
import { inspect } from "util";
import { getUniqueDatasetName } from "../../../../../__tests__/__src__/TestUtils";
import { wrongString } from "../../../src/WorkflowConstants";
import { IWorkflowsInfo } from "../../../src/doc/IWorkflowsInfo";
import { Upload, ZosFilesConstants } from "@zowe/zos-files-for-zowe-sdk";
import { ZosmfRestClient, nozOSMFVersion, noSession } from "@zowe/core-for-zowe-sdk";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let definitionFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;

const vendor = "Broadcom";
const category = "General";
const statusName = "in-progress";
const badString = "Ba?d";
const badString1 = "Ba&d";
const workflow = __dirname + "/../testfiles/demo.xml";


function expectZosmfResponseSucceeded(response: IWorkflowsInfo, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: ICreatedWorkflow, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

describe("List workflows", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "create_workflow"
        });
        defaultSystem = testEnvironment.systemTestProperties;
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
        definitionFile = `${defaultSystem.unix.testdir.replace(/\/{2,}/g, "/")}/${getUniqueDatasetName(owner)}.xml`;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Success Scenarios", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUssFile(REAL_SESSION, workflow, definitionFile, { binary: true });
        });
        afterAll(async () => {
            let error;
            let response;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES;
            // Deleting uploaded workflow file
            try {
                const wfEndpoint = endpoint + definitionFile;
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, wfEndpoint);
            } catch (err) {
                error = err;
            }
        });
        beforeEach(async () => {
            const response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
            wfKey = response.workflowKey;
        });
        afterEach(async () => {
            // deleting workflow
            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
        });
        it("List all workflows - without any optional parameters.", async () => {
            let error;
            let response;

            try {
                response = await ListWorkflows.getWorkflows(REAL_SESSION);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error wut: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
        });
        it("List workflow that match all optional parameters", async () => {
            let error;
            let response;

            try {
                response = await ListWorkflows.getWorkflows(REAL_SESSION, {
                    zOSMFVersion: undefined,
                    workflowName: wfName,
                    category,
                    system,
                    owner,
                    vendor,
                    statusName
                });
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error wut: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
        });
        it("Successful even with zOSMF version undefined (because of default value).", async () => {
            let error;
            let response;

            try {
                response = await ListWorkflows.getWorkflows(REAL_SESSION, { zOSMFVersion: undefined });
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error wut: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
        });
    });
    describe("Failure scenarios", () => {
        it("Throws an error with undefined session.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.getWorkflows(undefined);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, noSession.message);
        });
        it("Throws an error with incorrect parameter format.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.getWorkflows(REAL_SESSION, {
                    zOSMFVersion: undefined,
                    workflowName: badString,
                    category: badString1,
                    system: badString,
                    owner: badString,
                    vendor: badString
                });
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, wrongString.message);
        });
        it("Throws an error with zOSMF version as empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.getWorkflows(REAL_SESSION, { zOSMFVersion: "" });
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });
        it("Throws an error with zOSMF version as null.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.getWorkflows(REAL_SESSION, { zOSMFVersion: null as any });
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });
    });
});
