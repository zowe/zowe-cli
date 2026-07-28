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

import * as path from "path";
import { ICommandHandler, IHandlerParameters, ImperativeConfig, ImperativeError, TextUtils } from "../../../../..";

export default class ExportRedactedHandler implements ICommandHandler {
    public async process(params: IHandlerParameters): Promise<void> {
        try {
            const config = ImperativeConfig.instance.config;

            if (!config.exists) {
                throw new ImperativeError({
                    msg: "No Zowe configuration found. Please initialize a configuration first using 'zowe config init'."
                });
            }

            const exportDir = params.arguments.exportDir || process.cwd();
            const isDryRun = params.arguments.dryRun;
            const redactOpts = {
                redactStrings: params.arguments.redactStrings,
                redactNumbers: params.arguments.redactNumbers,
                redactBooleans: params.arguments.redactBooleans,
                hideSecureFields: params.arguments.hideSecureFields,
                redactProfileNames: params.arguments.redactProfileNames,
                showHostPath: params.arguments.showHostPath
            };

            params.response.console.log(
                "Warning: Review the redacted output carefully before sharing or placing it anywhere external " +
                "or sensitive.\n"
            );

            if (isDryRun) {
                const redactedLayers = config.api.redact.getRedactedLayers(redactOpts);
                const dryRunOutputs: any = {};
                let hasOutput = false;

                for (const { source, redactedConfig } of redactedLayers) {
                    const formattedOutput = JSON.stringify(redactedConfig, null, 2);

                    if (hasOutput) {
                        params.response.console.log("\n" + "=".repeat(TextUtils.DEFAULT_WRAP_WIDTH) + "\n");
                    }
                    params.response.console.log(`--- ${source} ---`);
                    params.response.console.log(formattedOutput);
                    dryRunOutputs[source] = redactedConfig;
                    hasOutput = true;
                }
                params.response.data.setObj(dryRunOutputs);
            } else {
                const exportedFiles = config.api.redact.exportToDirectory(exportDir, redactOpts);
                const maxSourceLength = Math.max(...exportedFiles.map(file => file.source.length));
                for (const file of exportedFiles) {
                    const relativeTarget = path.relative(process.cwd(), file.target!);
                    const paddedSource = file.source.padEnd(maxSourceLength);
                    params.response.console.log(`${paddedSource} exported to ${relativeTarget}`);
                }
            }

        } catch (error) {
            throw new ImperativeError({
                msg: `Failed to export configuration: ${error.message}`,
                causeErrors: error
            });
        }
    }
}
