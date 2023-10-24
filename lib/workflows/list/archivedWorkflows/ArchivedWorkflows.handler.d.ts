import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Common Handler for listing archived workflows for a system.
 */
export default class ListArchivedWorkflowsHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @type {*}
     * @memberof ListArchivedWorkflowsHandler
     */
    private arguments;
    /**
     * Handler process - invoked by the command processor to handle the "zos-workflows archived list"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof ListArchivedWorkflowsHandler
     */
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
