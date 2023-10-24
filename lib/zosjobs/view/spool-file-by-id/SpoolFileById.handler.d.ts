import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * "zos-jobs view spool-by-id" command handler. Outputs a single spool DD contents.
 * @export
 * @class SubmitJobHandler
 */
export default class SpoolFileByIdHandler extends ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs view job"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof SubmitDataSetHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
