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

import { ImperativeExpect } from "../../../expect";
import { inspect, isNullOrUndefined } from "util";
import { Logger } from "../../../logger";
import { ImperativeError } from "../../../error";
import { ICommandProfileTypeConfiguration } from "../doc/profiles/definition/ICommandProfileTypeConfiguration";
import {
    IProfileManager,
    IProfileSchema,
} from "../../../profiles/src/doc";

/**
 * The CLI profile manager contains methods to manage Zowe profiles. Profiles
 * are user configuration documents intended to be used on commands, as a convenience, to supply a slew of additional
 * input and configuration (normally more than would be feasible as command arguments). See the "IProfile" interface
 * for a detailed description of profiles, their use case, and examples.
 *
 * The Profile Manager no longer reads V1 profile from disk. It only processes profile information from a
 * command's definition. The Config class now handles reading profiles from disk stored in a zowe.config.json file.
 */
export class CliProfileManager {
    /**
     * Parameters passed on the constructor (normally used to create additional instances of profile manager objects)
     * @private
     * @type {IProfileManager}
     * @memberof CliProfileManager
     */
    private mConstructorParms: IProfileManager<ICommandProfileTypeConfiguration>;

    /**
     * The full set of profile type configurations. The manager needs to ensure that A) the profile type configuration
     * is among the set (because it contains schema and dependency specifications) and B) That other type configurations
     * are available.
     * @private
     * @type {ICommandProfileTypeConfiguration[]}
     * @memberof CliProfileManager
     */
    private mProfileTypeConfigurations: ICommandProfileTypeConfiguration[];

    /**
     * The profile "type" for this manager - indicating the profile/schema that this manager is working directly with.
     * @private
     * @type {string}
     * @memberof CliProfileManager
     */
    private mProfileType: string;

    /**
     * Product display name of the CLI.
     * @private
     * @type {string}
     * @memberof CliProfileManager
     */
    private mProductDisplayName: string;

    /**
     * Logger instance - must be log4js compatible. Can be the Imperative logger (normally), but is required for
     * profile manager operation.
     * @private
     * @type {Logger}
     * @memberof CliProfileManager
     */
    private mLogger: Logger = Logger.getImperativeLogger();

    /**
     * Creates an instance of ProfileManager - Performs basic parameter validation.
     * It accepts the type definitions passed on the constructor parameters.
     *
     * @param {IProfileManager} parms - See the interface for details.
     * @memberof ProfileManager
     */
    constructor(parms: IProfileManager<ICommandProfileTypeConfiguration>) {
        ImperativeExpect.toNotBeNullOrUndefined(parms, "Profile Manager input parms not supplied.");
        ImperativeExpect.keysToBeDefinedAndNonBlank(parms, ["type"],
            "No profile type supplied on the profile manager parameters.");
        this.mLogger = isNullOrUndefined(parms.logger) ? this.mLogger : parms.logger;
        this.mProfileType = parms.type;
        this.mProfileTypeConfigurations = parms.typeConfigurations;
        this.mProductDisplayName = parms.productDisplayName;
        if (isNullOrUndefined(this.profileTypeConfigurations) || this.profileTypeConfigurations.length === 0) {
            throw new ImperativeError({
                msg: "V1 profiles are no longer read from disk. " +
                    "You can supply the profile type configurations to the profile manager constructor."
            });
        }
        this.mConstructorParms = parms;
        ImperativeExpect.arrayToContain(this.mProfileTypeConfigurations, (entry) => {
            return entry.type === this.mProfileType;
        }, `Could not locate the profile type configuration for "${this.profileType}" within the input configuration list passed.` +
        `\n${inspect(this.profileTypeConfigurations, { depth: null })}`);
        for (const config of this.profileTypeConfigurations) {
            this.validateConfigurationDocument(config);
        }
    }

    /**
     * Accessor for the logger instance - passed on the constructor
     * @readonly
     * @protected
     * @type {Logger}
     * @memberof CliProfileManager
     */
    protected get log(): Logger {
        return this.mLogger;
    }

    /**
     * Accessor for the profile type specified on the constructor.
     * @readonly
     * @protected
     * @type {string}
     * @memberof CliProfileManager
     */
    protected get profileType(): string {
        return this.mProfileType;
    }

    /**
     * Accesor for the product display name.
     * @readonly
     * @protected
     * @type {string}
     * @memberof CliProfileManager
     */
    protected get productDisplayName(): string {
        return this.mProductDisplayName;
    }

    /**
     * Accessor for the full set of type configurations - passed on the constructor.
     * @readonly
     * @protected
     * @type {ICommandProfileTypeConfiguration[]}
     * @memberof CliProfileManager
     */
    protected get profileTypeConfigurations(): ICommandProfileTypeConfiguration[] {
        return this.mProfileTypeConfigurations;
    }

    /**
     * Validate that the schema document passed is well formed for the profile manager usage. Ensures that the
     * schema is not overloading reserved properties.
     * @private
     * @param {IProfileSchema} schema - The schema document to validate.
     * @param type - the type of profile for the schema - defaults to the current type for this manager
     * @memberof CliProfileManager
     */
    private validateSchema(schema: IProfileSchema, type = this.profileType) {
        ImperativeExpect.keysToBeDefined(schema, ["properties"], `The schema document supplied for the profile type ` +
            `("${type}") does NOT contain properties.`);
        ImperativeExpect.keysToBeUndefined(schema, ["properties.dependencies"], `The schema "properties" property ` +
            `(on configuration document for type "${type}") contains "dependencies". ` +
            `"dependencies" is must be supplied as part of the "type" configuration document (no need to formulate the dependencies ` +
            `schema yourself).`);
    }

    /**
     * Validates the basic configuration document to ensure it contains all the proper fields
     * @private
     * @param {ICommandProfileTypeConfiguration} typeConfiguration - The type configuration document
     * @memberof CliProfileManager
     */
    private validateConfigurationDocument(typeConfiguration: ICommandProfileTypeConfiguration) {
        ImperativeExpect.keysToBeDefinedAndNonBlank(typeConfiguration, ["type"], `The profile type configuration document for ` +
            `"${typeConfiguration.type}" does NOT contain a type.`);
        ImperativeExpect.keysToBeDefined(typeConfiguration, ["schema"], `The profile type configuration document for ` +
            `"${typeConfiguration.type}" does NOT contain a schema.`);
        this.validateSchema(typeConfiguration.schema, typeConfiguration.type);
        if (!isNullOrUndefined(typeConfiguration.dependencies)) {
            ImperativeExpect.toBeAnArray(typeConfiguration.dependencies,
                `The profile type configuration for "${typeConfiguration.type}" contains a "dependencies" property, ` +
                `but it is not an array (ill-formed)`);
            for (const dep of typeConfiguration.dependencies) {
                ImperativeExpect.keysToBeDefinedAndNonBlank(dep, ["type"], "A dependency specified for the " +
                    "profile definitions did not contain a type.");
            }
        }
    }
}
