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

import { ListWorkflows } from "../../../../src/api/ListWorkflows";

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
            const handlerReq = require("../../../../src/cli/list/activeWorkflows/List.activeWorkflows.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            ListWorkflows.listWorkflows = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "Some list of workflow(s)"
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
                        category,
                        system,
                        owner,
                        vendor,
                        statusName,
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
            expect(ListWorkflows.listWorkflows).toHaveBeenCalledTimes(1);
            expect(ListWorkflows.listWorkflows).toHaveBeenCalledWith(
                fakeSession,
                undefined,
                workflowName,
                category,
                system,
                owner,
                vendor,
                statusName,);
        });
    });
});
