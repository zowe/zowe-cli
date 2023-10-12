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

import { AbstractSession, Session, Headers, ImperativeError } from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IArchivedWorkflow } from "../../src/doc/IArchivedWorkflow";
import { ArchiveWorkflow, WorkflowConstants } from "../../src";

const session: AbstractSession = new Session({
    user: "usr",
    password: "password",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});
const workflowKeyConst: string = "0123-456789-abc-def";

describe("Archive workflow unit tests - successful scenarios", () => {
    it("Successful archive", async ()=>{
        (ZosmfRestClient.postExpectJSON as any) = jest.fn(() => {
            return new Promise((resolve)=>{
                // Imperative.console.info("Using mocked function");
                process.nextTick(()=>{
                    const promiseOutput: IArchivedWorkflow = {
                        workflowKey: workflowKeyConst
                    };

                    resolve(promiseOutput);
                });
            });
        });
        const response = await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
        const expected: IArchivedWorkflow = {
            workflowKey: workflowKeyConst
        };

        expect(response).toEqual(expected);
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
        let query: string = `${WorkflowConstants.RESOURCE}/1.0/${WorkflowConstants.WORKFLOW_RESOURCE}`;
        query+=`/${workflowKeyConst}/${WorkflowConstants.ARCHIVE_WORKFLOW}`;
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(session, query, [Headers.APPLICATION_JSON], null);
    });
});

describe("Missing session", ()=>{
    it("Undefined session", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(undefined, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No session was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Null session", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(null, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No session was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Empty session", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(new Session({}), workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            const expectedError: object = { msg: "Required parameter 'hostname' must be defined" };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
});

describe("Missing workflow key", ()=> {
    it("Undefined workflow key", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(session, undefined, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Null workflow key", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(session, null, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
    it("Empty workflow key", async ()=>{
        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(session, "", WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            const expectedError: object = { msg: "Imperative API Error No workflow key parameter was supplied." };
            expect(error.mDetails).toEqual(expectedError);
        }
    });
});

describe("Missing z/OSMF version", ()=>{
    it("Missing z/OSMF REST API version", async ()=>{
        (ZosmfRestClient.postExpectJSON as any) = jest.fn(() => {
            return new Promise((resolve)=>{
                // Imperative.console.info("Using mocked function");
                process.nextTick(()=>{
                    const promiseOutput: IArchivedWorkflow = {
                        workflowKey: workflowKeyConst
                    };

                    resolve(promiseOutput);
                });
            });
        });
        const response = await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyConst);
        const expected: IArchivedWorkflow = {
            workflowKey: workflowKeyConst
        };

        expect(response).toEqual(expected);
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
        let query: string = `${WorkflowConstants.RESOURCE}/1.0/${WorkflowConstants.WORKFLOW_RESOURCE}`;
        query+=`/${workflowKeyConst}/${WorkflowConstants.ARCHIVE_WORKFLOW}`;
        expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(session, query, [Headers.APPLICATION_JSON], null);
    });
});

describe("Errors caused by the user interaction", ()=>{
    it("400 Bad Request", async ()=>{
        const errorCodeConst = "400";
        const msgConst = "Bad Request";
        (ZosmfRestClient.postExpectJSON as any) = jest.fn(() => {
            return new Promise(()=>{
                // Imperative.console.info("Using mocked function");
                const error =  new ImperativeError({
                    msg: msgConst,
                    errorCode: errorCodeConst
                });
                throw error;
            });
        });

        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            expect(error.mDetails).toEqual({msg: msgConst, errorCode: errorCodeConst});
        }
    });
    it("403 Forbidden", async ()=>{
        const errorCodeConst = "403";
        const msgConst = "Forbidden";
        (ZosmfRestClient.postExpectJSON as any) = jest.fn(() => {
            return new Promise(()=>{
                // Imperative.console.info("Using mocked function");
                const error =  new ImperativeError({
                    msg: msgConst,
                    errorCode: errorCodeConst
                });
                throw error;
            });
        });

        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            expect(error.mDetails).toEqual({msg: msgConst, errorCode: errorCodeConst});
        }
    });
    it("404 Not Found", async ()=>{
        const errorCodeConst = "404";
        const msgConst = "Not Found";
        (ZosmfRestClient.postExpectJSON as any) = jest.fn(() => {
            return new Promise(()=>{
                // Imperative.console.info("Using mocked function");
                const error =  new ImperativeError({
                    msg: msgConst,
                    errorCode: errorCodeConst
                });
                throw error;
            });
        });

        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            expect(error.mDetails).toEqual({msg: msgConst, errorCode: errorCodeConst});
        }
    });
    it("409 Request Conflict", async ()=>{
        const errorCodeConst = "409";
        const msgConst = "Request Conflict";
        (ZosmfRestClient.postExpectJSON as any) = jest.fn(() => {
            return new Promise(()=>{
                // Imperative.console.info("Using mocked function");
                const error =  new ImperativeError({
                    msg: msgConst,
                    errorCode: errorCodeConst
                });
                throw error;
            });
        });

        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            expect(error.mDetails).toEqual({msg: msgConst, errorCode: errorCodeConst});
        }
    });
    it("401 Unauthorized", async ()=>{
        const errorCodeConst = "401";
        const msgConst = "Unauthorized";
        (ZosmfRestClient.postExpectJSON as any) = jest.fn(() => {
            return new Promise(()=>{
                // Imperative.console.info("Using mocked function");
                const error =  new ImperativeError({
                    msg: msgConst,
                    errorCode: errorCodeConst
                });
                throw error;
            });
        });

        try {
            const response = await ArchiveWorkflow.archiveWorkflowByKey(session, workflowKeyConst, WorkflowConstants.ZOSMF_VERSION);
            expect(false).toBeTruthy();
        } catch(error) {
            // Imperative.console.info(error);
            expect(error.mDetails).toEqual({msg: msgConst, errorCode: errorCodeConst});
        }
    });
});
