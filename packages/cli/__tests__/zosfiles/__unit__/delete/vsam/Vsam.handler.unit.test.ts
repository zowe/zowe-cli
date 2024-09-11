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

import { Delete, IDeleteVsamResponse } from "@zowe/zos-files-for-zowe-sdk";
import VsamHandler from "../../../../../src/zosfiles/delete/vsam/Vsam.handler";
import { ConnectionPropsForSessCfg, ImperativeError } from "@zowe/imperative";
import { ZosFilesBaseHandler } from "../../../../../src/zosfiles/ZosFilesBase.handler";

describe("VsamHandler", () => {
    const defaultReturn: IDeleteVsamResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST",
        apiResponse    : undefined as any
    };

    const fileNotFoundError = new ImperativeError({
        msg: "IDC3012I ENTRY HLQ.MYNEW.VSAM NOT FOUND",
        additionalDetails: "",
        errorCode: '404'
    });

    let deleteVsamDatasetSpy: any;

    beforeEach(() => {
        jest.spyOn(ConnectionPropsForSessCfg, "addPropsOrPrompt").mockResolvedValue({
            hostname: "example.com"
        });
        deleteVsamDatasetSpy = jest.spyOn(Delete, "vsam");
        deleteVsamDatasetSpy.mockClear();
        deleteVsamDatasetSpy.mockImplementation(async () => defaultReturn);
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

    it("should return success: true when --quiet (-fq) flag is used and file is not found", async () => {
        deleteVsamDatasetSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const handler = new VsamHandler();
        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD",
                erase: true,
                purge: false,
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
        deleteVsamDatasetSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const handler = new VsamHandler();
        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD",
                erase: true,
                purge: false // --erase and --purge flags, but no --quiet flag
            }
        };

        const error = new ImperativeError({ msg: "IDC3012I ENTRY HLQ.MYNEW.VSAM NOT FOUND" });

        await expect(handler.processWithSession(commandParameters, {} as any)).rejects.toThrow(error);
    });
});
