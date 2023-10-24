import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * A Handler for listing details of a workflow instance in z/OSMF in zosworkflows package.
 * This is not something that is intended to be used outside of this npm package.
 */
export default class ActiveWorkflowDetails extends ZosmfBaseHandler {
    /**
     * Command line arguments passed
     * @private
     * @type {*}
     * @memberof PropertiesCommonHandler
     */
    private arguments;
    /**
     * Command handler process - invoked by the command processor to handle the "zos-workflows list active-workflow-details"
     * @param {IHandlerParameters} params - Command handler parameters
     * @returns {Promise<void>} - Fulfilled when the command completes successfully OR rejected with imperative error
     * @memberof PropertiesCommonHandler
     */
    processCmd(params: IHandlerParameters): Promise<void>;
}
