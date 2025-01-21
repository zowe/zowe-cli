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
import DsHandler from "../../../../../src/zosfiles/copy/ds/Ds.handler";
import { ZosFilesBaseHandler } from "../../../../../src/zosfiles/ZosFilesBase.handler";

describe("DsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const copyDatasetSpy = jest.spyOn(Copy, "dataSet");

    beforeEach(() => {
        copyDatasetSpy.mockClear();
        copyDatasetSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call Copy.dataSet without members", async () => {
        const handler = new DsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const fromDataSetName = "ABCD";
        const toDataSetName = "EFGH";
        const enq = "SHR";
        const replace = true;
        const safeReplace = true;
        const responseTimeout: any = undefined;


        const commandParameters: any = {
            arguments: {
                fromDataSetName,
                toDataSetName,
                enq,
                replace,
                safeReplace,
                responseTimeout

            },
            response: {
                console: { promptFn: jest.fn() }
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
                "replace": commandParameters.arguments.replace,
                "responseTimeout": commandParameters.arguments.responseTimeout,
                "safeReplace": commandParameters.arguments.safeReplace,
                "promptFn": expect.any(Function)
            }
        );
        expect(response).toBe(defaultReturn);
    });

    it("should call Copy.dataSet with members", async () => {
        const handler = new DsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const fromDataSetName = "ABCD";
        const fromMemberName = "mem1";
        const toDataSetName = "EFGH";
        const toMemberName = "mem2";
        const enq = "SHR";
        const replace = true;
        const safeReplace = true;
        const responseTimeout: any = undefined;

        const commandParameters: any = {
            arguments: {
                fromDataSetName: `${fromDataSetName}(${fromMemberName})`,
                toDataSetName: `${toDataSetName}(${toMemberName})`,
                enq,
                replace,
                safeReplace,
                responseTimeout
            },
            response: {
                console: { promptFn: jest.fn() }
            }
        };

        const dummySession = {};

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
        expect(copyDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            { dsn: toDataSetName, member: toMemberName },
            {
                "from-dataset": { dsn: fromDataSetName, member: fromMemberName },
                "enq": commandParameters.arguments.enq,
                "replace": commandParameters.arguments.replace,
                "responseTimeout": commandParameters.arguments.responseTimeout,
                "safeReplace": commandParameters.arguments.safeReplace,
                "promptFn": expect.any(Function)
            }
        );
        expect(response).toBe(defaultReturn);
    });

    it("should call Copy.dataSet with options", async () => {
        const handler = new DsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const fromDataSetName = "ABCD";
        const toDataSetName = "EFGH";
        const enq = "SHR";
        const replace = true;
        const safeReplace = true;
        const responseTimeout: any = undefined;

        const commandParameters: any = {
            arguments: {
                fromDataSetName,
                toDataSetName,
                enq,
                replace,
                safeReplace,
                responseTimeout
            },
            response: {
                console: { promptFn: jest.fn() }
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
                "replace": commandParameters.arguments.replace,
                "responseTimeout": commandParameters.arguments.responseTimeout,
                "safeReplace": commandParameters.arguments.safeReplace,
                "promptFn": expect.any(Function)
            }
        );
        expect(response).toBe(defaultReturn);
    });
    it("should prompt the user and return true when input is 'y'", async () => {
        const handler = new DsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);
        const fromDataSetName = "ABCD";
        const toDataSetName = "EFGH";
        const enq = "SHR";
        const replace = true;
        const safeReplace = true;
        const responseTimeout: any = undefined;

        const commandParameters: any = {
            arguments: {
                fromDataSetName,
                toDataSetName,
                enq,
                replace,
                safeReplace,
                responseTimeout
            },
            response: {
                console: { promptFn: jest.fn() }
            }
        };
        const promptMock = jest.fn();
        promptMock.mockResolvedValue("y");

        const promptFn = (handler as any)["promptForSafeReplace"]({ prompt: promptMock });
        const result = await promptFn(commandParameters.arguments.toDataSetName);

        expect(promptMock).toHaveBeenCalledWith(
            "The dataset 'EFGH' exists on the target system. This copy will result in data loss." +
            " Are you sure you want to continue? [y/N]: "
        );
        expect(result).toBe(true);
    });
});
