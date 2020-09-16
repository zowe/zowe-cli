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

import { CreateWorkflow, DeleteWorkflow, ListWorkflows } from "../../../../../../packages/workflows";


describe("Create workflow common handler", () => {
    describe("process method", () => {
        const workflowName = "fakeWorkflow";
        const dataSet = "TEST.DATASET";
        const ussFile = "/fake/ussfile";
        const localFile = "/fake/localFile.xml";
        const wrongFile = "file";
        const systemName = "FAKESYS1";
        const owner = "FAKEUID";
        const variablesInputFile = "/fake/file.xml";
        const variables = "var1=test,var2=test2";
        const assignToOwner = true;
        const accessType = "Public";
        const deleteCompleted = true;
        const remoteDirectory = "/fake/dir";
        const keepFiles = true;
        const overwrite = true;
        it("should create a workflow using a dataset", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/create/Create.common.handler");
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

            // Mock the get key function
            ListWorkflows.getWfKey = jest.fn((session) => {
                fakeSession = session;
                return {
                    workflowKey: "fake-workflow-key"
                };
            });

            // Mock the create function
            DeleteWorkflow.deleteWorkflow = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true
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
                        workflowName,
                        dataSet,
                        systemName,
                        owner,
                        variablesInputFile,
                        variables,
                        assignToOwner,
                        accessType,
                        deleteCompleted
//                        overwrite
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
                                                                        deleteCompleted);
        });
        it("should create a workflow using a uss file", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/create/Create.common.handler");
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
                        ussFile,
                        systemName,
                        owner,
                        variablesInputFile,
                        variables,
                        assignToOwner,
                        accessType,
                        deleteCompleted
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
                                                                        deleteCompleted);
        });
        it("should create a workflow using a local file", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/create/Create.common.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            CreateWorkflow.createWorkflowLocal = jest.fn((session) => {
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
                        localFile,
                        systemName,
                        owner,
                        variablesInputFile,
                        variables,
                        assignToOwner,
                        accessType,
                        deleteCompleted,
                        keepFiles,
                        remoteDirectory
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
            expect(CreateWorkflow.createWorkflowLocal).toHaveBeenCalledTimes(1);
            expect(CreateWorkflow.createWorkflowLocal).toHaveBeenCalledWith(fakeSession,
                                                                        workflowName,
                                                                        localFile,
                                                                        systemName,
                                                                        owner,
                                                                        variablesInputFile,
                                                                        variables,
                                                                        assignToOwner,
                                                                        accessType,
                                                                        deleteCompleted,
                                                                        keepFiles,
                                                                        remoteDirectory);
        });
        it("should fail if definition file is not a uss file or dataset", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/create/Create.common.handler");
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
                        wrongFile,
                        systemName,
                        owner,
                        variablesInputFile,
                        variables,
                        assignToOwner,
                        accessType,
                        deleteCompleted
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
