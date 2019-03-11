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

import { AbstractSession } from "@zowe/imperative";
import { startT } from "../../../../src/api/doc/IStartWorkflow";
import { PropertiesWorkflow, StartWorkflow } from "../../../..";


describe("Start workflow common handler", () => {
    describe("Successful tests", () => {
        // Vars populated by the mocked function
        let error: any;
        let apiMessage = "";
        let jsonObj;
        let logMessage = "";
        let fakeSession: AbstractSession;

        it("should start a workflow using workflow key", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/start/workflowStep/WorkflowStep.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";

            // Mock the start function
            StartWorkflow.startWorkflow = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Started."
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
                    rejectUnauthorized: "fake",
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.processCmd({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        workflowKey
                    },
                    response: {
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
            expect(StartWorkflow.startWorkflow).toHaveBeenCalledTimes(1);
            expect(StartWorkflow.startWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey, undefined, undefined, undefined);

        });
        it("should start a workflow using workflow key and optional arguments", async () => {
            const stepName = "fake";
            const performFollowingSteps = true;
            const resolveConflict: startT = "outputFileValue";
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/start/workflowStep/WorkflowStep.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";

            // Mock the start function
            StartWorkflow.startWorkflow = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Started."
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
                    rejectUnauthorized: "fake",
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.processCmd({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        workflowKey,
                        resolveConflict,
                        stepName,
                        performFollowingSteps
                    },
                    response: {
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
            expect(StartWorkflow.startWorkflow).toHaveBeenCalledTimes(1);
            expect(StartWorkflow.startWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey, resolveConflict, stepName, performFollowingSteps);

        });
    });
});
