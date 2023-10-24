import { IHandlerParameters } from "@zowe/imperative";
import { ZosmfBaseHandler } from "@zowe/zosmf-for-zowe-sdk";
/**
 * Handle to get logs from z/OSMF restful api
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class LogsHandler extends ZosmfBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
