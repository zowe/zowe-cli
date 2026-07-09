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

import { PropertiesWorkflow, ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";

describe("List workflow details handler", () => {
    describe("process method", () => {
        const workflowKey = "fakekey";
        const workflowName = "fakename";
        const listSteps = true;
        const listVariables = true;
        it("should list workflow details using wf key", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/list/activeWorkflowDetails/ActiveWorkflowDetails.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            PropertiesWorkflow.getWorkflowProperties = jest.fn(async (session): Promise<any> => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Some list details of WF"
                };
            });

            // Mocked function references
            const profFunc = jest.fn((args) => {
                return {
                    host: "fake",
                    port: "fake",
                    user: "fake",
                    password: "fake",
                    auth: "fake",
                    rejectUnauthorized: "fake"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.processCmd({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        workflowKey,
                        listSteps,
                        listVariables
                    },
                    response: {
                        format: {
                            output: jest.fn((parms) => {
                                expect(parms).toMatchSnapshot();
                            })
                        },
                        data: {
                            setMessage: jest.fn((setMsgArgs) => {
                                apiMessage = setMsgArgs;
                            }),
                            setObj: jest.fn((setObjArgs) => {
                                jsonObj = setObjArgs;
                            })
                        },
                        console: {
                            log: jest.fn((logArgs) => {
                                logMessage += "\n" + logArgs;
                            })
                        }
                    },
                    profiles: {
                        get: profFunc
                    }
                } as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(PropertiesWorkflow.getWorkflowProperties).toHaveBeenCalledTimes(1);
            expect(PropertiesWorkflow.getWorkflowProperties).toHaveBeenCalledWith(
                fakeSession,
                workflowKey,
                undefined,
                listSteps,
                listVariables);
        });
        it("should list workflow details using wf name", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/list/activeWorkflowDetails/ActiveWorkflowDetails.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            PropertiesWorkflow.getWorkflowProperties = jest.fn(async (session): Promise<any> => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Some list details of WF"
                };
            });

            ListWorkflows.getWfKey = jest.fn(async (session) => {
                fakeSession = session;
                return workflowKey;
            });

            // Mocked function references
            const profFunc = jest.fn((args) => {
                return {
                    host: "fake",
                    port: "fake",
                    user: "fake",
                    password: "fake",
                    auth: "fake",
                    rejectUnauthorized: "fake"
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.processCmd({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        workflowName,
                        listSteps,
                        listVariables
                    },
                    response: {
                        format: {
                            output: jest.fn((parms) => {
                                expect(parms).toMatchSnapshot();
                            })
                        },
                        data: {
                            setMessage: jest.fn((setMsgArgs) => {
                                apiMessage = setMsgArgs;
                            }),
                            setObj: jest.fn((setObjArgs) => {
                                jsonObj = setObjArgs;
                            })
                        },
                        console: {
                            log: jest.fn((logArgs) => {
                                logMessage += "\n" + logArgs;
                            })
                        }
                    },
                    profiles: {
                        get: profFunc
                    }
                } as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(PropertiesWorkflow.getWorkflowProperties).toHaveBeenCalledTimes(1);
            expect(PropertiesWorkflow.getWorkflowProperties).toHaveBeenCalledWith(
                fakeSession,
                workflowKey,
                undefined,
                listSteps,
                listVariables);
        });
    });
    describe("Credential censoring in error diagnostics", () => {
        // Distinctive plaintext secrets that must never appear in serialized error output
        const FAKE_PASSWORD = "sup3rSecretP4ssw0rd";
        const FAKE_TOKEN = "sup3rSecretT0kenValue";

        it("should censor credentials in additionalDetails when no workflow matches the name", async () => {
            const handlerReq = require("../../../../../src/workflows/list/activeWorkflowDetails/ActiveWorkflowDetails.handler");
            const handler = new handlerReq.default();

            // No matching workflow key -> handler throws with arguments serialized into additionalDetails
            ListWorkflows.getWfKey = jest.fn(async (_session): Promise<any> => undefined);

            let error: any;
            try {
                await handler.processCmd({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        host: "fake-host",
                        user: "fake-user",
                        password: FAKE_PASSWORD,
                        tokenValue: FAKE_TOKEN,
                        workflowName: "fake-name"
                    },
                    response: {
                        format: { output: jest.fn() },
                        data: { setObj: jest.fn(), setMessage: jest.fn() },
                        console: { log: jest.fn(), error: jest.fn() }
                    },
                    profiles: { get: jest.fn() }
                } as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error.additionalDetails).toBeDefined();
            // Functional: secrets are redacted and non-sensitive context is retained
            expect(error.additionalDetails).toContain("****");
            expect(error.additionalDetails).toContain("fake-name");
            expect(error.additionalDetails).toContain("fake-host");
            // Regression: raw credentials must never leak into the serialized diagnostics
            expect(error.additionalDetails).not.toContain(FAKE_PASSWORD);
            expect(error.additionalDetails).not.toContain(FAKE_TOKEN);
        });
    });
});
