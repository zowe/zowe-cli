import { ICommandHandler, IHandlerParameters } from "@zowe/imperative";
/**
 * Handler to disable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class DisableDaemonHandler implements ICommandHandler {
    /**
     * Process the disable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    process(cmdParams: IHandlerParameters): Promise<void>;
    /**
     * Disable daemon mode.
     *
     * @throws {ImperativeError}
     */
    private disableDaemon;
    /**
     * Read the process ID for a daemon running for the current user from
     * the pid file of the current user. The format of the PID file is:
     * {
     *     user: string
     *     pid: number
     * }
     *
     * @param daemonPidFileNm The file name containing the PID for the daemon.
     *
     * @returns The Pid of the daemon for the current user.
     *          Returns null if no daemon PID is recorded for the user.
     */
    private static readMyDaemonPid;
}
