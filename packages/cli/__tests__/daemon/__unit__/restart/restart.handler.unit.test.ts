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

import RestartDaemonHandler from "../../../../src/daemon/restart/Restart.handler";

describe("Restart daemon handler", () => {
    let restartHandler: any; // use "any" so we can call private functions
    let restartDaemonSpy: any;

    beforeAll(() => {
        // instantiate our handler and spy on its private restartDaemon() function
        restartHandler = new RestartDaemonHandler();
    });

    beforeEach(() => {
        // remove restartDaemon spy
        restartDaemonSpy?.mockRestore();
    });

    describe("process method", () => {
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

        beforeEach(() => {
            // clear logMessage contents
            logMessage = "";
        });

        it("should succeed when the restartDaemon function succeeds", async () => {
            // spy on our handler's private restartDaemon() function
            restartDaemonSpy = jest.spyOn(restartHandler as any, "restartDaemon");
            restartDaemonSpy.mockImplementation(() => {return;});

            let error;
            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await restartHandler.process(cmdParms);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(restartDaemonSpy).toHaveBeenCalledTimes(1);
            expect(logMessage).toContain("Zowe daemon restart is only valid when daemon mode is enabled.");
        });
    }); // end restartDaemon method
});
