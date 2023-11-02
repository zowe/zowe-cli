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

import { IHelpGeneratorFactoryParms } from "../doc/IHelpGeneratorFactoryParms";
import { IHelpGeneratorFactory } from "../doc/IHelpGeneratorFactory";
import { IHelpGeneratorParms } from "../doc/IHelpGeneratorParms";
import { IHelpGenerator } from "../doc/IHelpGenerator";
import { ImperativeExpect } from "../../../expect/ImperativeExpect";

/**
 * The abstract help generator factory class - implemented normally by imperative to provide the help generator
 * object that should be used for your CLI.
 * @export
 * @abstract
 * @class AbstractHelpGeneratorFactory
 */
export abstract class AbstractHelpGeneratorFactory implements IHelpGeneratorFactory {
    /**
     * The root command name of your CLI
     * @private
     * @type {string}
     * @memberof AbstractHelpGeneratorFactory
     */
    private mRootCommandName: string;

    /**
     * The primary highlight color - for terminal/console coloring
     * @private
     * @type {string}
     * @memberof AbstractHelpGeneratorFactory
     */
    private mPrimaryHighlightColor: string;

    /**
     * True to produce markdown instead of the "normal" help text
     * @private
     * @type {boolean}
     * @memberof AbstractHelpGeneratorFactory
     */
    private mProduceMarkdown: boolean;

    /**
     * The input parameters to the factory.
     * @private
     * @type {IHelpGeneratorFactoryParms}
     * @memberof AbstractHelpGeneratorFactory
     */
    private mParms: IHelpGeneratorFactoryParms;

    /**
     * Creates an instance of AbstractHelpGeneratorFactory.
     * @param {IHelpGeneratorFactoryParms} parms - Control parameters and inforamtion required to build help generators
     * @memberof AbstractHelpGeneratorFactory
     */
    constructor(parms: IHelpGeneratorFactoryParms) {
        const err: string = "Help Generator Factory Creation Error:";
        ImperativeExpect.toNotBeNullOrUndefined(parms, `${err} No input parameters were supplied.`);
        ImperativeExpect.keysToBeDefined(parms, ["rootCommandName"], `${err} No root command name was supplied.`);
        this.mParms = parms;
        this.mRootCommandName = parms.rootCommandName;
        // TODO - what is the default color for imperative?
        this.mPrimaryHighlightColor = parms.primaryHighlightColor || "yellow";
        this.mProduceMarkdown = parms.produceMarkdown ?? false;
    }

    /**
     * Verifies the input parameters and returns the help generator instance for the command.
     * @param {IHelpGeneratorParms} parms - The input parameters - see interface for details.
     * @returns {IHelpGenerator}
     * @memberof AbstractHelpGeneratorFactory
     */
    public getHelpGenerator(parms: IHelpGeneratorParms): IHelpGenerator {
        const err: string = "Get Help Generator Parameter Error:";
        ImperativeExpect.toNotBeNullOrUndefined(parms, `${err} No parameters were supplied.`);
        ImperativeExpect.keysToBeDefined(parms, ["commandDefinition"], `${err} No command definition was supplied.`);
        ImperativeExpect.keysToBeDefined(parms, ["fullCommandTree"], `${err} The full command tree was not supplied.`);
        return this.getGenerator(parms);
    }

    /**
     * Implement to return your specific help generator instance.
     * @abstract
     * @param {IHelpGeneratorParms} parms
     * @returns {IHelpGenerator} - The help generator for the command.
     * @memberof AbstractHelpGeneratorFactory
     */
    protected abstract getGenerator(parms: IHelpGeneratorParms): IHelpGenerator;

    /**
     * Accessor of the root command nae.
     * @readonly
     * @protected
     * @type {string}
     * @memberof AbstractHelpGeneratorFactory
     */
    protected get rootCommandName(): string {
        return this.mRootCommandName;
    }

    /**
     * Accessor for the primary highlight color
     * @readonly
     * @protected
     * @type {string}
     * @memberof AbstractHelpGeneratorFactory
     */
    protected get primaryHighlightColor(): string {
        return this.mPrimaryHighlightColor;
    }

    /**
     * Accessor for the produce markdown flag
     * @readonly
     * @protected
     * @type {boolean}
     * @memberof AbstractHelpGeneratorFactory
     */
    protected get produceMarkdown(): boolean {
        return this.mProduceMarkdown;
    }

    /**
     * Accessor for the full list of parameters
     * @readonly
     * @protected
     * @type {IHelpGeneratorFactoryParms}
     * @memberof AbstractHelpGeneratorFactory
     */
    protected get factoryParameters(): IHelpGeneratorFactoryParms {
        return this.mParms;
    }
}
