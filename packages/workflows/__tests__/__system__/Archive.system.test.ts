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

import { Session, Imperative } from "@zowe/imperative";
import { IArchivedWorkflow } from "../../src/doc/IArchivedWorkflow";
import { ArchiveWorkflow } from "../../src";
import { WorkflowConstants } from "../../src/WorkflowConstants";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { CreateWorkflow } from "../../src/Create";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { Upload } from "@zowe/zos-files-for-zowe-sdk";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/ITestEnvironment";

let session: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
const workflowKeyConst: string = "0123-456789-abc-def";
let workflowKeyActual: string;
const localWorkflowPath: string = `${__dirname}/testfiles/demo.xml`;
let remoteWorkflowPath: string;
const allWorkflowKeys: string[] = [];

async function setup() {
    testEnvironment = await TestEnvironment.setUp({
        testName: "archive_workflow"
    });
    session = TestEnvironment.createZosmfSession(testEnvironment);
    remoteWorkflowPath = `${testEnvironment.systemTestProperties.unix.testdir.replace(/\/{2,}/g, "/")}/wf${Date.now()}.xml`;
}

async function cleanup() {
    await TestEnvironment.cleanUp(testEnvironment);
}

async function removeWorkflows() {
    while (allWorkflowKeys.length > 0) {
        const currentKey = allWorkflowKeys.pop();
        const query: string = `/zosmf/workflow/rest/1.0/archivedworkflows/${currentKey}`;
        const deleted = await ZosmfRestClient.deleteExpectString(session, query);
        Imperative.console.info(JSON.stringify(deleted));
    }
}

describe("Archive workflow unit tests - successful scenarios", () => {
    beforeAll(async () => {
        await setup();
        await Upload.fileToUssFile(session, localWorkflowPath, remoteWorkflowPath, { binary: true});
        testEnvironment.resources.files.push(remoteWorkflowPath);
    });
    beforeEach(async () => {
        const systemName = testEnvironment.systemTestProperties.workflows.system;
        const owner = testEnvironment.systemTestProperties.zosmf.user;
        const workflowInstance = await CreateWorkflow.createWorkflow(session, `Arch Workflow ${Date.now()}`, remoteWorkflowPath, systemName, owner);
        workflowKeyActual = workflowInstance.workflowKey;
        allWorkflowKeys.push(workflowKeyActual);
    });

    it("Successful archive", async () => {
        const response = await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyActual, WorkflowConstants.ZOSMF_VERSION);
        const expected: IArchivedWorkflow = {
            workflowKey: workflowKeyActual
        };

        expect(response).toEqual(expected);
    });

    it("Missing z/OSMF REST API version", async () => {
        const response = await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyActual);
        const expected: IArchivedWorkflow = {
            workflowKey: workflowKeyActual
        };

        expect(response).toEqual(expected);
    });


    afterAll(async () => {
        await cleanup();
        await removeWorkflows();
    });
});

describe("Missing session", () => {
    it("Undefined session", async () => {
        try {
            await ArchiveWorkflow.archiveWorkflowByKey(undefined, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch (error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No session was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Null session", async () => {
        try {
            await ArchiveWorkflow.archiveWorkflowByKey(null, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch (error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No session was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Empty session", async () => {
        try {
            await ArchiveWorkflow.archiveWorkflowByKey(new Session({}), workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch (error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "Required parameter 'hostname' must be defined" };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
});

describe("Missing workflow key", () => {
    beforeAll(async () => {
        await setup();
    });
    it("Undefined workflow key", async () => {
        try {
            await ArchiveWorkflow.archiveWorkflowByKey(session, undefined, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch (error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Null workflow key", async () => {
        try {
            await ArchiveWorkflow.archiveWorkflowByKey(session, null, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch (error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Empty workflow key", async () => {
        try {
            await ArchiveWorkflow.archiveWorkflowByKey(session, "", WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch (error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });

    afterAll(async () => {
        await cleanup();
    });
});

describe("Errors caused by the user interaction", () => {
    beforeAll(async () => {
        await setup();
        await Upload.fileToUssFile(session, localWorkflowPath, remoteWorkflowPath, { binary: true });
        testEnvironment.resources.files.push(remoteWorkflowPath);
    });
    it("404 Not Found", async () => {
        try {
            await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch (error) {
            Imperative.console.info(JSON.stringify(error));
            expect(error.mDetails.errorCode).toEqual(404);
            expect(error.causeErrors).toContain("IZUWF5001W");
            // https://www.ibm.com/docs/en/zos/2.5.0?topic=izuwf9999-izuwf5001w
        }
    });
    it("409 Request Conflict", async () => {
        const systemName = testEnvironment.systemTestProperties.workflows.system;
        const owner = testEnvironment.systemTestProperties.zosmf.user;
        const workflowInstance = await CreateWorkflow.createWorkflow(session, `Arch Workflow ${Date.now()}`, remoteWorkflowPath, systemName, owner);
        workflowKeyActual = workflowInstance.workflowKey;

        allWorkflowKeys.push(workflowKeyActual);

        try {
            await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyActual, WorkflowConstants.ZOSMF_VERSION);
            await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyActual, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch (error) {
            Imperative.console.info(error);
            expect(error.mDetails.errorCode).toBe(409);
            expect(error.causeErrors).toContain("IZUWF0158E");
            // https://www.ibm.com/docs/en/zos/2.5.0?topic=izuwf9999-izuwf0158e
        }
        await removeWorkflows();
    });

    afterAll(async () => {
        await cleanup();
    });
});
