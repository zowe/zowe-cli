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

import { AbstractCommandBuilder } from "../../../cmd/builders/AbstractCommandBuilder";
import { isNullOrUndefined } from "util";
import { ICommandDefinition, ICommandOptionDefinition, ICommandProfileTypeConfiguration } from "../../../cmd";
import { Logger } from "../../../logger";
import { IProfileSchema, ProfileUtils } from "../../../profiles";
import { ICommandProfileProperty } from "../../../cmd/doc/profiles/definition/ICommandProfileProperty";

/**
 * Abstract class for generating profile-related commands
 */
export abstract class ProfilesCommandBuilder implements AbstractCommandBuilder {

    /**
     * Schema for the command.
     */
    protected mSchema: IProfileSchema;

    /**
     * Construct the builder based on the schema.
     * @param mProfileType - the name of the profile type e.g. banana
     * @param {Logger} mLogger - logger instance to use for the builder class
     * @param {IProfileSchema} mProfileConfig: The schema that describes the profile
     */
    constructor(protected mProfileType: string,
        protected mLogger: Logger,
        protected mProfileConfig: ICommandProfileTypeConfiguration) {

        this.mSchema = mProfileConfig.schema;
        if (isNullOrUndefined(this.mSchema)) {
            throw new Error(`Profile Builder Error: No profile schema was supplied.`);
        }
    }

    /**
     * Build the full command - includes action group and object command.
     * @return {ICommandDefinition}: The command definition.
     */
    public abstract buildFull(): ICommandDefinition;

    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The "create" action string
     */
    public abstract getAction(): string;

    /**
     * Only constructs the "group" command segment for the document. Use this if the command definition
     * document already includes a "create" verb.
     * @return {ICommandDefinition}
     */
    public build(): ICommandDefinition {
        return this.buildProfileSegmentFromSchema();
    }

    /**
     * Builds only the "profile" segment from the profile schema.
     * @return {ICommandDefinition}
     */
    protected abstract buildProfileSegmentFromSchema(): ICommandDefinition ;

    /**
     * Construct the operands from the Zowe Profile Schema.
     * @param {any} properties: The properties set to iterate over looking for operands to add
     * @param {ICommandOptionDefinition[]} options: The final option definitions to add.
     * @return {ICommandOptionDefinition[]}: The set of returned option definitions
     */
    protected buildOptionsFromProfileSchema(properties: any,
        options: ICommandOptionDefinition[]): ICommandOptionDefinition[] {
        for (const propName of Object.keys(properties)) {
            // helper to recursively add any nested option definitions
            const findAndAddOptions = (propertiesObject: any, propertyName: string) => {
                const field: ICommandProfileProperty = propertiesObject[propertyName];
                if (!isNullOrUndefined(field.optionDefinition)) {
                    options.push(field.optionDefinition);
                }
                if (!isNullOrUndefined(field.optionDefinitions)) {
                    options = options.concat(field.optionDefinitions);
                }
                if (field.properties != null) {
                    for (const nestedProperty of Object.keys(field.properties)) {
                        findAndAddOptions(field.properties, nestedProperty);
                    }
                }
            };
            findAndAddOptions(properties, propName);
        }
        if (!isNullOrUndefined(this.mProfileConfig.dependencies)) {
            for (const dependency of this.mProfileConfig.dependencies) {
                const description = dependency.description ||
                    "The name of a " + dependency.type + " profile to associate with this profile.";
                const dependencyOption: ICommandOptionDefinition = {
                    name: ProfileUtils.getProfileOption(dependency.type),
                    aliases: [ProfileUtils.getProfileOptionAlias(dependency.type)],
                    type: "string",
                    description,
                    required: dependency.required
                };
                options.push(dependencyOption);
            }
        }
        return options;
    }

}
