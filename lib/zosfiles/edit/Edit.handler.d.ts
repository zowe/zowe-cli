import { AbstractSession, IHandlerParameters } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../ZosFilesBase.handler";
/**
 * Handler to Edit USS or DS content locally
 * @export
 */
export default class EditHandler extends ZosFilesBaseHandler {
    processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse>;
}
