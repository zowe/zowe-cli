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

import { Session } from "@zowe/imperative";
import { List } from "@zowe/zos-files-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";

describe("List Alias handler", () => {
    describe("process method", () => {
        it("should resolve an alias if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../../src/zosfiles/list/alias/Alias.handler");
            const handler = new handlerReq.default();
            const aliasName = "MY.ALIAS.NAME";

            // Vars populated by the mocked function
            let logMessage = "";

            // Mock the resolveAlias function
            (List as any).resolveAlias = jest.fn(async () => {
                return {
                    success: true,
                    commandResponse: "Alias 'MY.ALIAS.NAME' resolved to data set 'REAL.DATASET.NAME'.",
                    apiResponse: {
                        alias: "MY.ALIAS.NAME",
                        targetDsn: "REAL.DATASET.NAME"
                    }
                };
            });

            const fakeSession = new Session({
                hostname: UNIT_TEST_ZOSMF_PROF_OPTS.host,
                port: Number(UNIT_TEST_ZOSMF_PROF_OPTS.port),
                user: UNIT_TEST_ZOSMF_PROF_OPTS.user,
                password: UNIT_TEST_ZOSMF_PROF_OPTS.password,
                type: "basic",
                protocol: "https"
            });

            const setObjMock = jest.fn();

            // Call processWithSession directly to bypass session creation
            const response = await handler.processWithSession({
                arguments: {
                    $0: "fake",
                    _: ["fake"],
                    aliasName
                },
                response: {
                    data: {
                        setMessage: jest.fn(),
                        setObj: setObjMock
                    },
                    console: {
                        log: jest.fn((logArgs) => {
                            logMessage += "\n" + logArgs;
                        })
                    },
                    progress: {
                        startBar: jest.fn(),
                        endBar: jest.fn()
                    }
                }
            } as any, fakeSession);

            expect((List as any).resolveAlias).toHaveBeenCalledTimes(1);
            expect(response.success).toBe(true);
            expect(response.apiResponse.alias).toBe("MY.ALIAS.NAME");
            expect(response.apiResponse.targetDsn).toBe("REAL.DATASET.NAME");
            expect(setObjMock).toHaveBeenCalledTimes(1);
            expect(setObjMock).toHaveBeenCalledWith({
                alias: "MY.ALIAS.NAME",
                targetDsn: "REAL.DATASET.NAME"
            });
        });
    });
});
