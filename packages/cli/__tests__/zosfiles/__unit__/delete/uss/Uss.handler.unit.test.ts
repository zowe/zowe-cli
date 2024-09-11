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

import { Delete, IZosFilesResponse, IZosFilesOptions } from "@zowe/zos-files-for-zowe-sdk";
import UssHandler from "../../../../../src/zosfiles/delete/uss/Uss.handler";
import { ImperativeError, ConnectionPropsForSessCfg } from "@zowe/imperative";
import { ZosFilesBaseHandler } from "../../../../../src/zosfiles/ZosFilesBase.handler";

describe("UssHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const fileNotFoundError = new ImperativeError({
        msg: "IDC3012I ENTRY HLQ.MYNEW.FILE NOT FOUND",
        additionalDetails: "",
        errorCode: '404'
    });

    let deleteUssFileSpy: any;

    beforeEach(() => {
        jest.spyOn(ConnectionPropsForSessCfg, "addPropsOrPrompt").mockResolvedValue({
            hostname: "example.com"
        });
        deleteUssFileSpy = jest.spyOn(Delete, "ussFile");
        deleteUssFileSpy.mockClear();
        deleteUssFileSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call Delete.ussFile", async () => {
        const handler = new UssHandler();
        const zosFilesOptions: IZosFilesOptions = { responseTimeout: undefined };

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                fileName: "ABCD"
            }
        };

        const dummySession = {
            lazyness: "(n.) An important quality for a developer to have."
        }; // I'm lazy and we don't actually need the object

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(deleteUssFileSpy).toHaveBeenCalledTimes(1);
        expect(deleteUssFileSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.fileName,
            undefined,
            zosFilesOptions
        );
        expect(response).toBe(defaultReturn);
    });

    it("should return success: true when --quiet (-fq) flag is used and file is not found", async () => {
        deleteUssFileSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const handler = new UssHandler();
        const commandParameters: any = {
            arguments: {
                fileName: "ABCD",
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
        deleteUssFileSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const handler = new UssHandler();
        const commandParameters: any = {
            arguments: {
                fileName: "ABCD"
            }
        };

        const error = new ImperativeError({ msg: "IDC3012I ENTRY HLQ.MYNEW.FILE NOT FOUND" });

        await expect(handler.processWithSession(commandParameters, {} as any)).rejects.toThrow(error);
    });
});
