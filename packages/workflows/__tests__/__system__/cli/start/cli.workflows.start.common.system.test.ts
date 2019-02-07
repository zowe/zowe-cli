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

import { ZosmfRestClient } from "../../../../../rest";
import { Session } from "@brightside/imperative";
import { runCliScript, getUniqueDatasetName } from "../../../../../../__tests__/__src__/TestUtils";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { CreateWorkflow, DeleteWorkflow } from "../../../..";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { Upload } from "../../../../../zosfiles/src/api/methods/upload";
import { ZosFilesConstants } from "../../../../../zosfiles/src/api";
import { join } from "path";
import { startT } from "../../../../src/api/doc/IStartWorkflow";
import { sleep } from "../../../../../utils";

const resolveConflict: startT = "outputFileValue";
const stepName = "echo";
const performOneStep = true;

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let definitionFile: string;
let wfKey: string;
let system: string;
let owner: string;
let wfName: string;
const workflow = join(__dirname, "../../testfiles/demo.xml");

describe("Create workflow cli system tests", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "create_workflow_cli"
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
    describe("Create workflow using uss file", () => {
        beforeAll(async () => {
            // Upload files only for successful scenarios
            await Upload.fileToUSSFile(REAL_SESSION, workflow, definitionFile, true);
        });
        afterAll(async () => {
            let error;
            let response;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES;
            // deleting uploaded workflow file
            try {
                const wfEndpoint = endpoint + definitionFile;
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, wfEndpoint);
            } catch (err) {
                error = err;
            }
        });
        describe("Success Scenarios", () => {
            afterEach(async () =>{
                // TODO change with waiting for status when properties are done
                const one = 1;
                const minute = 60;
                const mili = 1000;
                const someMins = one * minute * mili;
                await sleep(someMins);
                await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
            });
            beforeEach(async () => {
                const response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
                wfKey = response.workflowKey;
            });
            it("Should start workflow in zOSMF.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_key.sh",
                testEnvironment, [wfKey]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow started.");
            });
            it("Should start workflow with optional arguments in zOSMF.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_key_options.sh",
                testEnvironment, [wfKey, resolveConflict, stepName, performOneStep]);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toContain("Workflow started.");
            });
        });
        describe("Failure Scenarios", () => {
            it("Should throw error if workflowKey is empty string.", async () => {
                const response = runCliScript(__dirname + "/__scripts__/command/command_start_workflow_key.sh", testEnvironment);
                expect(response.status).toBe(1);
                expect(response.stderr.toString()).toContain("workflowKey");
                expect(response.stderr.toString()).toContain("Missing Positional Argument");
        });
        });
        describe("Display Help", () => {
            it("should display delete workflow-key help", async () => {
                const response = runCliScript(__dirname + "/__scripts__/start_workflowkey_help.sh", testEnvironment);
                expect(response.stderr.toString()).toBe("");
                expect(response.status).toBe(0);
                expect(response.stdout.toString()).toMatchSnapshot();
            });
        });
    });
});
