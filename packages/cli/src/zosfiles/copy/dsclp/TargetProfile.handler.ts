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

import { AbstractSession, IHandlerParameters, ImperativeConfig } from "@zowe/imperative";
import { IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";

/**
 * Handler to load a target profile.
 *
 * TODO Consider migrating code for loading target profiles to Imperative
 */
export default class TargetProfileHandler extends ZosFilesBaseHandler {
    public async process(params: IHandlerParameters): Promise<void> {
        const targetProfileName = params.arguments.targetZosmfProfile;
        let targetCmdArgs: Record<string, any> = {};
        if (targetProfileName != null) {
            if (ImperativeConfig.instance.config.exists) {
                targetCmdArgs = ImperativeConfig.instance.config.api.profiles.get(targetProfileName);
            } else {
                targetCmdArgs = params.profiles.get("zosmf", false, targetProfileName);
            }
        }
        const targetPrefix = "target";
        for (const [k, v] of Object.entries(params.arguments)) {
            if (k.startsWith(targetPrefix) && v != null) {
                const normalizedOptName = k.charAt(targetPrefix.length).toLowerCase() + k.slice(targetPrefix.length + 1);
                targetCmdArgs[normalizedOptName] = v;
            }
        }
        await super.process({
            ...params,
            arguments: { ...params.arguments, ...targetCmdArgs }
        });
    }

    public async processWithSession(_params: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        return {
            success: true,
            commandResponse: undefined,
            apiResponse: { sessCfg: session.ISession }
        };
    }
}
