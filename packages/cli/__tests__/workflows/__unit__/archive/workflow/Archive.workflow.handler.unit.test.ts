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

import { ArchiveWorkflow, ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";
import { ImperativeError } from "@zowe/imperative";


describe("Archive workflow details handler", () => {
    describe("process method", () => {
        const workflowKey = "fakekey";
        it("should archive workflow details using wf key", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/archive/Archive.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            ArchiveWorkflow.archiveWorkflowByKey = jest.fn(async (session): Promise<any> => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Some wf was archived"
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
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledTimes(1);
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledWith(
                fakeSession,
                workflowKey,
                undefined);
        });
        it("should archive a workflow using workflow name", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/archive/Archive.handler");
            const handler = new handlerReq.default();
            const workflowName = "fake-name";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the archive function
            ArchiveWorkflow.archiveWorkflowByKey = jest.fn(async (session): Promise<any> => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "archived"
                };
            });

            // Mock the list function
            ListWorkflows.getWorkflows = jest.fn(async (session) => {
                fakeSession = session;
                return {workflows: [{workflowKey: `${workflowKey}`, workflowName: `${workflowName}`}]};
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
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledTimes(1);
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledWith(fakeSession, workflowKey);

        });
    });
    describe("fail scenarios", () => {
        it("should fail when attemting to archive with workflow key fails", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/archive/Archive.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";
            const workflowName = "fake-name";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the list function
            ListWorkflows.getWorkflows = jest.fn(async (session) => {
                fakeSession = session;
                return {workflows: [{workflowKey: `${workflowKey}`, workflowName: `${workflowName}`}]};
            });

            // Mock the archive function
            ArchiveWorkflow.archiveWorkflowByKey = jest.fn(async (session) => {
                fakeSession = session;
                throw new ImperativeError ({msg: `archive failed`});
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

            expect(error.toString()).toContain(`archive failed`);
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledTimes(1);
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledWith(fakeSession, workflowKey, undefined);

        });
        it("should fail when no workflows match the provided wf name", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/archive/Archive.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";
            const workflowName = "fake-name";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the archive function
            ArchiveWorkflow.archiveWorkflowByKey = jest.fn(async (session) => {
                fakeSession = session;
                throw new ImperativeError ({msg: `archive failed`});
            });

            // Mock the list function
            ListWorkflows.getWorkflows = jest.fn(async (session) => {
                fakeSession = session;
                return {workflows: []};
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

            expect(error.toString()).toContain("No workflows match the provided workflow name.");
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledTimes(0);

        });
        it("should fail when archivation with workflow name fails", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/archive/Archive.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";
            const workflowName = "fake-name";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the archive function
            ArchiveWorkflow.archiveWorkflowByKey = jest.fn(async (session) => {
                fakeSession = session;
                throw new ImperativeError ({msg: `archive failed`});
            });

            // Mock the list function
            ListWorkflows.getWorkflows = jest.fn(async (session) => {
                fakeSession = session;
                return {workflows: [{workflowKey: `${workflowKey}`, workflowName: `${workflowName}`}]};
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

            expect(error.toString()).toContain(`Some workflows were not archived, please check the message above.`);
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledTimes(1);
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledWith(fakeSession, workflowKey);
        });
        it("should fail when neither workflow key or name is chosen", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/archive/Archive.handler");
            const handler = new handlerReq.default();
            const workflowKey = "fake-workflow-key";
            const workflowName = "fake-name";
            const workflowNothing = "fake-option";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";

            // Mock the archive function
            ArchiveWorkflow.archiveWorkflowByKey = jest.fn((session) => {
                throw new ImperativeError ({msg: `archive failed`});
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
                        workflowNothing
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

            expect(error.toString()).toContain(`Internal create error:`);
            expect(ArchiveWorkflow.archiveWorkflowByKey).toHaveBeenCalledTimes(0);
        });
    });
    describe("Credential censoring in error diagnostics", () => {
        // Distinctive plaintext secrets that must never appear in serialized error output
        const FAKE_PASSWORD = "sup3rSecretP4ssw0rd";
        const FAKE_TOKEN = "sup3rSecretT0kenValue";

        it("should censor credentials in additionalDetails when the archive criteria is invalid", async () => {
            const handlerReq = require("../../../../../src/workflows/archive/Archive.handler");
            const handler = new handlerReq.default();

            let error: any;
            try {
                // Neither workflowKey nor workflowName -> hits the default (internal error) branch
                await handler.processCmd({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        host: "fake-host",
                        user: "fake-user",
                        password: FAKE_PASSWORD,
                        tokenValue: FAKE_TOKEN
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
