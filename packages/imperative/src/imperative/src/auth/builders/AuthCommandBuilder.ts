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

import { AbstractCommandBuilder } from "../../../../cmd/src/builders/AbstractCommandBuilder";
import { ICommandDefinition } from "../../../../cmd";
import { Logger } from "../../../../logger";
import { ICommandProfileAuthConfig } from "../../../../cmd/src/doc/profiles/definition/ICommandProfileAuthConfig";
import { ImperativeError } from "../../../../error";

/**
 * Abstract class for generating auth-related commands
 */
export abstract class AuthCommandBuilder implements AbstractCommandBuilder {

    /**
     * Auth config for the command.
     */
    protected mConfig: ICommandProfileAuthConfig;

    /**
     * Construct the builder based on the auth config.
     * @param mProfileType - the profile name of the profile type e.g. banana
     * @param {Logger} mLogger - logger instance to use for the builder class
     * @param {IImperativeAuthConfig} mAuthConfig - the config for the auth type
     */
    constructor(protected mProfileType: string,
        protected mLogger: Logger,
        protected mAuthConfig: ICommandProfileAuthConfig) {

        this.mConfig = mAuthConfig;
        if (this.mConfig == null) {
            throw new ImperativeError({msg: `Auth Builder Error: No auth config was supplied.`});
        }
    }

    /**
     * Build the full command - includes action group and object command.
     * @return {ICommandDefinition}: The command definition.
     */
    public abstract buildFull(): ICommandDefinition;

    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The auth action string
     */
    public abstract getAction(): string;

    /**
     * Only constructs the "group" command segment for the document. Use this if the command definition
     * document already includes an auth verb.
     * @return {ICommandDefinition}
     */
    public build(): ICommandDefinition {
        return this.buildAuthSegmentFromConfig();
    }

    /**
     * Builds only the "auth" segment from the auth config.
     * @return {ICommandDefinition}
     */
    protected abstract buildAuthSegmentFromConfig(): ICommandDefinition;
}
