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

import { IHelpGeneratorParms } from "./IHelpGeneratorParms";
import { IHelpGenerator } from "./IHelpGenerator";
/**
 * Help generator factory interface - implemented by the AbstractHelpGeneratorFactory (which is then extended
 * to suit the needs of the implementation)
 * @export
 * @interface IHelpGeneratorFactory
 */
export interface IHelpGeneratorFactory {
    /**
     * Create an instance of the help generator for the command.
     * @param {IHelpGeneratorParms} parms - The generator parameters - See Interface for details.
     * @returns {IHelpGenerator}
     * @memberof IHelpGeneratorFactory
     */
    getHelpGenerator(parms: IHelpGeneratorParms): IHelpGenerator;
}
