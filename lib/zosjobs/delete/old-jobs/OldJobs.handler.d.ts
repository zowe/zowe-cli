import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * "zos-jobs delete old-jobs" command handler. Delete (purge) multiple jobs in OUTPUT status.
 * @export
 * @class OldJobsHandler
 * @implements {ICommandHandler}
 */
export default class OldJobsHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof OldJobsHandler
     */
    private arguments;
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs delete job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof OldJobsHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
