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

import { DeleteWorkflow } from "../../../../../../packages/workflows/src/Delete";
import { ListWorkflows } from "../../../../../../packages/workflows/src/ListWorkflows";
import { AbstractSession, ImperativeError } from "@zowe/imperative";


describe("Delete workflow common handler", () => {
    describe("process method", () => {
        it("should delete a workflow using workflow key", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/delete/Delete.common.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession: AbstractSession = null;

            // Mock the delete function
            DeleteWorkflow.deleteWorkflow = jest.fn((session) => {
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
            expect(DeleteWorkflow.deleteWorkflow).toHaveBeenCalledTimes(1);
            expect(DeleteWorkflow.deleteWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey);

        });
        it("should delete a workflow using workflow name", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/delete/Delete.common.handler");
            const handler = new handlerReq.default();
            const wfArray = {workflows: [
                {workflowKey: "fake-workflow-key"},
                {workflowKey: "fake-workflow-key2"}
            ]};
            const workflowName = "fake-name";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession: AbstractSession = null;

            // Mock the delete function
            DeleteWorkflow.deleteWorkflow = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "deleted"
                };
            });

            // Mock the list function
            ListWorkflows.getWorkflows = jest.fn((session) => {
                fakeSession = session;
                return wfArray;
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
                        workflowName
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
            expect(DeleteWorkflow.deleteWorkflow).toHaveBeenCalledTimes(wfArray.workflows.length);
            wfArray.workflows.forEach((element)=>{
                expect(DeleteWorkflow.deleteWorkflow).toHaveBeenCalledWith(fakeSession, element.workflowKey);
            });
        });
    });
    describe("Fail scenarios", () => {
        it("should fail if no workflow with specified name was found.", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/delete/Delete.common.handler");
            const handler = new handlerReq.default();
            const workflowName = "fake-name";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession: AbstractSession = null;

            // Mock the delete function
            DeleteWorkflow.deleteWorkflow = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "deleted"
                };
            });

            // Mock the list function
            ListWorkflows.getWorkflows = jest.fn((session) => {
                fakeSession = session;
                return null;
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
                        workflowName
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

            expect(error).toBeDefined();
            expect(JSON.stringify(error)).toContain("No workflows match the provided workflow name.");
            expect(DeleteWorkflow.deleteWorkflow).toHaveBeenCalledTimes(0);
        });
        it("should fail if wrong workflow deletion criteria was provided.", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/delete/Delete.common.handler");
            const handler = new handlerReq.default();
            const workflowID = "fake-id";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession: AbstractSession = null;

            // Mock the delete function
            DeleteWorkflow.deleteWorkflow = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "deleted"
                };
            });

            // Mock the list function
            ListWorkflows.getWorkflows = jest.fn((session) => {
                fakeSession = session;
                return null;
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
                        workflowID
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

            expect(error).toBeDefined();
            expect(JSON.stringify(error)).toContain(
                "Internal create error: Unable to determine the the criteria by which to run delete workflow action.");
            expect(DeleteWorkflow.deleteWorkflow).toHaveBeenCalledTimes(0);
        });
        it("should fail if deletion with wf key failed", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/delete/Delete.common.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-wf-key";
            const deleteError: string = "failed to delete wf";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession: AbstractSession = null;

            // Mock the delete function
            DeleteWorkflow.deleteWorkflow = jest.fn((session) => {
                fakeSession = session;
                throw new ImperativeError({msg: deleteError});
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
                        workflowKey
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

            expect(error).toBeDefined();
            expect(JSON.stringify(error)).toContain("Delete workflow: Error: " + deleteError);
            expect(DeleteWorkflow.deleteWorkflow).toHaveBeenCalledTimes(1);
        });
        it("should fail if deletion with wf name failed", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/workflows/delete/Delete.common.handler");
            const handler = new handlerReq.default();
            const workflowName = "fake-wf-name";
            const deleteError: string = "failed to delete wf";
            const wfArray = {workflows: [
                {workflowKey: "fake-workflow-key"},
                {workflowKey: "fake-workflow-key2"}
            ]};

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession: AbstractSession = null;

            // Mock the delete function
            DeleteWorkflow.deleteWorkflow = jest.fn((session) => {
                fakeSession = session;
                throw new ImperativeError({msg: deleteError});
            });

            // Mock the list function
            ListWorkflows.getWorkflows = jest.fn((session) => {
                fakeSession = session;
                return wfArray;
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
                        workflowName
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

            expect(error).toBeDefined();
            expect(JSON.stringify(error)).toContain("Some workflows were not deleted, please check the message above.");
            expect(DeleteWorkflow.deleteWorkflow).toHaveBeenCalledTimes(wfArray.workflows.length);
        });
    });
});
