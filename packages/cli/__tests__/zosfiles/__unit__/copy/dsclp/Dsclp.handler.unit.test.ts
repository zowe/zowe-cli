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
        const targetUser = "dummy";
        const targetPassword = "dummy";
        const targetHost = "secure.host.com";

        const commandParameters: any = {
            arguments: {
                fromDataSetName: fromDataSetName,
                toDataSetName: toDataSetName,
                targetUser,
                targetPassword,
                targetHost,
                rejectUnauthorized: true,
            },
            response: {
                console: {}
            }
        };

        const dummySession = {};

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
        expect(copyDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            { dsn: commandParameters.arguments.toDataSetName },
            {
                targetUser: "dummy",
                targetPassword : "dummy",
                targetHost : "secure.host.com",
                rejectUnauthorized: true,
            },
            { },
            {
                "from-dataset": { dsn: commandParameters.arguments.fromDataSetName },
            },
            { }
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
        const targetUser = "dummy";
        const targetPassword = "dummy";
        const targetHost = "secure.host.com";

        const commandParameters: any = {
            arguments: {
                fromDataSetName:`${fromDataSetName}(${fromMemberName})`,
                toDataSetName: `${toDataSetName}(${toMemberName})`,
                targetUser,
                targetPassword,
                targetHost
            },
            response: {
                console: {}
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
            { dsn: toDataSetName, member: toMemberName},
            {
                targetUser: "dummy",
                targetPassword : "dummy",
                targetHost : "secure.host.com",
                rejectUnauthorized: true,
            },
            { },
            {
                "from-dataset": { dsn: fromDataSetName, member: fromMemberName },
                replace: undefined,
                responseTimeout: undefined
            },
            { }
        );
        expect(response).toBe(defaultReturn);
    });

    it("should call Copy.dataSetCrossLPAR with options", async () => {
        const handler = new DsclpHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const fromDataSetName = "ABCD";
        const toDataSetName = "EFGH";
        const targetUser = "dummy";
        const targetPassword = "dummy";
        const targetHost = "secure.host.com";

        const commandParameters: any = {
            arguments: {
                fromDataSetName,
                toDataSetName,
                targetUser,
                targetPassword,
                targetHost
            },
            response: {
                console: {},
            }
        };

        const dummySession = {};

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
        expect(copyDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            { dsn: commandParameters.arguments.toDataSetName },
            {
                targetUser: "dummy",
                targetPassword : "dummy",
                targetHost : "secure.host.com",
                rejectUnauthorized: true,
            },
            { },
            {
                "from-dataset": { dsn: commandParameters.arguments.fromDataSetName },
            },
            { }
        );
        expect(response).toBe(defaultReturn);
    });
});
