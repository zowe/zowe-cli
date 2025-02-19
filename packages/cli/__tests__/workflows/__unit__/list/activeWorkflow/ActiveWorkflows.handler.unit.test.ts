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

import { ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";

describe("List workflows handler", () => {
    describe("process method", () => {
        const workflowName = "fakeWorkflow";
        const category = "Category";
        const system = "TESTSYS";
        const owner = "FAKEUID";
        const vendor = "IBM";
        const statusName = "canceled";
        it("should list workflows", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/list/activeWorkflows/ActiveWorkflows.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let fakeSession = null;

            // Mock the create function
            ListWorkflows.getWorkflows = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Some list of workflow(s)",
                    workflows: [
                        {
                            owner: `${owner}`,
                            workflowName: `${workflowName}`,
                            workflowDescription: "Test wf",
                            workflowKey: "Some-key-here"
                        }
                    ]
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
                        $0: "zowe",
                        _: ["zos-workflows", "list", "active-workflows" ],
                        workflowName,
                        category,
                        system,
                        owner,
                        vendor,
                        statusName
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
            expect(ListWorkflows.getWorkflows).toHaveBeenCalledTimes(1);
            expect(ListWorkflows.getWorkflows).toHaveBeenCalledWith(
                fakeSession,
                {
                    workflowName,
                    category,
                    system,
                    owner,
                    vendor,
                    statusName
                });
        });
    });
});
