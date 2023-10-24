import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * "zos-jobs list spool-files" command handler. Outputs a table of spool files.
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
export default class SpoolFilesHandler extends ZosmfBaseHandler {
    /**
     * The z/OSMF profile for this command
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private profile;
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private arguments;
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs list spool-files"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
