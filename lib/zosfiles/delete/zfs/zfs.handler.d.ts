import { AbstractSession, IHandlerParameters } from "@zowe/imperative";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
/**
 * Handler to delete a z/OS file system.
 */
export default class ZfsHandler extends ZosFilesBaseHandler {
    processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse>;
}
