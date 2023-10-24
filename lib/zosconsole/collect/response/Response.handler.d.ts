import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Handle to collect a MVS console command response
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosmfBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
