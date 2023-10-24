import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Handler to list instance info
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class InstanceInfoHandler extends ZosmfBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
    /**
     * Format the output of instance summary data, options may be used to further refine the output
     * @param {IProvisionedInstance} instance: one or more provisioned instance
     * @param option: command options
     */
    private formatProvisionedInstanceSummaryOutput;
}
