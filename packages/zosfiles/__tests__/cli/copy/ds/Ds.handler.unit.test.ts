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

import { Copy, IZosFilesResponse } from "../../../../src/api";
import DsHandler from "../../../../src/cli/copy/ds/Ds.handler";
import { ZosFilesBaseHandler } from "../../../../src/cli/ZosFilesBase.handler";

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

        const commandParameters: any = {
            arguments: {
                fromDataSetName,
                toDataSetName,
            },
        };

        const dummySession = {};

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
        expect(copyDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            { dataSetName: commandParameters.arguments.fromDataSetName },
            { dataSetName: commandParameters.arguments.toDataSetName },
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

        const commandParameters: any = {
            arguments: {
                fromDataSetName: `${fromDataSetName}(${fromMemberName})`,
                toDataSetName: `${toDataSetName}(${toMemberName})`,
            }
        };

        const dummySession = {};

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
        expect(copyDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            { dataSetName: fromDataSetName, memberName: fromMemberName },
            { dataSetName: toDataSetName, memberName: toMemberName },
        );
        expect(response).toBe(defaultReturn);
    });
});
