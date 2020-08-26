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

import { Delete, IZosFilesResponse } from "../../../../../../../packages/zosfiles/src";
import DsHandler from "../../../../src/delete/ds/Ds.handler";
import { ZosFilesBaseHandler } from "../../../../src/ZosFilesBase.handler";

describe("DsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const deleteDatasetSpy = jest.spyOn(Delete, "dataSet");

    beforeEach(() => {
        deleteDatasetSpy.mockClear();
        deleteDatasetSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call Delete.dataSet without volume", async () => {
        const handler = new DsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD"
            }
        };

        const dummySession = {
            lazyness: "(n.) An important quality for a developer to have."
        }; // I'm lazy and we don't actually need the object

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(deleteDatasetSpy).toHaveBeenCalledTimes(1);
        expect(deleteDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            {}
        );
        expect(response).toBe(defaultReturn);
    });

    it("should call Delete.dataSet with volume", async () => {
        const handler = new DsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD",
                volume: "SOMEVOL"
            }
        };

        const dummySession = {
            lazyness: "(n.) An important quality for a developer to have."
        }; // I'm lazy and we don't actually need the object

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(deleteDatasetSpy).toHaveBeenCalledTimes(1);
        expect(deleteDatasetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            {
                volume: commandParameters.arguments.volume
            }
        );
        expect(response).toBe(defaultReturn);
    });
});
