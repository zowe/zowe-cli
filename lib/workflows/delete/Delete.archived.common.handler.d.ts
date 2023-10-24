import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Common handler to delete a workflow instance in z/OSMF.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class DeleteArchivedCommonHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof DeleteArchivedCommonHandler
     */
    private arguments;
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows delete"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof DeleteArchivedCommonHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
