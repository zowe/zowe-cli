import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * "zos-jobs modify job" command handler. Modify a job by name and ID.
 * @export
 * @class JobHandler
 * @implements {ICommandHandler}
 */
export default class JobHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof JobHandler
     */
    private arguments;
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs modify job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof JobHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
