import { AbstractSession, IHandlerParameters } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
/**
 * Handler to rename a Data Set
 */
export default class DSHandler extends ZosFilesBaseHandler {
    processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse>;
}
