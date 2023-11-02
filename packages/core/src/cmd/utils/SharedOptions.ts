/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { Arguments } from "yargs";

import { Constants } from "../../constants";
import { ICommandNodeType } from "../doc/ICommandDefinition";
import { IImperativeError } from "../../error/doc/IImperativeError";
import { ImperativeError } from "../../error/ImperativeError";
import { CommandResponse } from "../response/CommandResponse";
import { Logger } from "../../logger/Logger";

/**
 * Options which can be reused between different Brightside commands
 */
export class SharedOptions {
    /**
     * Promise based API for reading the standard in if the arguments dictate to do so. The response is placed in the
     * arguments to be passed on the the command handlers.
     * @param {Arguments} args - The yargs style command line arguments supplied by the user
     * @param {CommandResponse} response - The command response object (for messages, etc.)
     * @param {ICommandNodeType} commandType - The type of the command
     * @returns {Promise<boolean>} - The promise to be fulfilled (or rejected with an imperative error) - false if
     *                               stdin was read and false if it wasn't
     * @memberof SharedOptions
     */
    public static readStdinIfRequested(args: Arguments, response: CommandResponse, commandType: ICommandNodeType,
        stream = process.stdin): Promise<boolean> {
        return new Promise<boolean>((complete, error) => {
            SharedOptions.readStdin(args, response, commandType, stream, (readErr, attemptedStdinRead) => {
                if (readErr) {
                    error(new ImperativeError({
                        msg: `An Error occurred reading stdin: ${readErr.msg}`,
                        additionalDetails: readErr.additionalDetails
                    }));
                } else {
                    complete(attemptedStdinRead);
                }
            });
        });
    }

    /**
     * Read from standard in until EOF (if the option was specified)
     * @param {Arguments} args - arguments for the command
     * @param {CommandResponse} response - the response object to write to / log to if necessary
     * @param {ICommandNodeType} commandType what type of command might have the --stdin option? If it's not "command"
     *                              this method will return immediately
     * @param {() => void} done - callback for when stdin reading is done. attemptedStdinRead: whether we tried to read standard in
     *                            based on the arguments and command definition
     */
    private static readStdin(args: Arguments, response: CommandResponse, commandType: ICommandNodeType, stream = process.stdin,
        done: (readErr: IImperativeError, attemptedStdinRead: boolean) => void): void {

        /**
         * If this is a module
         */
        if (!args[Constants.STDIN_OPTION]) {
            Logger.getImperativeLogger().debug("Standard input reading not requested. Skipping stdin read");
            done(undefined, false);
            return;
        }

        /**
         * If --stdin wasn't requested, don't try to read it
         */
        if (commandType !== "command") {
            Logger.getImperativeLogger().debug("stdin was requested, but the command definition was not of type 'command'. " +
                "skipping stdin read");
            done(undefined, false);
            return;
        }
        Logger.getImperativeLogger().debug("Will attempt to read stdin");
        let stdinContent: Buffer = Buffer.from([]);
        stream.resume();

        stream.on("data", (chunk: Buffer) => {
            Logger.getImperativeLogger().trace(`Read data from stdin: ${chunk.toString()}`);
            stdinContent = Buffer.concat([stdinContent, chunk]);
        });

        stream.once("end", () => {
            Logger.getImperativeLogger().info("Finished reading stdin");
            args[Constants.STDIN_CONTENT_KEY] = stdinContent;
            done(undefined, true);
        });

        stream.on("error", (error: Error) => {

            const stdinReadError: IImperativeError = {
                msg: "Error encountered while reading from stdin",
                causeErrors: error,
                additionalDetails: error?.message
            };
            done(stdinReadError, true);
            // don't call done, we don't want to continue on an error
        });
    }
}
