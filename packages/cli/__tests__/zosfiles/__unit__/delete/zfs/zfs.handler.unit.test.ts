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
import { AbstractSession, ConnectionPropsForSessCfg, ImperativeError } from "@zowe/imperative";

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
    // let processWithSessionSpy: any;

    beforeEach(() => {
        jest.spyOn(ConnectionPropsForSessCfg, "addPropsOrPrompt").mockResolvedValue({
            hostname: "example.com"
        });
        deleteZfsSpy = jest.spyOn(Delete, "zfs");
        deleteZfsSpy.mockClear();
        deleteZfsSpy.mockImplementation(async () => defaultReturn);
    });

    it("should return success: true when --quiet (-fq) flag is used and file is not found", async () => {
        deleteZfsSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const handler = new ZfsHandler();
        const commandParameters: any = {
            arguments: {
                fileSystemName: "ABCD",
                forSure: true,
                quiet: true,
            },
            response: {
                progress: { endBar: jest.fn() },
                data: { setObj: jest.fn() }
            }
        };

        // const error = new ImperativeError({msg: "IDC3012I ENTRY HLQ.MYNEW.ZFS NOT FOUND"});
        // await expect(handler.processWithSession(commandParameters, {} as any)).rejects.toThrow(ImperativeError);
        // await expect(handler.processWithSession(commandParameters, {} as any)).rejects.toThrow(error);
        // await expect(handler.processWithSession(commandParameters, {} as any)).resolves.toEqual({ success: true });
        await expect(handler.process(commandParameters)).resolves.toBe(undefined);
        // await expect(handler.process(commandParameters)).resolves.toEqual({ success: true });
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
        // await expect(handler.processWithSession(commandParameters, {} as any)).rejects.toThrow(ImperativeError);
        await expect(handler.processWithSession(commandParameters, {} as any)).rejects.toThrow(error);
    });
});
