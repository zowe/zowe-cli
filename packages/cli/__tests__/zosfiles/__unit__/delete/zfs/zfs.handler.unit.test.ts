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
import ZfsHandler from "../../../../../src/zosfiles/delete/zfs/zfs.handler";
import { ZosFilesBaseHandler } from "../../../../../src/zosfiles/ZosFilesBase.handler";
import { ImperativeError, ConnectionPropsForSessCfg } from "@zowe/imperative";

describe("ZfsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success: true,
        commandResponse: "THIS IS A TEST",
    };

    const fileNotFoundError = new ImperativeError({
        msg: "IDC3012I ENTRY HLQ.MYNEW.ZFS NOT FOUND",
        additionalDetails: "",
        errorCode: '404'
    });

    let deleteZfsSpy: any;

    beforeEach(() => {
        jest.spyOn(ConnectionPropsForSessCfg, "addPropsOrPrompt").mockResolvedValue({
            hostname: "example.com"
        });
        deleteZfsSpy = jest.spyOn(Delete, "zfs");
        deleteZfsSpy.mockClear();
        deleteZfsSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call Delete.zfs", async () => {
        const handler = new ZfsHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                fileSystemName: "ABCD",
                responseTimeout: 5
            }
        };

        const dummySession = {
            lazyness: "(n.) An important quality for a developer to have."
        }; // I'm lazy and we don't actually need the object
        const rtoObject = { responseTimeout: 5 };

        const response = await handler.processWithSession(commandParameters, dummySession as any);

        expect(deleteZfsSpy).toHaveBeenCalledTimes(1);
        expect(deleteZfsSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.fileSystemName,
            rtoObject
        );
        expect(response).toBe(defaultReturn);
    });

    it("should return success: true when --quiet (-fq) flag is used and file is not found", async () => {
        deleteZfsSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const handler = new ZfsHandler();
        const commandParameters: any = {
            arguments: {
                fileSystemName: "ABCD",
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
        deleteZfsSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const handler = new ZfsHandler();
        const commandParameters: any = {
            arguments: {
                fileSystemName: "ABCD",
                forSure: true // --forSure flag, no --quiet flag
            }
        };

        const error = new ImperativeError({ msg: "IDC3012I ENTRY HLQ.MYNEW.ZFS NOT FOUND" });

        await expect(handler.processWithSession(commandParameters, {} as any)).rejects.toThrow(error);
    });
});
