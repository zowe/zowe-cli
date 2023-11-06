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

import { AbstractHelpGeneratorFactory, IHelpGenerator, IHelpGeneratorParms } from "../../../../../src";
import { InheritedHelpGenerator } from "./InheritedHelpGenerator";
/**
 * Test implementation for the abstract help generator factory
 * @export
 * @class TestHelpGeneratorFactory
 * @extends {AbstractHelpGeneratorFactory}
 */
export class TestHelpGeneratorFactory extends AbstractHelpGeneratorFactory {
    protected getGenerator(parms: IHelpGeneratorParms): IHelpGenerator {
        return new InheritedHelpGenerator(this.factoryParameters, {
            commandDefinition: parms.commandDefinition,
            fullCommandTree: parms.fullCommandTree
        });
    }
}
