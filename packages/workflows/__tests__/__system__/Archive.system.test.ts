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
import { ArchiveWorkflow } from "../..";
import { WorkflowConstants } from "../../src/WorkflowConstants";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { Upload } from "../../../zosfiles/src";
import { CreateWorkflow } from "../../src/Create";
import { ZosmfRestClient } from "../../../rest";

let session: Session;
let testEnvironment: ITestEnvironment;
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
    remoteWorkflowPath=`${testEnvironment.systemTestProperties.unix.testdir.replace(/\/{2,}/g, "/")}/wf${Date.now()}.xml`;
}

async function cleanup() {
    await TestEnvironment.cleanUp(testEnvironment);
}

async function removeWorkflows() {
    while(allWorkflowKeys.length > 0) {
        const currentKey = allWorkflowKeys.pop();
        const query: string = `/zosmf/workflow/rest/1.0/archivedworkflows/${currentKey}`;
        const deleted = await ZosmfRestClient.deleteExpectString(session, query);
        Imperative.console.info(JSON.stringify(deleted));
    }
}

describe("Archive workflow unit tests - successful scenarios", () => {
    beforeAll(async ()=> {
        await setup();
        await Upload.fileToUSSFile(session, localWorkflowPath, remoteWorkflowPath, true);
    });
    beforeEach(async ()=> {
        const systemName = testEnvironment.systemTestProperties.workflows.system;
        const owner = testEnvironment.systemTestProperties.zosmf.user;
        const workflowInstance = await CreateWorkflow.createWorkflow(session, `Arch Workflow ${Date.now()}`, remoteWorkflowPath, systemName, owner);
        workflowKeyActual = workflowInstance.workflowKey;
        allWorkflowKeys.push(workflowKeyActual);
    });

    it("Successful archive", async ()=>{
        const response = await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyActual, WorkflowConstants.ZOSMF_VERSION);
        const expected: IArchivedWorkflow = {
            workflowKey: workflowKeyActual
        };

        expect(response).toEqual(expected);
    });

    it("Missing z/OSMF REST API version", async ()=>{
        const response = await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyActual);
        const expected: IArchivedWorkflow = {
            workflowKey: workflowKeyActual
        };

        expect(response).toEqual(expected);
    });


    afterAll(async ()=>{
        await cleanup();
        await removeWorkflows();
    });
});

describe("Missing session", ()=>{
    it("Undefined session", async ()=>{
        try {
            await ArchiveWorkflow.archiveWorfklowByKey(undefined, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No session was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Null session", async ()=>{
        try {
            await ArchiveWorkflow.archiveWorfklowByKey(null, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No session was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Empty session", async ()=>{
        try {
            await ArchiveWorkflow.archiveWorfklowByKey(new Session({}), workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "Required parameter 'hostname' must be defined" };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
});

describe("Missing workflow key", ()=> {
    beforeAll(async ()=> {
        await setup();
    });
    it("Undefined workflow key", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(session, undefined, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Null workflow key", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(session, null, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Empty workflow key", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorfklowByKey(session, "", WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const expectedError: object = { msg: "[object Object]No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });

    afterAll(async () => {
        await cleanup();
    });
});

describe("Errors caused by the user interaction", ()=>{
    beforeAll(async () => {
        await setup();
        await Upload.fileToUSSFile(session, localWorkflowPath, remoteWorkflowPath, true);
    });
    it("404 Not Found", async ()=>{
        try {
            await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(JSON.stringify(error));
            expect(error).toMatchSnapshot("archive_404_snap");
        }
    });
    it("409 Request Conflict", async ()=>{
        const systemName = testEnvironment.systemTestProperties.workflows.system;
        const owner = testEnvironment.systemTestProperties.zosmf.user;
        const workflowInstance = await CreateWorkflow.createWorkflow(session, `Arch Workflow ${Date.now()}`, remoteWorkflowPath, systemName, owner);
        workflowKeyActual = workflowInstance.workflowKey;

        allWorkflowKeys.push(workflowKeyActual);

        try {
            await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyActual, WorkflowConstants.ZOSMF_VERSION);
            await ArchiveWorkflow.archiveWorfklowByKey(session, workflowKeyActual, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            Imperative.console.info(error);
            const reqConflict = 409;
            expect(error.mDetails.errorCode).toBe(reqConflict);
        }
        await removeWorkflows();
    });

    afterAll(async () => {
        await cleanup();
    });
});
