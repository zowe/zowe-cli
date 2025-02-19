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

import { ArchivedDeleteWorkflow, ListArchivedWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";
import { ImperativeError } from "@zowe/imperative";


describe("Delete workflow common handler", () => {
    describe("process method", () => {
        it("should delete a workflow using workflow key", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/delete/Delete.archived.common.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";

            // Vars populated by the mocked function
            let error;
            let fakeSession = null;

            // Mock the delete function
            ArchivedDeleteWorkflow.archivedDeleteWorkflow = jest.fn(async (session): Promise<any> => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "deleted"
                };
            });

            // Mocked function references
            const profFunc = jest.fn((_args) => {
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
                        workflowKey
                    },
                    response: {
                        data: {
                            setMessage: jest.fn((_setMsgArgs) => {
                                // Do nothing
                            }),
                            setObj: jest.fn((_setObjArgs) => {
                                // Do nothing
                            })
                        },
                        console: {
                            log: jest.fn((_logArgs) => {
                                // Do nothing
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
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledTimes(1);
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey);

        });
        it("should delete a workflow using workflow name", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/delete/Delete.archived.common.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";
            const workflowName = "fake-name";

            // Vars populated by the mocked function
            let error;
            let fakeSession = null;

            // Mock the delete function
            ArchivedDeleteWorkflow.archivedDeleteWorkflow = jest.fn(async (session): Promise<any> => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "deleted"
                };
            });

            // Mock the list function
            ListArchivedWorkflows.listArchivedWorkflows = jest.fn(async (session) => {
                fakeSession = session;
                return {archivedWorkflows: [{workflowKey: `${workflowKey}`, workflowName: `${workflowName}`}]};
            });

            // Mocked function references
            const profFunc = jest.fn((_args) => {
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
                        workflowName
                    },
                    response: {
                        format: {
                            output: jest.fn((parms) => {
                                expect(parms).toMatchSnapshot();
                            })
                        },
                        data: {
                            setMessage: jest.fn((_setMsgArgs) => {
                                // Do nothing
                            }),
                            setObj: jest.fn((_setObjArgs) => {
                                // Do nothing
                            })
                        },
                        console: {
                            log: jest.fn((_logArgs) => {
                                // Do nothing
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
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledTimes(1);
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey);

        });
        it("should fail when deletion with workflow key fails fails", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/delete/Delete.archived.common.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";

            // Vars populated by the mocked function
            let error;
            let fakeSession = null;

            // Mock the delete function
            ArchivedDeleteWorkflow.archivedDeleteWorkflow = jest.fn(async (session) => {
                fakeSession = session;
                throw new ImperativeError ({msg: `deletion failed`});
            });

            // Mocked function references
            const profFunc = jest.fn((_args) => {
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
                        workflowKey
                    },
                    response: {
                        data: {
                            setMessage: jest.fn((_setMsgArgs) => {
                                // Do nothing
                            }),
                            setObj: jest.fn((_setObjArgs) => {
                                // Do nothing
                            })
                        },
                        console: {
                            log: jest.fn((_logArgs) => {
                                // Do nothing
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

            expect(error.toString()).toContain(`deletion failed`);
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledTimes(1);
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey);

        });
        it("should fail when no workflows match the provided wf name", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/delete/Delete.archived.common.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";
            const workflowName = "fake-name";

            // Vars populated by the mocked function
            let error;

            // Mock the delete function
            ArchivedDeleteWorkflow.archivedDeleteWorkflow = jest.fn(async (_session): Promise<any> => {
                return {
                    success: true,
                    commandResponse: "deleted"
                };
            });

            // Mock the list function
            ListArchivedWorkflows.listArchivedWorkflows = jest.fn(async (_session) => {
                return {archivedWorkflows: [{workflowKey: `${workflowKey}`, workflowName: `${workflowName}_fake`}]};
            });

            // Mocked function references
            const profFunc = jest.fn((_args) => {
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
                        workflowName
                    },
                    response: {
                        format: {
                            output: jest.fn((parms) => {
                                expect(parms).toMatchSnapshot();
                            })
                        },
                        data: {
                            setMessage: jest.fn((_setMsgArgs) => {
                                // Do nothing
                            }),
                            setObj: jest.fn((_setObjArgs) => {
                                // Do nothing
                            })
                        },
                        console: {
                            log: jest.fn((_logArgs) => {
                                // Do nothing
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

            expect(error.toString()).toContain("No workflows match the provided workflow name.");
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledTimes(0);

        });
        it("should fail when deletion with workflow name fails fails", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/delete/Delete.archived.common.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";
            const workflowName = "fake-name";

            // Vars populated by the mocked function
            let error;
            let fakeSession = null;

            // Mock the delete function
            ArchivedDeleteWorkflow.archivedDeleteWorkflow = jest.fn(async (session) => {
                fakeSession = session;
                throw new ImperativeError ({msg: `deletion failed`});
            });

            // Mock the list function
            ListArchivedWorkflows.listArchivedWorkflows = jest.fn(async (session) => {
                fakeSession = session;
                return {archivedWorkflows: [{workflowKey: `${workflowKey}`, workflowName: `${workflowName}`}]};
            });

            // Mocked function references
            const profFunc = jest.fn((_args) => {
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
                        workflowName
                    },
                    response: {
                        format: {
                            output: jest.fn((parms) => {
                                expect(parms).toMatchSnapshot();
                            })
                        },
                        data: {
                            setMessage: jest.fn((_setMsgArgs) => {
                                // Do nothing
                            }),
                            setObj: jest.fn((_setObjArgs) => {
                                // Do nothing
                            })
                        },
                        console: {
                            log: jest.fn((_logArgs) => {
                                // Do nothing
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

            expect(error.toString()).toContain(`Some workflows were not deleted, please check the message above.`);
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledTimes(1);
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledWith(fakeSession, workflowKey);
        });
        it("should fail when neither workflow key or name is chosen", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/delete/Delete.archived.common.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";
            const workflowName = "fake-name";
            const workflowNothing = "fake-option";

            // Vars populated by the mocked function
            let error;

            // Mock the delete function
            ArchivedDeleteWorkflow.archivedDeleteWorkflow = jest.fn(async (_session) => {
                throw new ImperativeError ({msg: `deletion failed`});
            });

            // Mock the list function
            ListArchivedWorkflows.listArchivedWorkflows = jest.fn(async (_session) => {
                return {archivedWorkflows: [{workflowKey: `${workflowKey}`, workflowName: `${workflowName}`}]};
            });

            // Mocked function references
            const profFunc = jest.fn((_args) => {
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
                        workflowNothing
                    },
                    response: {
                        format: {
                            output: jest.fn((parms) => {
                                expect(parms).toMatchSnapshot();
                            })
                        },
                        data: {
                            setMessage: jest.fn((_setMsgArgs) => {
                                // Do nothing
                            }),
                            setObj: jest.fn((_setObjArgs) => {
                                // Do nothing
                            })
                        },
                        console: {
                            log: jest.fn((_logArgs) => {
                                // Do nothing
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

            expect(error.toString()).toContain(`Internal create error:`);
            expect(ArchivedDeleteWorkflow.archivedDeleteWorkflow).toHaveBeenCalledTimes(0);
        });
    });
});
