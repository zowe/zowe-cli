import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * "zos-jobs view all-spool-content" command handler. Outputs details regarding a z/OS job.
 * @export
 * @class SubmitJobHandler
 * @implements {ICommandHandler}
 */
export default class AllSpoolContentHandler extends ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs view all-spool-content"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
