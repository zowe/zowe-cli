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

import { CreateWorkflow } from "../../../src/api/Create";
import { DeleteWorkflow } from "../../../src/api/Delete";
import { ListArchivedWorkflows } from "../../../src/api/ListArchivedWorkflows";
import { ArchiveWorkflow } from "../../../src/api/ArchiveWorkflow";
import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import { ZosmfRestClient } from "../../../../rest";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { Upload } from "../../../../zosfiles/src/api/methods/upload";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ZosFilesConstants } from "../../../../zosfiles/src/api";
import { ICreatedWorkflow } from "../../../src/api/doc/ICreatedWorkflow";
import { inspect } from "util";
import { getUniqueDatasetName } from "../../../../../__tests__/__src__/TestUtils";
import {
    noSession,
    nozOSMFVersion,
    wrongString
} from "../../../src/api/WorkflowConstants";
import { IWorkflowsInfo } from "../../../src/api/doc/IWorkflowsInfo";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
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

describe("List archived workflows", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            // tempProfileTypes: ["zosmf"],
            testName: "create_workflow"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = defaultSystem.zosmf.user;
        wfName = `${getUniqueDatasetName(owner)}`;
        definitionFile = `${defaultSystem.unix.testdir}/${getUniqueDatasetName(owner)}.xml`;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Success Scenarios", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUSSFile(REAL_SESSION, workflow, definitionFile, true);
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
        beforeEach(async () =>{
            const response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
            wfKey = response.workflowKey;
            // Archive workflow
            await ArchiveWorkflow.archiveWorfklowByKey(REAL_SESSION, wfKey);
        });
        afterEach(async () => {
            // deleting archived workflow
            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
        });
        it("List all archived workflows - without any optional parameters.", async () => {
            let error;
            let response;

            try {
                response = await ListArchivedWorkflows.listArchivedWorkflows(REAL_SESSION);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error wut: " + inspect(error));
            }
            expectZosmfResponseSucceeded(response, error);
         });
        it("List archived workflow that match all optional parameters", async () => {
            let error;
            let response;

            try {
                response = await ListArchivedWorkflows.listArchivedWorkflows(REAL_SESSION, undefined,
                                                                             wfName, category, system, owner, vendor, statusName);
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
                response = await ListArchivedWorkflows.listArchivedWorkflows(REAL_SESSION, undefined);
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
                response = await ListArchivedWorkflows.listArchivedWorkflows(undefined);
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
                response = await ListArchivedWorkflows.listArchivedWorkflows(REAL_SESSION, badString, badString1, badString, badString, badString);
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
                response = await ListArchivedWorkflows.listArchivedWorkflows(REAL_SESSION, null);
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
            expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
        });
    });
});
