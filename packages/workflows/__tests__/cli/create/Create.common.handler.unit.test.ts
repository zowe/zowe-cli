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

import { CreateWorkflow } from "../../../src/api/Create";


describe("Create workflow common handler", () => {
    describe("process method", () => {
        const workflowName = "fakeWorkflow";
        const dataSet = "TEST.DATASET";
        const ussFile = "/fake/ussfile";
        const wrongFile = "file";
        const systemName = "FAKESYS1";
        const owner = "FAKEUID";
        const variablesInputFile = "/fake/file.xml";
        const variables = "var1=test,var2=test2";
        const assignToOwner = true;
        const accessType = "Public";
        const deleteCompleted = true;
        it("should create a workflow using a dataset", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../src/cli/create/Create.common.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            CreateWorkflow.createWorkflow = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "deleted"
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
                        workflowName,
                        dataSet,
                        systemName,
                        owner,
                        variablesInputFile,
                        variables,
                        assignToOwner,
                        accessType,
                        deleteCompleted,
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
                        },
                        format: {
                            output: jest.fn((parms) => {
                                expect(parms).toMatchSnapshot();
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
            expect(CreateWorkflow.createWorkflow).toHaveBeenCalledTimes(1);
            expect(CreateWorkflow.createWorkflow).toHaveBeenCalledWith(fakeSession,
                                                                        workflowName,
                                                                        dataSet,
                                                                        systemName,
                                                                        owner,
                                                                        variablesInputFile,
                                                                        variables,
                                                                        assignToOwner,
                                                                        accessType,
                                                                        deleteCompleted,);
        });
        it("should create a workflow using a uss file", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../src/cli/create/Create.common.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            CreateWorkflow.createWorkflow = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "deleted"
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
                        workflowName,
                        ussFile,
                        systemName,
                        owner,
                        variablesInputFile,
                        variables,
                        assignToOwner,
                        accessType,
                        deleteCompleted,
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
                        },
                        format: {
                            output: jest.fn((parms) => {
                                expect(parms).toMatchSnapshot();
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
            expect(CreateWorkflow.createWorkflow).toHaveBeenCalledTimes(1);
            expect(CreateWorkflow.createWorkflow).toHaveBeenCalledWith(fakeSession,
                                                                        workflowName,
                                                                        ussFile,
                                                                        systemName,
                                                                        owner,
                                                                        variablesInputFile,
                                                                        variables,
                                                                        assignToOwner,
                                                                        accessType,
                                                                        deleteCompleted,);
        });
        it("should fail if definition file is not a uss file or dataset", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../src/cli/create/Create.common.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            CreateWorkflow.createWorkflow = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "deleted"
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
                        workflowName,
                        wrongFile,
                        systemName,
                        owner,
                        variablesInputFile,
                        variables,
                        assignToOwner,
                        accessType,
                        deleteCompleted,
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
            expect(error).toBeDefined();
            expect(CreateWorkflow.createWorkflow).toHaveBeenCalledTimes(0);
            expect(error).toMatchSnapshot();
        });
    });
});
