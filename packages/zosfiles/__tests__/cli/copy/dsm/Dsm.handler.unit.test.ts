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
import DsHandler from "../../../../src/cli/copy/dsm/Dsm.handler";
import { ZosFilesBaseHandler } from "../../../../src/cli/ZosFilesBase.handler";

describe("DsmHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const copyDatasetSpy = jest.spyOn(Copy, "dataSetMember");

    beforeEach(() => {
        copyDatasetSpy.mockClear();
        copyDatasetSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call Copy.dataSetMember without volume", async () => {
        const handler = new DsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                fromDataSetName: "ABCD",
                fromDataSetMemberName: "UVW",
                toDataSetName: "EFGH",
                toDataSetMemberName: "XYZ",
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
            commandParameters.arguments.fromDataSetMemberName,
            commandParameters.arguments.toDataSetName,
            commandParameters.arguments.toDataSetMemberName,
            {},
        );
        expect(response).toBe(defaultReturn);
    });
});
