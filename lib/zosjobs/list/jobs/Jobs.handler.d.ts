import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Handler for the "zos-jobs list jobs" command.
 * @export
 * @class JobsHandler
 * @implements {ICommandHandler}
 */
export default class JobsHandler extends ZosmfBaseHandler {
    /**
     * Handler for the "zos-jobs list jobs" command. Produces a tabular list of jobs on spool based on
     * the input parameters.
     * @param {IHandlerParameters} params - see interface for details
     * @returns {Promise<void>} - promise to fulfill or reject when the command is complete
     * @memberof JobsHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
