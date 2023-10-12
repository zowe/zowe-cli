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
import { AppSettings } from "../../../../../settings/src/AppSettings";


/**
 * The command group handler for cli configuration settings reset.
 *
 */
export default class ResetHandler implements ICommandHandler {


    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const {configName} = params.arguments;
        AppSettings.instance.set("overrides", configName, false);
    }
}
