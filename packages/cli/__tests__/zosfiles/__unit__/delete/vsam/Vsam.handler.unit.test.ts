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

import { Delete, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import VsamHandler from "../../../../../src/zosfiles/delete/vsam/Vsam.handler";
import { ZosFilesBaseHandler } from "../../../../../src/zosfiles/ZosFilesBase.handler";

describe("VsamHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const deleteVsamDatasetSpy = jest.spyOn(Delete, "vsam");

    beforeEach(() => {
        deleteVsamDatasetSpy.mockClear();
        deleteVsamDatasetSpy.mockImplementation(async () => defaultReturn as any);
    });

    it("should call Delete.vsam", async () => {
        const handler = new VsamHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD",
                erase : true,
                purge : false
            }
        };

        const dummySession = {
            lazyness: "(n.) An important quality for a developer to have."
        }; // I'm lazy and we don't actually need the object

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(deleteVsamDatasetSpy).toHaveBeenCalledTimes(1);
        expect(deleteVsamDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            {
                erase: commandParameters.arguments.erase,
                purge: commandParameters.arguments.purge
            }
        );
        expect(response).toBe(defaultReturn);
    });
});
