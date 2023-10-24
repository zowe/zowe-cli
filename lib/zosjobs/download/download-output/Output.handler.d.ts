import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * "zos-jobs download output" command handler. Download each spool DD to a separate file.
 * @export
 * @class OutputHandler
 * @implements {ICommandHandler}
 */
export default class OutputHandler extends ZosmfBaseHandler {
    /**
     * Command handler process - invoked by the command processor to handle the "zos-jobs download output"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof OutputHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
