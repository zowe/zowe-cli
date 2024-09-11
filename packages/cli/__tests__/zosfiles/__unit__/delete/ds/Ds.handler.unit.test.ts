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
import DsHandler from "../../../../../src/zosfiles/delete/ds/Ds.handler";
import { ZosFilesBaseHandler } from "../../../../../src/zosfiles/ZosFilesBase.handler";
import { ImperativeError, ConnectionPropsForSessCfg } from "@zowe/imperative";

describe("DsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const fileNotFoundError = new ImperativeError({
        msg: "IDC3012I ENTRY HLQ.MYNEW.DATASET NOT FOUND",
        additionalDetails: "",
        errorCode: '404'
    });

    let deleteDatasetSpy: any;

    beforeEach(() => {
        jest.spyOn(ConnectionPropsForSessCfg, "addPropsOrPrompt").mockResolvedValue({
            hostname: "example.com"
        });
        deleteDatasetSpy = jest.spyOn(Delete, "dataSet");
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

    it("should return success: true when --quiet (-fq) flag is used and dataset is not found", async () => {
        deleteDatasetSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const handler = new DsHandler();
        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD",
                quiet: true,
            },
            response: {
                progress: { endBar: jest.fn() },
                data: { setObj: jest.fn() }
            }
        };

        await expect(handler.process(commandParameters)).resolves.toBe(undefined);
    });

    it("should throw file not found error (404) when --quiet is not used (-f)", async () => {
        deleteDatasetSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const handler = new DsHandler();
        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD"
            }
        };

        const error = new ImperativeError({ msg: "IDC3012I ENTRY HLQ.MYNEW.DATASET NOT FOUND" });

        await expect(handler.processWithSession(commandParameters, {} as any)).rejects.toThrow(error);
    });
});
