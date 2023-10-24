import { AbstractSession, IHandlerParameters } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
/**
 * Handler to upload content from a local directory to a USS directory
 * @export
 */
export default class DirToUSSDirHandler extends ZosFilesBaseHandler {
    processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse>;
    private buildFilesMap;
}
