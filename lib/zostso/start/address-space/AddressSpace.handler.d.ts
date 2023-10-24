import { IHandlerParameters } from "@zowe/imperative";
import { ZosTsoBaseHandler } from "@zowe/zos-tso-for-zowe-sdk";
/**
 * Handler to start an address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosTsoBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
