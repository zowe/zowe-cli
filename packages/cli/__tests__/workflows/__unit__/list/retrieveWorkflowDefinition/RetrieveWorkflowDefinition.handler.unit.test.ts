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

import { DefinitionWorkflow } from "@zowe/zos-workflows-for-zowe-sdk";

describe("List workflow definition file details handler", () => {
    describe("process method", () => {
        const definitionFilePath = "fake/Path";
        it("should get workflow definition", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/workflows/list/retrieveWorkflowDefinition/RetrieveWorkflowDefinition.handler");
            const handler = new handlerReq.default();


            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            DefinitionWorkflow.getWorkflowDefinition = jest.fn(async (session) => {
                fakeSession = session;
                return {
                    workflowDefaultName: "wf1",
                    workflowDescription: "test workflow properties",
                    workflowID: "Workflow test",
                    workflowVersion: "1.0",
                    vendor: "CA Technologies, a Broadcom company",
                    workflowDefinitionFileMD5Value: "md5value",
                    isCallable: false,
                    containsParallelSteps : false,
                    scope: "instance",
                    category: "general",
                    productID: "CA",
                    productName: "ZOWE",
                    productVersion: "1.0"
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
                        $0: "zowe",
                        _: ["zos-workflows", "list", "definition-file-details" ],
                        definitionFilePath
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
            expect(DefinitionWorkflow.getWorkflowDefinition).toHaveBeenCalledTimes(1);
            expect(DefinitionWorkflow.getWorkflowDefinition).toHaveBeenCalledWith(
                fakeSession,
                undefined,
                definitionFilePath,
                undefined,
                undefined);
        });
    });
});
