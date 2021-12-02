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

describe("Enable daemon handler", () => {
    let enableHandler: any; // use "any" so we can call private functions
    let enableDaemonSpy: any;

    beforeAll(() => {
        // instantiate our handler and spy on its private enableDaemon() function
        enableHandler = new EnableDaemonHandler();
        enableDaemonSpy = jest.spyOn(enableHandler, "enableDaemon");
    });

    describe("process method", () => {
        it("should enable the daemon", async () => {
            let apiMessage = "";
            let error;
            let jsonObj;
            let logMessage = "";
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await enableHandler.process({
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
                } as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(enableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Daemon mode enabled");
        });
    });

    describe("enableDaemon method", () => {
        it("should return true upon success", async () => {
            const cmdResult = enableHandler.enableDaemon();
            expect(cmdResult.success).toBe(true);
        });
    });
});
