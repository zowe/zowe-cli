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
import EnableDaemonHandler from "../../../../src/daemon/enable/Enable.handler";
import { IDaemonCmdResult } from "../../../../src/daemon/doc/IDaemonCmdResult";

describe("Handler for daemon enable", () => {
    let enableHandler: any; // use "any" so we can call private functions
    let enableDaemonSpy: any;

    // command parms passed to process() by multiple tests
    let apiMessage = "";
    let jsonObj;
    let logMessage = "";
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
                })
            },
            console: {
                log: jest.fn((logArgs) => {
                    logMessage += "\n" + logArgs;
                })
            },
            progress: {}
        },
        profiles: {}
    } as any;

    beforeAll(() => {
        // instantiate our handler and spy on its private enableDaemon() function
        enableHandler = new EnableDaemonHandler();
        enableDaemonSpy = jest.spyOn(EnableDaemonHandler.prototype as any, "enableDaemon");
    });

    beforeEach(() => {
        // ensure that toHaveBeenCalledTimes does not accumulate for enableDaemonSpy between tests
        jest.clearAllMocks();
    });

    describe("process method", () => {
        it("should succeed when the enableDaemon function succeeds", async () => {
            let error;
            const allOkMsg = "Everything worked ok";

            const enableResultOk: IDaemonCmdResult = {
                success: true,
                msgText: allOkMsg
            };
            enableDaemonSpy.mockImplementation(() => {return enableResultOk});

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await enableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(enableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Daemon mode enabled");
            expect(logMessage).toContain(allOkMsg);
        });

        it("should fail when the enableDaemon function fails", async () => {
            let error;
            const badStuffMsg = "Some bad stuff happened";

            const enableResultBad: IDaemonCmdResult = {
                success: false,
                msgText: badStuffMsg
            };
            enableDaemonSpy.mockImplementation(() => {return enableResultBad});

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await enableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(enableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Failed to enable daemon mode");
            expect(logMessage).toContain(badStuffMsg);
        });
    });
});
