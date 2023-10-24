import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Handler to show zosmf information
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosmfBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
