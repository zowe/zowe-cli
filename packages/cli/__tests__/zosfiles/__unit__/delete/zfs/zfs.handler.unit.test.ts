import { CommandYargs } from "../../../../../../imperative/src/cmd/src/yargs/CommandYargs";
import { Delete, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import ZfsHandler from "../../../../../src/zosfiles/delete/zfs/zfs.handler";
import { ImperativeError } from "@zowe/imperative";
import Handler from "../../../../../src/provisioning/delete/instance/DeleteInstance.handler";

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
    let processWithSessionSpy: any;

    beforeEach(() => {
        deleteZfsSpy= jest.spyOn(Delete, "zfs");
        deleteZfsSpy.mockClear();
        deleteZfsSpy.mockImplementation(async () => defaultReturn);
    });

    it("should return success: true when --quiet (-fq) flag is used and file is not found", async () => {
        // deleteZfsSpy.mockImplementationOnce(() => {
        //     throw fileNotFoundError;
        // });
        const handler = new ZfsHandler();

        processWithSessionSpy = jest.spyOn(handler, "processWithSession");
        processWithSessionSpy.mockImplementation(() => {
            throw fileNotFoundError;
        });

        const commandParameters: any = {
            arguments: {
                fileSystemName: "ABCD",
                quiet: true,
                forSure: true
            }
        };

        await expect(handler.process(commandParameters)).resolves.toEqual({ success: true });
    });

    it("should throw file not found error (404) when --quiet is not used (-f)", async () => {
        deleteZfsSpy.mockImplementationOnce(() => {
            throw fileNotFoundError;
        });

        const handler = new ZfsHandler();
        const commandParameters: any = {
            arguments: {
                fileSystemName: "ABCD",
                forSure: true // --forSure flag, no --quiet flag
            }
        };

        await expect(handler.processWithSession(commandParameters, {} as any)).rejects.toThrow(ImperativeError);
    });
});
