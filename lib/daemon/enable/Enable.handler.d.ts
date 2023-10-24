import { ICommandHandler, IHandlerParameters } from "@zowe/imperative";
/**
 * Handler to enable daemon mode.
 * @export
 * @class Handler
 * @implements {ICommandHandler}
 */
export default class EnableDaemonHandler implements ICommandHandler {
    private static openNewTerminalMsg;
    /**
     * Process the enable daemon command and populates the response
     * object as needed.
     *
     * @param {IHandlerParameters} cmdParams Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    process(cmdParams: IHandlerParameters): Promise<void>;
    /**
     * Enable daemon mode. We extract our native executable and place it
     * in ZOWE_CLI_HOME/bin.
     *
     * @throws {ImperativeError}
     *
     * @param {boolean} canAskQuestions Can we interactively ask the user questions?
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private enableDaemon;
    /**
     * Unzip, from a gzipped tar file, any file that contains fileToExtract as a
     * substring of the file name. The file will be placed into toDir.
     * We expect toDir to already exist.
     *
     * @param tgzFile The gzipped tar file that we will extract
     *
     * @param toDir The directory into which we extract files
     *
     * @param fileToExtract The file name (or substring of the file name) to extract.
     *
     * @throws {ImperativeError}
     * @returns A void promise to synchronize this operation.
     */
    private unzipTgz;
    /**
     * Add our .zowe/bin directory to the user's PATH.
     *
     * @param pathToZoweBin The absolute path to our .zowe/bin drectory.
     *
     * @param {IDaemonEnableQuestions} userQuestions Questions for user (if permitted)
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private addZoweBinToPath;
    /**
     * Add our .zowe/bin directory to the front of the user's PATH on Windows.
     *
     * @param pathToZoweBin The absolute path to our .zowe/bin drectory.
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private addZoweBinOnWindows;
    /**
     * Add our .zowe/bin directory to the front of the user's PATH on Linux and MAC.
     * Do that by adding a line at the end of the user's .profile file.
     *
     * @param pathToZoweBin The absolute path to our .zowe/bin drectory.
     *
     * @returns {string} An informational message to display to the user after
     *          successful completion of the operation.
     */
    private addZoweBinOnPosix;
}
