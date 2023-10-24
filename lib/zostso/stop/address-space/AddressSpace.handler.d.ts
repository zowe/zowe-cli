import { IHandlerParameters } from "@zowe/imperative";
import { ZosTsoBaseHandler } from "@zowe/zos-tso-for-zowe-sdk";
export default class Handler extends ZosTsoBaseHandler {
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
}
