import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Handler to list instance variables
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class InstanceVariablesHandler extends ZosmfBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
