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

import { ICommandDefinition } from "../../doc/ICommandDefinition";
/**
 * The input parameters to the help generator - the command definition and the tree.
 * @export
 * @interface IHelpGeneratorParms
 */
export interface IHelpGeneratorParms {
    /**
     * The command node for the command currently being issued.
     * @type {ICommandDefinition}
     * @memberof IHelpGeneratorFactoryParms
     */
    commandDefinition: ICommandDefinition;
    /**
     * The entire command tree (which includes the command node for the command being issued)
     * @type {ICommandDefinition}
     * @memberof IHelpGeneratorFactoryParms
     */
    fullCommandTree: ICommandDefinition;
    /**
     * The description text for what "experimental" means in the context of your CLI
     * @type {string}
     * @memberof IHelpGeneratorParms
     */
    experimentalCommandsDescription?: string;
    /**
     * The indicator that the given help generator should skip introducing breaks based on terminal width
     * @type {boolean}
     * @memberof IHelpGeneratorParms
     */
    skipTextWrap?: boolean;
}
