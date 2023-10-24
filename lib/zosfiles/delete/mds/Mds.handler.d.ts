import { AbstractSession, IHandlerParameters } from "@zowe/imperative";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
/**
 * Handler to rename a Data Set
 */
export default class MDSHandler extends ZosFilesBaseHandler {
    processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse>;
}
