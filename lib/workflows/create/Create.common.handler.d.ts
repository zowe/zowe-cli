import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Common Handler for creating workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class CreateCommonHandler extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof CreateCommonHandler
     */
    private arguments;
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows create"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof CreateCommonHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
