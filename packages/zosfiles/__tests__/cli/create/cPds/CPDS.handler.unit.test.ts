/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { Create } from "../../../../src/api/methods/create/Create";
import { CreateDataSetTypeEnum } from "../../../../src/api/methods/create/CreateDataSetType.enum";

describe("Create C-code PDS data set handler", () => {
    describe("process method", () => {
        it("should create a C-code PDS data set if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/create/cPds/CPDS.handler");
            const handler = new handlerReq.default();
            const dataSetName = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the create function
            Create.dataSet = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "created"
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
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        dataSetName
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
            expect(profFunc).toHaveBeenCalledWith("zosmf", false);
            expect(Create.dataSet).toHaveBeenCalledTimes(1);
            expect(Create.dataSet).toHaveBeenCalledWith(fakeSession, CreateDataSetTypeEnum.DATA_SET_C, dataSetName, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});
