import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Common handler to start a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class WorkflowFullHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof WorkflowFullHandler
     */
    private arguments;
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows start full-workflow
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof WorkflowFullHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
