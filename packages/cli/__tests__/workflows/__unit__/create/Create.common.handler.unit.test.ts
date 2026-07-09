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

import { CreateWorkflow, DeleteWorkflow, ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";


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
            CreateWorkflow.createWorkflow = jest.fn(async (session): Promise<any> => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "deleted"
                };
            });

            // Mock the get key function
            ListWorkflows.getWfKey = jest.fn(async (session): Promise<any> => {
                fakeSession = session;
                return {
                    workflowKey: "fake-workflow-key"
                };
            });

            // Mock the create function
            DeleteWorkflow.deleteWorkflow = jest.fn(async (session): Promise<any> => {
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
            CreateWorkflow.createWorkflow = jest.fn(async (session): Promise<any> => {
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
            CreateWorkflow.createWorkflowLocal = jest.fn(async (session): Promise<any> => {
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
            CreateWorkflow.createWorkflow = jest.fn(async (session): Promise<any> => {
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
    describe("Credential censoring in error diagnostics", () => {
        // Distinctive plaintext secrets that must never appear in serialized error output
        const FAKE_PASSWORD = "sup3rSecretP4ssw0rd";
        const FAKE_TOKEN = "sup3rSecretT0kenValue";

        it("should censor credentials in additionalDetails when the definition source is invalid", async () => {
            const handlerReq = require("../../../../src/workflows/create/Create.common.handler");
            const handler = new handlerReq.default();

            let error: any;
            try {
                // No dataSet/ussFile/localFile source -> hits the default (internal error) branch
                await handler.processCmd({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        host: "fake-host",
                        user: "fake-user",
                        password: FAKE_PASSWORD,
                        tokenValue: FAKE_TOKEN,
                        workflowName: "fake-workflow"
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
            expect(error.additionalDetails).toContain("fake-host");
            // Regression: raw credentials must never leak into the serialized diagnostics
            expect(error.additionalDetails).not.toContain(FAKE_PASSWORD);
            expect(error.additionalDetails).not.toContain(FAKE_TOKEN);
        });
    });
});
