import { AbstractSession, IHandlerParameters } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
/**
 * Handler to download all members from a pds
 * @export
 */
export default class UssDirHandler extends ZosFilesBaseHandler {
    processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse>;
}
