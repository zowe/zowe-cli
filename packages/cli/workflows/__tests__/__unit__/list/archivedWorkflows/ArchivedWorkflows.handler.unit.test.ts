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

import { ListArchivedWorkflows } from "../../../../src/api/ListArchivedWorkflows";


describe("List archived workflows common handler", () => {
    describe("process method", () => {
        it("should list all archived workflows", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/list/archivedWorkflows/ArchivedWorkflows.handler");
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
            ListArchivedWorkflows.listArchivedWorkflows = jest.fn((session) => {
                fakeSession = session;
                return {archivedWorkflows: [{workflowKey: `${workflowKey}`, workflowName: `${workflowName}`}]};
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
                        _: ["fake"]
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
            expect(ListArchivedWorkflows.listArchivedWorkflows).toHaveBeenCalledTimes(1);
            expect(ListArchivedWorkflows.listArchivedWorkflows).toHaveBeenCalledWith(fakeSession);

        });
    });
});
