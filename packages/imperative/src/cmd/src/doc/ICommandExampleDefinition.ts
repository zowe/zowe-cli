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
 * Example command definition - used on command definitions to present examples for the user in the help.
 */
export interface ICommandExampleDefinition {
    /**
     * Options for the example command - should be copy/paste-able - besides variable data - i.e.  user name
     */
    options: string;
    /**
     * The example description - what does it do?
     */
    description: string;
    /**
     * Text to prepend to the command and options in the example.
     * Useful for commands that read stdin
     * e.g. "echo hello |"
     */
    prefix?: string;
}
