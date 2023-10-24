import { IHandlerParameters } from "@zowe/imperative";
import { ZosTsoBaseHandler } from "@zowe/zos-tso-for-zowe-sdk";
/**
 * Handler to issue command to TSO address space
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends ZosTsoBaseHandler {
    processCmd(params: IHandlerParameters): Promise<void>;
}
