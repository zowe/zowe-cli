import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Handler to list registry instances
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class RegistryInstancesHandler extends ZosmfBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
    /**
     * Format the output of instance summary data, options may be used to further refine the output
     * @param {IProvisionedInstance} instances: one or more provisioned instance
     * @param showAllInfo : display summary (default) or all information fields
     */
    private formatProvisionedInstancesSummaryOutput;
}
