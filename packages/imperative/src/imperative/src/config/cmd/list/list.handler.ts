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

import * as lodash from "lodash";
import { ICommandHandler, IHandlerParameters } from "../../../../../cmd";
import { ConfigConstants } from "../../../../../config";
import { ImperativeConfig } from "../../../../../utilities";
import { EnvironmentalVariableSettings } from "../../../env/EnvironmentalVariableSettings";

export default class ListHandler implements ICommandHandler {
    /**
     * Process the command and input.
     *
     * @param {IHandlerParameters} params Parameters supplied by yargs
     *
     * @throws {ImperativeError}
     */
    public async process(params: IHandlerParameters): Promise<void> {
        const config = ImperativeConfig.instance.config;
        const property = params.arguments.property;
        const showSecureArgs = EnvironmentalVariableSettings.read(
            ImperativeConfig.instance.envVariablePrefix
        ).showSecureArgs.value.toUpperCase() === "TRUE";

        // Populate the print object
        let obj: any = {};
        if (config.exists) {
            if (params.arguments.locations) {
                for (const layer of config.layers) {
                    if (layer.exists) {
                        obj[layer.path] = layer.properties;
                        if (obj[layer.path] != null && !showSecureArgs) {
                            for (const secureProp of config.api.secure.secureFields(layer)) {
                                if (lodash.has(obj[layer.path], secureProp)) {
                                    lodash.set(obj[layer.path], secureProp, ConfigConstants.SECURE_VALUE);
                                }
                            }
                        }
                        if (property != null)
                            obj[layer.path] = (layer.properties as any)[property];
                    }
                }
            } else {
                if (showSecureArgs) {
                    obj = config.properties;
                } else {
                    obj = config.maskedProperties;
                }
                if (property != null)
                    obj = obj[property];
            }
        }

        // If requested, only include the root property name
        if (params.arguments.nameOnly && lodash.isObject(obj)) {
            obj = Object.keys(obj);
        }

        // output to terminal
        params.response.data.setObj(obj);
        params.response.format.output({
            output: obj,
            format: Array.isArray(obj) ? "list" : "object"
        });
    }
}
