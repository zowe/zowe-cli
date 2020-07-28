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

import { IZosFilesResponse, IRecallOptions, HRecall } from "../../../../src/api";
import DSHandler from "../../../../src/cli/hRecall/ds/Ds.handler";
import { ZosFilesBaseHandler } from "../../../../src/cli/ZosFilesBase.handler";

describe("DsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const recallDataSetSpy = jest.spyOn(HRecall, "dataSet");

    beforeEach(() => {
        recallDataSetSpy.mockClear();
        recallDataSetSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call HRecall.dataSet", async () => {
        const handler = new DSHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD"
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

        expect(recallDataSetSpy).toHaveBeenCalledTimes(1);
        expect(recallDataSetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            undefined
        );
        expect(response).toBe(defaultReturn);
    });
    it("should call HRecall.dataSet with wait = true", async () => {
        const handler = new DSHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);
        const options: IRecallOptions = { "request": "hrecall", "wait": true };

        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD",
                options
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

        const expectedOptions: IRecallOptions = { "request": "hrecall", "wait": true };

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(recallDataSetSpy).toHaveBeenCalledTimes(1);
        expect(recallDataSetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            expectedOptions
        );
        expect(response).toBe(defaultReturn);
    });
});
