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

import { CreateWorkflow, DeleteWorkflow } from "../..";
import { Imperative, Session } from "@brightside/imperative";
import { ZosmfRestClient } from "../../../rest";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { TestProperties } from "../../../../__tests__/__src__/properties/TestProperties";
import { Upload } from "../../../zosfiles/src/api/methods/upload";
import { Delete } from "../../../zosfiles/src/api/methods/delete";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestSystemSchema } from "../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ZosFilesConstants } from "../../../zosfiles/src/api";
import { ICreateWorkflow } from "../../src/api/doc/ICreateWorkflow";
import { ICreatedWorkflow } from "../../src/api/doc/ICreatedWorkflow";
import { inspect } from "util";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
const definitionFile = "/tmp/test.xml";
const inputFile = "/tmp/input.properties";
const workflow = __dirname + "/testfiles/demo.xml";
const vars = __dirname + "/testfiles/vars.properties";
let wfKey: string;
let system: string;
let owner: string;
// TODO add workflow name to default properties and to all relevant schemes
let wfName: string;

describe("Create workflow", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            // tempProfileTypes: ["zosmf"],
            testName: "create_workflow"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();
        system = testEnvironment.systemTestProperties.workflows.system;
        owner = testEnvironment.systemTestProperties.workflows.owner;
        wfName = testEnvironment.systemTestProperties.workflows.workflowName;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        await Upload.fileToUSSFile(REAL_SESSION, workflow, definitionFile, true);
        await Upload.fileToUSSFile(REAL_SESSION, vars, inputFile, true);
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
        try {
            const inputEndpoint = endpoint + inputFile;
            response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, inputEndpoint);
        } catch (err) {
            error = err;
        }
        await TestEnvironment.cleanUp(testEnvironment);
    });
    describe("Success Scenarios", () => {
        afterEach(async () => {
            // deleting workflow
            await DeleteWorkflow.deleteWorkflow(REAL_SESSION, wfKey);
        });
        it("Should create workflow in zOSMF.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error wut: " + inspect(error));
            }
            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.workflowKey).toBeDefined();
            wfKey = response.workflowKey;
            });
        it("Should create workflow in zOSMF with variable input file.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, inputFile);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error wut: " + inspect(error));
            }
            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.workflowKey).toBeDefined();
            // TODO: after properties API is created check also if variable has the right value, something like that:
            // expect(propResponse.variables.value).toContain("Hello world");
            wfKey = response.workflowKey;
            });
        it("Should create workflow in zOSMF with variable.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, null,
                    "GREETING=HELLO WORLD");
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error wut: " + inspect(error));
            }
            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.workflowKey).toBeDefined();
            // TODO: after properties API is created check also if variable has the right value, something like that:
            // expect(propResponse.variables.value).toContain("Hello world");
            wfKey = response.workflowKey;
            });
        it("Should create workflow in zOSMF with all options.", async () => {
            let error;
            let response: ICreatedWorkflow;

            try {
                response = await CreateWorkflow.createWorkflow(REAL_SESSION, wfName, definitionFile, system, owner, inputFile,
                    "GREETING=HELLO WORLD", true, "Public",false, "1.0");
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error wut: " + inspect(error));
            }
            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.workflowKey).toBeDefined();
            // TODO: after properties API is created check also if variable has the right value, something like that:
            // expect(propResponse.variables.value).toContain("Hello world");
            wfKey = response.workflowKey;
            });
    });
    describe("Failure scenarios", () => {
        it("should fail somehow", async () =>{
            // TODO prepare fail scenarios
        });
    });
}
