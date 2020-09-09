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

import { IZosFilesResponse, HDelete } from "../../../../../../../packages/zosfiles/src";
import DSHandler from "../../../../src/delete/mds/Mds.handler";
import { ZosFilesBaseHandler } from "../../../../src/ZosFilesBase.handler";
import { IDeleteOptions } from "../../../../../../../packages/zosfiles/src/methods/hDelete/doc/IDeleteOptions";

describe("MdsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success: true,
        commandResponse: "THIS IS A TEST"
    };

    const hDeleteDataSetSpy = jest.spyOn(HDelete, "dataSet");

    beforeEach(() => {
        hDeleteDataSetSpy.mockClear();
        hDeleteDataSetSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call HDelete.dataSet", async () => {
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

        expect(hDeleteDataSetSpy).toHaveBeenCalledTimes(1);
        expect(hDeleteDataSetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            undefined
        );
        expect(response).toBe(defaultReturn);
    });
    it("should call HDelete.dataSet with wait = true", async () => {
        const handler = new DSHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);
        const options: IDeleteOptions = { wait: true };

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

        const expectedOptions: IDeleteOptions = { wait: true };

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(hDeleteDataSetSpy).toHaveBeenCalledTimes(1);
        expect(hDeleteDataSetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            expectedOptions
        );
        expect(response).toBe(defaultReturn);
    });
    it("should call HDelete.dataSet with purge = true", async () => {
        const handler = new DSHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);
        const options: IDeleteOptions = { purge: true };

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

        const expectedOptions: IDeleteOptions = { purge: true };

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(hDeleteDataSetSpy).toHaveBeenCalledTimes(1);
        expect(hDeleteDataSetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            expectedOptions
        );
        expect(response).toBe(defaultReturn);
    });
});
