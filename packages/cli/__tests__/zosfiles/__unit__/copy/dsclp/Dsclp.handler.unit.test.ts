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
import { Copy, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import DsclpHandler from "../../../../../src/zosfiles/copy/dsclp/Dsclp.handler";
import { ZosFilesBaseHandler } from "../../../../../src/zosfiles/ZosFilesBase.handler";

describe("DsclpHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const copyDatasetSpy = jest.spyOn(Copy, "dataSetCrossLPAR");

    beforeEach(() => {
        copyDatasetSpy.mockClear();
        copyDatasetSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call Copy.dataSetCrossLPAR without members", async () => {
        const handler = new DsclpHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const fromDataSetName = "ABCD";
        const toDataSetName = "EFGH";
        const zosmfProfileString = "zosmf";
        const zosmfProfile = {
            host: "secure.host.com",
            port: 443,
            user: "user",
            password: "password",
            auth: Buffer.from("user:password").toString("base64"),
            rejectUnauthorized: true
        };

        const sessionArgs: any = {
            type: "basic",
            hostname: zosmfProfile.host,
            port: zosmfProfile.port,
            user: zosmfProfile.user,
            password: zosmfProfile.password,
            rejectUnauthorized: zosmfProfile.rejectUnauthorized
        };
        const expectedSession = new Session(sessionArgs);
        const args = {...sessionArgs, host: zosmfProfile.host, password: zosmfProfile.password};

        const commandParameters: any = {
            profiles: {
                get: (type: string) => {
                    if (type === zosmfProfileString) {
                        return zosmfProfile;
                    } else {
                        throw new Error("Invalid profile retrieved by command!");
                    }
                }
            },
            arguments: {
                fromDataSetName,
                toDataSetName
            },
            response: {
                console: {
                    log: jest.fn()
                },
                data: {
                    setObj: jest.fn()
                },
                progress: {
                    startBar: jest.fn((parms) => {
                        // do nothing
                    }),
                    endBar: jest.fn(() => {
                        // do nothing
                    })
                },
                arguments: args
            }
        };

        const dummySession = {};

        const response = await handler.processWithSession(commandParameters, expectedSession);

        expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
        expect(copyDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            { dsn: commandParameters.arguments.toDataSetName },
            { "from-dataset": { dsn: commandParameters.arguments.fromDataSetName } }
        );
        expect(response).toBe(defaultReturn);
    });

    it("should call Copy.dataSetCrossLPAR with members", async () => {
        const handler = new DsclpHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const fromDataSetName = "ABCD";
        const fromMemberName = "mem1";
        const toDataSetName = "EFGH";
        const toMemberName = "mem2";

        const commandParameters: any = {
            arguments: {
                fromDataSetName: `${fromDataSetName}(${fromMemberName})`,
                toDataSetName: `${toDataSetName}(${toMemberName})`
            },
            response: {
                console: {
                    log: jest.fn()
                },
                data: {
                    setObj: jest.fn()
                },
                progress: {
                    startBar: jest.fn((parms) => {
                        // do nothing
                    }),
                    endBar: jest.fn(() => {
                        // do nothing
                    })
                }
            }
        };

        const dummySession = {};

        const apiResponse: IZosFilesResponse = {
            success: true,
            commandResponse: "Success"
        };

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
        expect(copyDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            { dsn: toDataSetName, member: toMemberName },
            { "from-dataset": { dsn: fromDataSetName, member: fromMemberName } }
        );
        expect(response).toBe(defaultReturn);
    });

    it("should call Copy.dataSetCrossLPAR with options", async () => {
        const handler = new DsclpHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const fromDataSetName = "ABCD";
        const toDataSetName = "EFGH";
        const enq = "SHR";
        const replace = true;

        const commandParameters: any = {
            arguments: {
                fromDataSetName,
                toDataSetName,
                enq,
                replace
            },
            response: {
                console: {
                    log: jest.fn()
                },
                data: {
                    setObj: jest.fn()
                },
                progress: {
                    startBar: jest.fn((parms) => {
                        // do nothing
                    }),
                    endBar: jest.fn(() => {
                        // do nothing
                    })
                }
            }
        };

        const dummySession = {};

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
        expect(copyDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            { dsn: commandParameters.arguments.toDataSetName },
            {
                "from-dataset": { dsn: commandParameters.arguments.fromDataSetName },
                "enq": commandParameters.arguments.enq,
                "replace": commandParameters.arguments.replace
            }
        );
        expect(response).toBe(defaultReturn);
    });
});
