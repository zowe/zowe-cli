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

import { ICommandHandler, IHandlerParameters } from "../../../../../cmd";
import { Logger } from "../../../../../logger/";
import { AppSettings } from "../../../../../settings/src/AppSettings";


/**
 * The list command group handler for cli configuration settings.
 *
 */
export default class ListHandler implements ICommandHandler {

    /**
     * A logger for this class
     *
     * @private
     * @type {Logger}
     */
    private log: Logger = Logger.getImperativeLogger();

    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const {values} = params.arguments;
        const overrides = AppSettings.instance.getNamespace("overrides");

        Object.keys(overrides)
            .map((key) =>  values ? `${key} = ${overrides[key]}` : key)
            .forEach(params.response.console.log);
    }
}
