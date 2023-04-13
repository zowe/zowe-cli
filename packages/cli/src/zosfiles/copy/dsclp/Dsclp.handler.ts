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

import { AbstractSession, ConfigUtils, ConnectionPropsForSessCfg, ICommandArguments, IHandlerParameters,
    IHandlerResponseConsoleApi, ImperativeConfig, ISession, Session } from "@zowe/imperative";
import { Copy, ICrossLparCopyDatasetOptions, IDataSet, IGetOptions, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";
import { ZosFilesBaseHandler } from "../../ZosFilesBase.handler";
import { getDataSet } from "../../ZosFiles.utils";

/**
 * Handler to copy a data set.
 */

export default class DsclpHandler extends ZosFilesBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<IZosFilesResponse> {
        const sourceDataset: IDataSet = getDataSet(commandParameters.arguments.fromDataSetName);
        const targetDataset: IDataSet = getDataSet(commandParameters.arguments.toDataSetName);

        const options: ICrossLparCopyDatasetOptions = {
            "from-dataset": sourceDataset,
            enq: commandParameters.arguments.enq,
            replace: commandParameters.arguments.replace,
            responseTimeout: commandParameters.arguments.responseTimeout,
            targetVolser: commandParameters.arguments.targetVolser,
            targetManagementClass: commandParameters.arguments.targetManagementClass,
            targetStorageClass: commandParameters.arguments.targetStorageClass,
            targetDataClass: commandParameters.arguments.targetDataClass,
            promptFn: this.promptForOverwrite(commandParameters.response.console)
        };

        const sourceOptions: IGetOptions = {
            binary: commandParameters.arguments.binary,
            encoding: commandParameters.arguments.encoding,
            record: commandParameters.arguments.record,
            volume: commandParameters.arguments.volume
        };

        const targetSession = this.loadTargetProfile(commandParameters, session);

        return Copy.dataSetCrossLPAR(session,
            targetDataset,
            options,
            sourceOptions,
            targetSession
        );
    }

    private loadTargetProfile(params: IHandlerParameters, sourceSession: AbstractSession): AbstractSession {
        // TODO Migrate this code to an Imperative utility method
        const targetProfileName = params.arguments.targetZosmfProfile;
        let profileProps: Record<string, any>;
        if (targetProfileName != null) {
            if (ImperativeConfig.instance.config.exists) {
                profileProps = {
                    ...ImperativeConfig.instance.config.api.profiles.get(ConfigUtils.getActiveProfileName("base", params.arguments)),
                    ...ImperativeConfig.instance.config.api.profiles.get(targetProfileName),
                };
            } else {
                profileProps = {
                    ...params.profiles.get("base", false),
                    ...params.profiles.get("zosmf", false, targetProfileName),
                };
            }
        }
        const targetSessCfg: ISession = {
            ...sourceSession.ISession,
            ...(profileProps || {}),
            hostname: profileProps?.host ?? sourceSession.ISession.hostname
        };
        const targetCmdArgs: ICommandArguments = { $0: params.arguments.$0, _: params.arguments._ };
        const targetPrefix = "target";
        for (const [k, v] of Object.entries(params.arguments)) {
            if (k.startsWith(targetPrefix)) {
                const normalizedOptName = k.charAt(targetPrefix.length).toLowerCase() + k.slice(targetPrefix.length + 1);
                targetCmdArgs[normalizedOptName] = v;
            }
        }
        ConnectionPropsForSessCfg.resolveSessCfgProps(targetSessCfg, targetCmdArgs);
        /**
         * Remove existing base64EncodedAuth before creating a new session, otherwise the new id/password will not be
         * picked in the target session
        */
        targetSessCfg.base64EncodedAuth = undefined;

        return new Session(targetSessCfg);
    }

    /**
     * Private function to prompt user if they wish to overwrite an existing dataset.
     */
    private promptForOverwrite(console: IHandlerResponseConsoleApi) {
        return async (targetDSN: string) => {
            const answer: string = await console.prompt(
                `The dataset '${targetDSN}' already exists on the target system. Do you wish to overwrite it? [y/N]: `);
            return (answer != null && (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes"));
        };
    }
}
