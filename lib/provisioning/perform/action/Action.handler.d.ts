import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Handler to perform action against instance
 * @export
 * @class ActionHandler
 * @implements {ICommandHandler}
 */
export default class ActionHandler extends ZosmfBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
