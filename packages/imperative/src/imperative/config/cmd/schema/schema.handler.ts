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

import { ICommandHandler, ICommandProfileTypeConfiguration, IHandlerParameters } from "../../../../../src/cmd";
import { ConfigConstants, ConfigSchema } from "../../../../../src/config";
import { ImperativeConfig } from "../../../../../src/utilities";

/**
 * The get command group handler for cli configuration settings.
 */
export default class SchemaHandler implements ICommandHandler {
    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        let profileConfigs: ICommandProfileTypeConfiguration[];
        try {
            profileConfigs = ImperativeConfig.instance.loadedConfig.profiles;
        } catch (err) {
            params.response.console.error("Failed to load profile schemas");
            return;
        }
        const schema = ConfigSchema.buildSchema(profileConfigs);
        params.response.data.setObj(schema);
        params.response.console.log(JSON.stringify(schema, null, ConfigConstants.INDENT));
    }
}
