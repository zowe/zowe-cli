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

    it("should call Copy.dataSet without volume", async () => {
        const handler = new DsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                fromDataSetName: "ABCD",
                toDataSetName: "EFGH",
            }
        };

        const dummySession = {
            user: "dummy",
            password: "dummy",
            hostname: "machine",
            port: 443,
            protocol: "https",
            type: "basic"
        };

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
        expect(copyDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.fromDataSetName,
            commandParameters.arguments.toDataSetName,
            {},
        );
        expect(response).toBe(defaultReturn);
    });
});
