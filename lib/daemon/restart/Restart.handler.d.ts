import { ICommandHandler, IHandlerParameters } from "@zowe/imperative";
/**
 * Handler to disable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class RestartDaemonHandler implements ICommandHandler {
    /**
     * Process the disable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     */
    process(cmdParams: IHandlerParameters): Promise<void>;
    /**
     * Restart daemon mode.
     *
     * @throws {ImperativeError}
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private restartDaemon;
}
