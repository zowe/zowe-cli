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

import { Rename, IZosFilesResponse } from "../../../../src/api";
import DsHandler from "../../../../src/cli/rename/ds/Ds.handler";
import { ZosFilesBaseHandler } from "../../../../src/cli/ZosFilesBase.handler";

describe("DsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const renameDatasetSpy = jest.spyOn(Rename, "dataSet");

    beforeEach(() => {
        renameDatasetSpy.mockClear();
        renameDatasetSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call Rename.dataSet", async () => {
        const handler = new DsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const beforeDataSetName = "BEFORE.NAME";
        const afterDataSetName = "AFTER.NAME";

        const commandParameters: any = {
            arguments: { beforeDataSetName, afterDataSetName }
        };

        const dummySession = {};

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(renameDatasetSpy).toHaveBeenCalledTimes(1);
        expect(renameDatasetSpy).toHaveBeenLastCalledWith(dummySession, beforeDataSetName, afterDataSetName);
        expect(response).toBe(defaultReturn);
    });
});
