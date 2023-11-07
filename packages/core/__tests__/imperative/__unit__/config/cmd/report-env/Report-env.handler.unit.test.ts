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

import ReportEnvHandler from "../../../../../../src/imperative/config/cmd/report-env/Report-env.handler";
import { EnvQuery, IGetItemVal } from "../../../../../../src/imperative/config/cmd/report-env/EnvQuery";
import { ItemId } from "../../../../../../src/imperative/config/cmd/report-env/EnvItems";

describe("Handler for config report-env", () => {

    let rptEnvHandler: any; // use "any" so we can call private functions

    beforeAll(() => {
        // instantiate our handler
        rptEnvHandler = new ReportEnvHandler();
    });

    describe("process method", () => {

        // fake command parms passed to process()
        let stdoutMsg = "";
        let stderrMsg = "";
        let apiMessage = "";
        let jsonObj;
        const cmdParms = {
            arguments: {
                $0: "fake",
                _: ["fake"]
            },
            response: {
                data: {
                    setMessage: jest.fn((setMsgArgs) => {
                        apiMessage = setMsgArgs;
                    }),
                    setObj: jest.fn((setObjArgs) => {
                        jsonObj = setObjArgs;
                    }),
                    setExitCode: jest.fn((exitCode) => {
                        return exitCode;
                    })
                },
                console: {
                    log: jest.fn((logArgs) => {
                        stdoutMsg += "\n" + logArgs;
                    }),
                    error: jest.fn((logArgs) => {
                        stderrMsg += "\n" + logArgs;
                    })
                },
                progress: {}
            },
            profiles: {}
        } as any;

        it("should report the output of getEnvItemVal", async () => {
            stdoutMsg = "";
            stderrMsg = "";
            let caughtErr;

            const getEnvItemValOrig = EnvQuery.getEnvItemVal;
            (EnvQuery.getEnvItemVal as any) = jest.fn(async (itemId: ItemId) => {
                let itemResult : IGetItemVal;
                if (itemId === ItemId.NODEJS_VER) {
                    // with this we get code coverage for problem messages
                    itemResult = {
                        itemVal: "19.9.9",
                        itemValMsg: `The Node version for item ${itemId} is bad`,
                        itemProbMsg: "You are using an awful version of Node"
                    };
                } else {
                    itemResult = {
                        itemVal: itemId.toString(),
                        itemValMsg: `The message for item ID ${itemId} is 'all is good'`,
                        itemProbMsg: ""
                    };
                }
                return itemResult;
            });

            try {
                // Invoke the handler with mocked arguments and response functions
                await rptEnvHandler.process(cmdParms);
            } catch (e) {
                caughtErr = e;
            }

            expect(caughtErr).toBeUndefined();
            for (const nextItemId of Object.values(ItemId).filter((v) => !isNaN(Number(v)))) {
                if (nextItemId === ItemId.NODEJS_VER) {
                    expect(stdoutMsg).toContain(`The Node version for item ${nextItemId} is bad`);
                    expect(stdoutMsg).toContain(`You are using an awful version of Node`);
                } else {
                    expect(stdoutMsg).toContain(`item ID ${nextItemId} is 'all is good'`);
                }
            }
            EnvQuery.getEnvItemVal = getEnvItemValOrig;
        });
    }); // end process method
}); // end Handler
