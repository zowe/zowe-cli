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
import DisableDaemonHandler from "../../../../src/daemon/disable/Disable.handler";

describe("Disable daemon handler", () => {
    let disableHandler: any; // use "any" so we can call private functions
    let disableDaemonSpy: any;

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
                }),
                setExitCode: jest.fn((exitCode) => {
                    return exitCode;
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
        // instantiate our handler and spy on its private disableDaemon() function
        disableHandler = new DisableDaemonHandler();
    });

    describe("process method", () => {
        it("should disable the daemon", async () => {
            let error;
            const allOkMsg = "Everything worked ok";

            disableDaemonSpy = jest.spyOn(DisableDaemonHandler.prototype as any, "disableDaemon");
            disableDaemonSpy.mockImplementation(() => {return allOkMsg});

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await disableHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(disableDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Daemon mode disabled");
            expect(logMessage).toContain(allOkMsg);
        });
    });
});
