import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { AbstractSession, IHandlerParameters } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
/**
 * Handler to download an uss file
 * @export
 */
export default class UssFileHandler extends ZosFilesBaseHandler {
    processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse>;
}
