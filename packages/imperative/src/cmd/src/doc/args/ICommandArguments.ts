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

/**
 * Imperative command arguments. Originally created by Yargs parse and
 * completed by Imperative. Passed to command handlers.
 *
 * The object contains two properties always present ($0 and _) and the rest of
 * the object will contain the option names, in both camel, kebab, and alias as
 * the keys with their values being plugged in by from CLI options, ENV vars,
 * profiles, or default values.
 */
export interface ICommandArguments {
    /**
     * The "executable" - normally the main entry point of the node application.
     * @example "main.js"
     * @type {string}
     */
    $0: string;
    /**
     * The set of command segments and positional operands in an array.
     * @type {(string | number)[]}
     * @example ["create", "file", "text.txt"]
     */
    _: (string | number)[];
    /**
     * Index signature.
     */
    [key: string]: any;
}
