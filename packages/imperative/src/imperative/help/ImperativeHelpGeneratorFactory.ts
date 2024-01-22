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

import { isNullOrUndefined } from "util";
import { IHelpGenerator,
    HelpGeneratorFactory,
    IHelpGeneratorParms,
    AbstractHelpGeneratorFactory } from "../../cmd";
import { IImperativeConfig } from "../doc/IImperativeConfig";
/**
 * Imperative Help generator factory passed to yargs to build help generators where needed.
 * @export
 * @class ImperativeHelpGeneratorFactory
 * @extends {AbstractHelpGeneratorFactory}
 */
export class ImperativeHelpGeneratorFactory extends AbstractHelpGeneratorFactory {
    /**
     * The imperative configuration object contains control parameters for the help generator factorys
     * @private
     * @type {IImperativeConfig}
     * @memberof ImperativeHelpGeneratorFactory
     */
    private mConfig: IImperativeConfig;

    /**
     * Creates an instance of ImperativeHelpGeneratorFactory.
     * @param {string} rootCommandName - The root command name of your CLI.
     * @param {IImperativeConfig} config - The imperative configuration document for your CLI.
     * @memberof ImperativeHelpGeneratorFactory
     */
    constructor(rootCommandName: string, config: IImperativeConfig) {
        super({
            produceMarkdown: false,
            rootCommandName,
            primaryHighlightColor: config.primaryTextColor
        });
    }

    /**
     * Obtains an instance of the help generator
     * @protected
     * @param {IHelpGeneratorParms} parms - See the interface for details
     * @returns {IHelpGenerator} - The help generator instance
     * @memberof ImperativeHelpGeneratorFactory
     */
    protected getGenerator(parms: IHelpGeneratorParms): IHelpGenerator {
        const generatorParms: IHelpGeneratorParms = {
            commandDefinition: parms.commandDefinition,
            fullCommandTree: parms.fullCommandTree,
            experimentalCommandsDescription: parms.experimentalCommandsDescription
        };
        if (isNullOrUndefined(this.config)) {
            return new HelpGeneratorFactory({
                produceMarkdown: this.produceMarkdown,
                primaryHighlightColor: this.primaryHighlightColor,
                rootCommandName: this.rootCommandName
            }).getHelpGenerator(generatorParms);
        } else {
            return new (require(this.config.customHelpGenerator))(generatorParms);
        }
    }

    /**
     * Internal accessor for the configuration object
     * @readonly
     * @private
     * @type {IImperativeConfig}
     * @memberof ImperativeHelpGeneratorFactory
     */
    private get config(): IImperativeConfig {
        return this.mConfig;
    }
}
