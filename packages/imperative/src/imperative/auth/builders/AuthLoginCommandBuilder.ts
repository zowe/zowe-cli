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

import { AuthCommandBuilder } from "./AuthCommandBuilder";
import { ICommandDefinition } from "../../../cmd";
import { authLoginCommandDesc, authLoginShowTokenDesc } from "../../../messages";
import { Constants } from "../../../constants";
import { TextUtils } from "../../../utilities/TextUtils";

/**
 * Used to build auth login command definitions.
 * Used automatically if you allow the "auth" command group to be generated
 */
export class AuthLoginCommandBuilder extends AuthCommandBuilder {
    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The "login" action string
     */
    public getAction(): string {
        return Constants.LOGIN_ACTION;
    }

    /**
     * Build the full command - includes action group and object command.
     * @return {ICommandDefinition}: The command definition.
     */
    public buildFull(): ICommandDefinition {
        return this.buildAuthSegmentFromConfig();
    }

    /**
     * Builds only the "auth" segment from the auth config.
     * @return {ICommandDefinition}
     */
    protected buildAuthSegmentFromConfig(): ICommandDefinition {
        const authType: string = this.mConfig.serviceName;
        const authCommand: ICommandDefinition = {
            name: authType,
            type: "command",
            summary: this.mConfig.login?.summary,
            description: this.mConfig.login?.description,
            handler: this.mConfig.handler,
            options: [
                {
                    name: "show-token", aliases: ["st"],
                    description: authLoginShowTokenDesc.message,
                    type: "boolean"
                },
                ...(this.mConfig.login?.options || [])
            ],
            examples: this.mConfig.login?.examples,
            profile: {
                optional: [this.mProfileType]
            },
            customize: {}
        };

        if (authCommand.summary == null) {
            authCommand.summary = TextUtils.formatMessage(authLoginCommandDesc.message, {type: authType});
        }
        if (authCommand.description == null) {
            authCommand.description = authCommand.summary;
        }
        return authCommand;
    }
}
