/// <reference types="node" />
import { AbstractSession, ICommandArguments, IHandlerParameters } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../ZosFilesBase.handler";
import { CompareBaseHelper } from "./CompareBaseHelper";
/**
 * This class is used by the various zosfiles-compare handlers as the base class for their implementation.
 * All handlers within zosfiles-compare should extend this class.
 *
 * This class should not be used outside of the zosfiles-compare package.
 *
 * @private
 */
export declare abstract class CompareBaseHandler extends ZosFilesBaseHandler {
    /**
     * This will grab the zosmf profile and create a session before calling the subclass
     * {@link ZosFilesBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse>;
    /**
     * Abstract method required for compare handlers to determine how they gather the contents of the file/dataset to compare
     * @param session Gives access to the session object in case the handler needs to submit a request to get the first file
     * @param args Command arguments required for getting the dataset, filepath, or spool descriptor
     * @param helper CompareBaseHelper instance to access prepare- functions
     */
    abstract getFile1(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer>;
    /**
     * Abstract method required for compare handlers to determine how they gather the contents of the file/dataset to compare
     * @param session Gives access to the session object in case the handler needs to submit a request to get the contents
     * @param args Command arguments required for getting the dataset, filepath, or spool descriptor
     * @param helper CompareBaseHelper instance to access prepare- functions
     */
    abstract getFile2(session: AbstractSession, args: ICommandArguments, helper: CompareBaseHelper): Promise<string | Buffer>;
}
