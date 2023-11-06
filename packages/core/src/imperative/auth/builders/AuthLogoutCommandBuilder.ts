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
import { ICommandDefinition } from "../../../cmd/doc/ICommandDefinition";
import { authLogoutCommandDesc } from "../../../messages/CoreMessages";
import { Constants } from "../../../constants";
import { TextUtils } from "../../../utils/TextUtils";

/**
 * Used to build auth logout command definitions.
 * Used automatically if you allow the "auth" command group to be generated
 */
export class AuthLogoutCommandBuilder extends AuthCommandBuilder {
    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The "logout" action string
     */
    public getAction(): string {
        return Constants.LOGOUT_ACTION;
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
            summary: this.mConfig.logout?.summary,
            description: this.mConfig.logout?.description,
            handler: this.mConfig.handler,
            options: this.mConfig.logout?.options,
            examples: this.mConfig.logout?.examples,
            profile: {
                optional: [this.mProfileType]
            },
            customize: {}
        };

        if (authCommand.summary == null) {
            authCommand.summary = TextUtils.formatMessage(authLogoutCommandDesc.message, {type: authType});
        }
        if (authCommand.description == null) {
            authCommand.description = authCommand.summary;
        }
        return authCommand;
    }
}
