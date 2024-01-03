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

import { AbstractCommandBuilder } from "../../../../../../cmd/src/builders/AbstractCommandBuilder";
import { ICommandDefinition } from "../../../../../../cmd";
import { Logger } from "../../../../../../logger";
import { ICommandProfileAutoInitConfig } from "../../../../../../cmd/src/doc/profiles/definition/ICommandProfileAutoInitConfig";
import { ImperativeError } from "../../../../../../error";
import { TextUtils } from "../../../../../../utilities";
import { autoInitCommandDesc, autoInitCommandSummary } from "../../../../../../messages";
import { Constants } from "../../../../../../constants";
import { AutoInitConstants } from "../AutoInitConstants";

/**
 * Class for generating auth-related commands
 */
export class AutoInitCommandBuilder implements AbstractCommandBuilder {

    /**
     * Auth config for the command.
     */
    protected mConfig: ICommandProfileAutoInitConfig;

    /**
     * Construct the builder based on the auth config.
     * @param mProfileType - the profile name of the profile type e.g. banana
     * @param {Logger} mLogger - logger instance to use for the builder class
     * @param {IImperativeAuthConfig} mAuthConfig - the config for the auth type
     */
    constructor(protected mLogger: Logger,
        protected mAutoInitConfig: ICommandProfileAutoInitConfig,
        protected mProfileType?: string) {

        this.mConfig = mAutoInitConfig;
        if (this.mConfig == null) {
            throw new ImperativeError({msg: `Auto-init Builder Error: No auto-init config was supplied.`});
        }
    }

    /**
     * Build the command
     * @return {ICommandDefinition}: The command definition.
     */
    public buildFull(): ICommandDefinition {
        return this.build();
    }

    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The auth action string
     */
    public getAction(): string {
        return Constants.AUTO_INIT_ACTION;
    }

    /**
     * Build the command
     * @return {ICommandDefinition}
     */
    public build(): ICommandDefinition {
        return this.buildAutoInitSegmentFromConfig();
    }

    /**
     * Builds only the "auto-init" segment from the auto-init config.
     * @return {ICommandDefinition}
     */
    protected buildAutoInitSegmentFromConfig(): ICommandDefinition {
        const autoInitCommand: ICommandDefinition = {
            name: "auto-init",
            type: "command",
            summary: this.mConfig.autoInit?.summary,
            description: this.mConfig.autoInit?.description,
            handler: this.mConfig.handler,
            options: [
                AutoInitConstants.AUTO_INIT_OPTION_USER_CONFIG,
                AutoInitConstants.AUTO_INIT_OPTION_GLOBAL_CONFIG,
                AutoInitConstants.AUTO_INIT_OPTION_DRY_RUN,
                AutoInitConstants.AUTO_INIT_OPTION_EDIT,
                AutoInitConstants.AUTO_INIT_OPTION_EDITOR,
                AutoInitConstants.AUTO_INIT_OPTION_OVERWRITE,
                AutoInitConstants.AUTO_INIT_OPTION_FOR_SURE,
                ...(this.mConfig.autoInit?.options || [])
            ],
            examples: this.mConfig.autoInit?.examples,
            customize: {}
        };

        if (autoInitCommand.summary == null) {
            autoInitCommand.summary = TextUtils.formatMessage(autoInitCommandSummary.message, {source: this.mConfig.provider});
        }
        if (autoInitCommand.description == null) {
            autoInitCommand.description = TextUtils.formatMessage(autoInitCommandDesc.message, {source: this.mConfig.provider});
        }
        if (this.mProfileType != null) {
            autoInitCommand.profile = {};
            autoInitCommand.profile.optional = [this.mProfileType];
        }
        return autoInitCommand;
    }
}
