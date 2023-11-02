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

import { AbstractHelpGeneratorFactory } from "./abstract/AbstractHelpGeneratorFactory";
import { DefaultHelpGenerator } from "./DefaultHelpGenerator";
import { IHelpGeneratorParms } from "./doc/IHelpGeneratorParms";

/**
 * The default help generator factory - always supplies the default help generator.
 * @export
 * @class HelpGeneratorFactory
 * @extends {AbstractHelpGeneratorFactory}
 */
export class HelpGeneratorFactory extends AbstractHelpGeneratorFactory {
    /**
     * Get an instance of the help generator
     * @param {IHelpGeneratorFactoryParms} parms - See the interface for details
     * @returns {DefaultHelpGenerator}
     * @memberof HelpGeneratorFactory
     */
    protected getGenerator(parms: IHelpGeneratorParms): DefaultHelpGenerator {
        return new DefaultHelpGenerator(this.factoryParameters, parms);
    }
}
