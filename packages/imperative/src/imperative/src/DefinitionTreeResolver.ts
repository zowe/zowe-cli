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

import { ICommandDefinition } from "../../cmd";
import { isNullOrUndefined } from "util";
import { Logger } from "../../logger";
import * as glob from "glob";
import { ImperativeError } from "../../error";

/**
 * Combines a root command definition with an array of
 * command definition trees into a full tree with the command definitions
 * as children of the root command
 * For Imperative internal use
 */
export class DefinitionTreeResolver {

    /**
     * Get a fully constructed tree of command definitions from everything the  CLI developer has specified
     * @param {string} rootCommandDescription - Description to use for the root command (when
     * @param {string} displayName - the display name for the product/CLI
     * @param {string} callerDir - the directory that any childrenModuleGlobs are relative to
     * @param errorLogger - a logger instance to be used (e.g. a console logger) for errors
     * @param {ICommandDefinition[]} childrenDefinitions - already loaded definitions that have been passed by the user
     * @param {string[]} childrenModuleGlobs - list of globs that match definition files
     * @param {boolean} addBaseProfile - Specifies whether to add optional base profile to command definitions
     * @returns {ICommandDefinition} - the complete command tree
     */
    public static resolve(rootCommandDescription: string,
        displayName: string,
        callerDir: string,
        errorLogger: Logger,
        childrenDefinitions?: ICommandDefinition[],
        childrenModuleGlobs?: string[],
        addBaseProfile?: boolean): ICommandDefinition {
        if (isNullOrUndefined(childrenDefinitions) && isNullOrUndefined(childrenModuleGlobs)) {
            throw new ImperativeError({
                msg: "No command definitions have been provided " +
                "to Imperative. Specify modules and/or definitions on your Imperative" +
                "configuration."
            });
        } else if (childrenDefinitions == null) {
            childrenDefinitions = [];
        } else if (childrenModuleGlobs == null) {
            childrenModuleGlobs = [];
        }
        const root: ICommandDefinition =
            {
                name: "",
                description: rootCommandDescription,
                children: this.combineAllCmdDefs(callerDir, childrenDefinitions, childrenModuleGlobs, addBaseProfile),
                type: "group",
                options: [
                    {
                        name: "version", aliases: ["V"],
                        description: "Display the current version of " + displayName,
                        type: "boolean",
                        conflictsWith: ["available-commands"]
                    },
                    {
                        name: "available-commands", aliases: ["ac"],
                        description: "Displays a list of available commands",
                        type: "boolean",
                        conflictsWith: ["version"]
                    }
                ],
                handler: __dirname + "/handlers/DefaultRootCommandHandler",
                isRoot: true
            };
        (root as any).isRoot = true;
        return root;
    }

    /**
     * Combine all of the command definitions supplied explicitly in the cmdDefs parameter
     * and those command definitions discovered by resolving the supplied cmdModuleGlobs.
     *
     * @param {string} callerDir - the directory that any childrenModuleGlobs are relative to
     *
     * @param {ICommandDefinition[]} cmdDefs - An array of already-resolved definitions
     *
     * @param {string[]} cmdModuleGlobs - list of globs that match definition files
     *
     * @param {boolean} addBaseProfile - Specifies whether to add optional base profile to command definitions
     *
     * @returns {ICommandDefinition[]} - An array of all resolved command definitions
     */
    public static combineAllCmdDefs(
        callerDir: string,
        cmdDefs: ICommandDefinition[] = [],
        cmdModuleGlobs: string[] = [],
        addBaseProfile?: boolean
    ): ICommandDefinition[] {

        this.log.debug("Combining command definitions from caller directory %s, %d command definitions and %d globs",
            callerDir, cmdDefs.length, cmdModuleGlobs.length);
        const allCmdDefs: ICommandDefinition[] = [];

        const globAPI = glob.sync;
        for (const childGlob of cmdModuleGlobs) {
            const matches = globAPI(childGlob, {
                cwd: callerDir
            });

            // user specified module glob, but none matched so we throw an error
            if (matches.length < 1) {
                throw new ImperativeError({
                    msg: "Command module glob for the glob " + childGlob +
                    " did not match any files searching from: " + callerDir
                });
            }

            this.log.trace("Matches for glob '%s' from caller directory '%s':\n%s ", childGlob, callerDir, matches + "");

            for (const match of matches) {
                try {
                    this.log.trace("Attempting load of glob match %s", match);
                    const loadedChild = require(callerDir + "/" + match);
                    this.log.trace("Successfully loaded %s", match);
                    allCmdDefs.push(loadedChild);
                } catch (e) {
                    throw new ImperativeError({
                        msg: "Encountered an error loading one of the files ("
                        + match + ") that matched the provided " +
                        "command module glob for the glob " + glob + ": " + e.message
                    });
                }

            }
        }

        for (const child of cmdDefs) {
            allCmdDefs.push(child);
        }
        return addBaseProfile ? this.addBaseProfile(allCmdDefs) : allCmdDefs;
    }

    /**
     * Append optional base profile to profile type array for all command definitions that have profiles associated.
     * @param cmdDefs - An array of all resolved command definitions
     * @returns {ICommandDefinition[]} - An array of command definitions with base profile added
     */
    private static addBaseProfile(cmdDefs: ICommandDefinition[]): ICommandDefinition[] {
        return cmdDefs.map((cmdDef: ICommandDefinition) => {
            if (cmdDef.profile && Object.keys(cmdDef.profile).length > 0) {
                cmdDef.profile.optional = [...(cmdDef.profile.optional || []), "base"];
            }
            if (cmdDef.children && cmdDef.children.length > 0) {
                cmdDef.children = this.addBaseProfile(cmdDef.children);
            }
            return cmdDef;
        });
    }

    private static get log(): Logger {
        return Logger.getImperativeLogger();
    }
}
