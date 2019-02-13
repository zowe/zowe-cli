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

import { StartWorkflow } from "../../../src/api/Start";
import { AbstractSession } from "@brightside/imperative";
import { startT } from "../../../src/api/doc/IStartWorkflow";
import { PropertiesWorkflow } from "../../..";
import {IWorkflowInfo} from "../../../src/api/doc/IWorkflowInfo";
import {IAutomationStatus} from "../../../src/api/doc/IAutomationStatus";


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
            const handlerReq = require("../../../src/cli/start/Start.common.handler");
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
            expect(StartWorkflow.startWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey, undefined, undefined, true);

        });
        it("should start a workflow using workflow key and optional arguments", async () => {
            const resolveConflict: startT = "outputFileValue";
            const stepName = "fake";
            const performOneStep = true;
            const wait = true;
            // Require the handler and create a new instance
            const handlerReq = require("../../../src/cli/start/Start.common.handler");
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

            PropertiesWorkflow.getWorkflowProperties = jest.fn((session) => {
                fakeSession = session;
                return {
                     automationStatus: {
                         currenStepname: null
                     },
                     statusName: "complete",
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
                        performOneStep,
                        wait
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
            expect(StartWorkflow.startWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey, resolveConflict, stepName, !performOneStep);

        });
        it("should start a workflow using workflow key and optional arguments with workflow that failed", async () => {
            const resolveConflict: startT = "outputFileValue";
            const stepName = "fake";
            const performOneStep = true;
            const wait = true;
            // Require the handler and create a new instance
            const handlerReq = require("../../../src/cli/start/Start.common.handler");
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

            PropertiesWorkflow.getWorkflowProperties = jest.fn((session) => {
                fakeSession = session;
                return {
                     automationStatus: {
                         currenStepname: null
                     },
                     statusName: "in-progress",
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
                        performOneStep,
                        wait
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
            expect(StartWorkflow.startWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey, resolveConflict, stepName, !performOneStep);

        });
    });
});
