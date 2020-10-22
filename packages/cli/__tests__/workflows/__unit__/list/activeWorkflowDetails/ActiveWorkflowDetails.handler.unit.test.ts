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
            PropertiesWorkflow.getWorkflowProperties = jest.fn((session) => {
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
                    pass: "fake",
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
            PropertiesWorkflow.getWorkflowProperties = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Some list details of WF"
                };
            });

            ListWorkflows.getWfKey = jest.fn((session) => {
                fakeSession = session;
                return workflowKey;
            });

            // Mocked function references
            const profFunc = jest.fn((args) => {
                return {
                    host: "fake",
                    port: "fake",
                    user: "fake",
                    pass: "fake",
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
});
