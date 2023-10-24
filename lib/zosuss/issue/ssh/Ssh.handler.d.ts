import { IHandlerParameters } from "@zowe/imperative";
import { SshBaseHandler } from "@zowe/zos-uss-for-zowe-sdk";
/**
 * Handle to issue an USS ssh command
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class Handler extends SshBaseHandler {
    private parameters;
    processCmd(commandParameters: IHandlerParameters): Promise<void>;
    handleStdout(data: string): void;
}
