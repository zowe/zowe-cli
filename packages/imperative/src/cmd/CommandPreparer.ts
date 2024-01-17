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

import { Constants } from "../constants/Constants";
import { ICommandDefinitionPassOn, ICommandDefinitionPassOnIgnore } from "./doc/ICommandDefinitionPassOn";
import { ImperativeError } from "../error/ImperativeError";
import { ICommandDefinition } from "./doc/ICommandDefinition";
import { ProfileUtils } from "../profiles/utils/ProfileUtils";
import { TextUtils } from "../utilities/TextUtils";
import { OptionConstants } from "./constants/OptionConstants";
import * as DeepMerge from "deepmerge";
import { ICommandProfileTypeConfiguration } from "./doc/profiles/definition/ICommandProfileTypeConfiguration";
import { ICommandOptionDefinition } from "./doc/option/ICommandOptionDefinition";

/**
 * Command preparer provides static utilities to ensure that command definitions are suitable for Imperative definition.
 */
export class CommandPreparer {
    /**
     * Prepare the command definition and apply any pass on traits to children.
     * After a definition has been prepared, it should be considered final.
     * @param {ICommandDefinition} original - The original command definition tree to "prepare"
     * @param {ICommandProfileTypeConfiguration} baseProfile - An optional base profile to add to command definitions
     * @return {ICommandDefinition} A copy of the original that has been prepared
     */
    public static prepare(original: ICommandDefinition, baseProfile?: ICommandProfileTypeConfiguration): ICommandDefinition {
        /**
         * Ensure it was specified
         */
        if (original == null) {
            throw new ImperativeError({ msg: `The command definition document must not be null/undefined.` });
        }

        /**
         * Even before basic validation, ensure that we can stringify and create a copy of the original document.
         * The document MUST be capable of this (i.e. every value must be convertable to a canonical JSON format and
         * no circular references are allowable)
         */
        let copy: ICommandDefinition;
        try {
            copy = JSON.parse(JSON.stringify(original));
        } catch (e) {
            throw new ImperativeError({ msg: `An error occurred copying the original command document: ${e.message}` });
        }

        /**
         * Set the default values for optional fields (if they were omitted)
         */
        CommandPreparer.setDefaultValues(copy);

        /**
         * For nodes that wish to "pass on" attributes, ensure that the attribute value to pass on is populated from
         * the parent (if omitted).
         */
        CommandPreparer.populatePassOnValueFromParent(copy);

        /**
         * Add global options that should be passed down.  We cannot use `appendAutoOptions` because `passOn`
         * logic is done before these function is called.
         */
        CommandPreparer.appendPassOnOptions(copy);

        /**
         * Pass on/down any attributes/traits from parents to children (as required)
         */
        CommandPreparer.passOn(copy);

        /**
         * Perform basic validation on the document to ensure that all the necessary fields are present.
         */
        CommandPreparer.validateDefinitionTree(copy);

        /**
         * Prepare the definition by populating with default values, applying global options, etc.
         */
        const baseProfileOptions: ICommandOptionDefinition[] = [];
        if (baseProfile != null) {
            for (const propName of Object.keys(baseProfile.schema.properties)) {
                if (baseProfile.schema.properties[propName].optionDefinition != null) {
                    baseProfileOptions.push(baseProfile.schema.properties[propName].optionDefinition);
                }
                if (baseProfile.schema.properties[propName].optionDefinitions != null) {
                    baseProfileOptions.push(...baseProfile.schema.properties[propName].optionDefinitions);
                }
            }
        }

        const prepared: ICommandDefinition = CommandPreparer.appendAutoOptions(copy, baseProfileOptions);

        /**
         * The document prepared for Imperative CLI usage/definition. This should be considered the final document.
         */
        return prepared;
    }

    /**
     * Perform preliminary (or post-preparation) basic validation of the command definition tree. Checks to ensure
     * that absoultely necessary fields are populated and invalid combos are not present.
     * @param {ICommandDefinition} definitionTree - full tree of command definitions to validate
     */
    public static validateDefinitionTree(definitionTree: ICommandDefinition) {
        CommandPreparer.perfomBasicValidation(definitionTree, []);

        /**
         * TODO: Advanced Validation
         * TODO: Consider protecting against re-used/overridden aliases, command collisions, etc.
         * TODO: Consider adding CLI implementation specific command structure validation
         */
    }

    /**
     * Perform preliminary (or post prepared) basic validation of the command definition tree. Checks to ensure
     * that absoultely necessary fields are populated and invalid combos are not present.
     *
     * Note: The root command is a bit of a special case, and is immune to some validation - we can't have a
     * name associated because that would cause an extra segment added in yargs.
     *
     * @param {ICommandDefinition} definition - The current command definition in the tree
     * @param {ICommandDefinition[]} definitions - the current set of definitions we've traversed - for diagnostics
     */
    private static perfomBasicValidation(definition: ICommandDefinition, definitions: ICommandDefinition[]) {
        const definitionDetails: string = "The definition in error has been placed in the additional details field of this error object.";

        // Do a quick check for required properties. If none are present, assume that either the definition
        // is completely incorrect OR the user did NOT export the definition in a module glob
        const props: string[] = Object.keys(definition);
        if (props.indexOf("name") < 0 && props.indexOf("description") < 0 && props.indexOf("type") < 0) {
            throw new ImperativeError({
                msg: `The command definition node being validated does NOT contain any of the required fields (name, description, type). ` +
                    `Either the definition supplied is completely incorrect (see ICommandDefinition interface for required fields) ` +
                    `OR you did NOT export the definition in your command definition module (found via the command definition glob). ` +
                    `Keys/properties present on the definition: ${props.join(",")}. ${definitionDetails}`,
                additionalDetails: JSON.stringify(definition)
            });
        }

        // All nodes must have a non-blank name
        if (!(definition as any).isRoot && (definition.name == null || definition.name.trim().length === 0)) {
            throw new ImperativeError({
                msg: `A command definition node contains an undefined or empty name. ${definitionDetails}`,
                additionalDetails: JSON.stringify(definition)
            });
        }

        // A node cannot have both chained handlers and a single handler
        if (definition.handler != null && definition.chainedHandlers != null && definition.chainedHandlers.length > 0) {
            throw new ImperativeError({
                msg: `A command definition node (${definition.name}) contains both a handler and chained handler ` +
                    `configuration. The two are mutually exclusive. ${definitionDetails}`,
                additionalDetails: JSON.stringify(definition)
            });
        }

        // verify chained handler configurations are correct
        if (definition.chainedHandlers != null) {

            for (let chainedHandlerIndex = 0;
                chainedHandlerIndex < definition.chainedHandlers.length;
                chainedHandlerIndex++) {
                const chainedHandler = definition.chainedHandlers[chainedHandlerIndex];
                const mappings = chainedHandler.mapping == null ? [] : chainedHandler.mapping;
                for (const mapping of mappings) {
                    if (mapping.to == null) {
                        throw new ImperativeError({
                            msg: "Property to argument mapping is invalid for chained handler: " + chainedHandler.handler,
                            additionalDetails: "Argument mapping does not have a 'to' field. Unable to determine " +
                                "where to place the arguments for this chained handler."
                        });
                    }
                    if (mapping.from != null && mapping.value != null) {
                        throw new ImperativeError({
                            msg: "Property to argument mapping is invalid for chained handler: " + chainedHandler.handler,
                            additionalDetails: "Argument mapping has both a 'from' field and a 'value' field. " +
                                "These two fields are mutually exclusive."
                        });
                    }
                    const indicesAhead = mapping.applyToHandlers == null ? [1] : mapping.applyToHandlers;
                    // make sure they don't try to specify a handler out of bounds of the array
                    for (const indexAhead of indicesAhead) {
                        if (chainedHandlerIndex + indexAhead >= definition.chainedHandlers.length) {
                            throw new ImperativeError({
                                msg: "Property to argument mapping is invalid for chained handler: " + chainedHandler.handler,
                                additionalDetails:
                                    TextUtils.formatMessage("The mapping refers to a relative index %s that when added to its " +
                                        "absolute index (%s) is greater than the total number of handlers (%s).",
                                    indexAhead, chainedHandlerIndex, definition.chainedHandlers.length)
                            });
                        }
                    }
                }
            }

        }

        // All nodes must have a type
        if (definition.type == null || definition.type.trim().length === 0) {
            throw new ImperativeError({
                msg: `A command definition node (${definition.name}) contains an undefined or empty type. ${definitionDetails}`,
                additionalDetails: JSON.stringify(definition)
            });
        }

        // All nodes must have a description
        if (!(definition as any).isRoot &&
            (definition.description == null || definition.description.trim().length === 0)) {
            throw new ImperativeError({
                msg: `A command definition node (${definition.name} of type ${definition.type}) contains an ` +
                    `undefined or empty description. ${definitionDetails}`,
                additionalDetails: JSON.stringify(definition)
            });
        }


        // Options, if specified, must be an array
        if (definition.options != null) {
            if (!Array.isArray(definition.options)) {
                throw new ImperativeError({
                    msg: `A command definition node (${definition.name} of type ${definition.type}) options are invalid (not an array). ` +
                        `${definitionDetails}`,
                    additionalDetails: JSON.stringify(definition)
                });
            }

            // If options are specified, perform validation
            CommandPreparer.performBasicOptionValidation(definition);
        }

        // Check positional arguments are an array
        if (definition.positionals != null) {
            if (!Array.isArray(definition.positionals)) {
                throw new ImperativeError({
                    msg: `A command definition node (${definition.name} of type ${definition.type}) positionals are invalid (not an array). ` +
                        `${definitionDetails}`,
                    additionalDetails: JSON.stringify(definition)
                });
            }

            // If positionals are specified, perform validation
            CommandPreparer.performBasicPositionalValidation(definition);
        }

        // Children must be an array
        if (definition.children != null && !Array.isArray(definition.children)) {
            throw new ImperativeError({
                msg: `A command definition node (${definition.name} of type ${definition.type}) contains ill-formed children. ${definitionDetails}`,
                additionalDetails: JSON.stringify(definition)
            });
        }

        // A group must have children
        if (definition.type === "group" && (definition.children == null || definition.children.length === 0)) {
            throw new ImperativeError({
                msg: `A "group" command definition node (${definition.name}) contains no children. A group implies children. ${definitionDetails}`,
                additionalDetails: JSON.stringify(definition)
            });
        }

        // Perform validation for each child
        if (definition.children != null) {
            for (const child of definition.children) {
                CommandPreparer.perfomBasicValidation(child, definitions.concat(definition));
            }
        }
    }

    /**
     * Perform basic positional operand validation. Ensure that the positional operands are valid and well formed.
     * @private
     * @static
     * @param {ICommandDefinition} definition - The command definition containing positionals to be validated
     * @memberof CommandPreparer
     */
    private static performBasicPositionalValidation(definition: ICommandDefinition) {
        for (const pos of definition.positionals) {
            /**
             * All positionals must have a name
             */
            if (pos.name == null || pos.name.trim().length === 0) {
                throw new ImperativeError({
                    msg: `A positional definition contains an undefined or empty name.`,
                    additionalDetails: "POSITIONAL_DEFINITION:\n" + JSON.stringify(pos) + "\nCOMMAND_DEFINITION:\n" + JSON.stringify(definition)
                });
            }

            /**
             * All positionals must have a type
             */
            if (pos.type == null || pos.type.trim().length === 0) {
                throw new ImperativeError({
                    msg: `A positional definition (${pos.name}) contains an undefined or empty type.`,
                    additionalDetails: "POSITIONAL_DEFINITION:\n" + JSON.stringify(pos) + "\nCOMMAND_DEFINITION:\n" + JSON.stringify(definition)
                });
            }

            /**
             * All positionals must have a non-blank description
             */
            if (pos.description == null || pos.description.trim().length === 0) {
                throw new ImperativeError({
                    msg: `A positional definition (${pos.name} of type ${pos.type}) contains an ` +
                        `undefined or empty description.`,
                    additionalDetails: "POSITIONAL_DEFINITION:\n" + JSON.stringify(pos) + "\nCOMMAND_DEFINITION:\n" + JSON.stringify(definition)
                });
            }
        }
    }

    /**
     * Perform basic option operand validation. Ensure that the option operands are valid and well formed.
     * @private
     * @static
     * @param {ICommandDefinition} definition - The command definition containing options to be validated
     * @memberof CommandPreparer
     */
    private static performBasicOptionValidation(definition: ICommandDefinition) {
        for (const opt of definition.options) {
            if (opt == null) {
                throw new ImperativeError({
                    msg: `An option definition is null or undefined.`,
                    additionalDetails: `COMMAND_DEFINITION:\n${JSON.stringify(definition)}`
                });
            }

            /**
             * All options must have a name
             */
            if (opt.name == null || opt.name.trim().length === 0) {
                throw new ImperativeError({
                    msg: `An option definition contains an undefined or empty name.`,
                    additionalDetails: "OPTION_DEFINITION:\n" + JSON.stringify(opt) + "\nCOMMAND_DEFINITION:\n" + JSON.stringify(definition)
                });
            }

            /**
             * All options must have a type
             */
            if (opt.type == null || opt.type.trim().length === 0) {
                throw new ImperativeError({
                    msg: `An option definition (${opt.name}) contains an undefined or empty type.`,
                    additionalDetails: "OPTION_DEFINITION:\n" + JSON.stringify(opt) + "\nCOMMAND_DEFINITION:\n" + JSON.stringify(definition)
                });
            }

            /**
             * All options must have a non-blank description
             */
            if (opt.description == null || opt.description.trim().length === 0) {
                throw new ImperativeError({
                    msg: `An option definition (${opt.name} of type ${opt.type}) contains an ` +
                        `undefined or empty description.`,
                    additionalDetails: "OPTION_DEFINITION:\n" + JSON.stringify(opt) + "\nCOMMAND_DEFINITION:\n" + JSON.stringify(definition)
                });
            }
        }
    }

    /**
     * If optional fields have not been populated in the original definition, ensure they are set to the appropriate defaults.
     * @private
     * @static
     * @param {ICommandDefinition} definition - the definition tree to set the default values
     * @memberof CommandPreparer
     */
    private static setDefaultValues(definition: ICommandDefinition) {
        // make sure any array types are at least initialized to empty
        definition.options = definition.options || [];
        definition.aliases = definition.aliases || [];
        definition.positionals = definition.positionals || [];
        definition.passOn = definition.passOn || [];

        if (definition.children != null) {
            for (const child of definition.children) {
                CommandPreparer.setDefaultValues(child);
            }
        }
    }

    /**
     * If the "passOn" specification does not indicate a value, we will extract the value/trait from the parent and
     * populate the "passOn" value. This allows parents to pass on their own properties/traits.
     * @private
     * @static
     * @param {ICommandDefinition} definition - the full definition tree
     * @memberof CommandPreparer
     */
    private static populatePassOnValueFromParent(definition: ICommandDefinition) {
        /**
         * If the pass on trait has no value, it is taken from the node in which it is defined (meaning
         * we are passing-on the trait as-is from the parent).
         */
        for (const trait of definition.passOn) {
            if (trait.value == null) {
                const traitPropertyDef = definition[trait.property];
                if (traitPropertyDef == null) {
                    throw new ImperativeError({
                        msg: `You cannot pass on a trait (${trait.property}) with a value of ` +
                            `undefined (current command definition name: ${definition.name} of type ${definition.type}).`
                    });
                }

                trait.value = JSON.parse(JSON.stringify(traitPropertyDef));
                if (trait.value == null) {
                    throw new ImperativeError({
                        msg: `You cannot pass on a trait (${trait.property}) with a value of ` +
                            `undefined (current command definition name: ${definition.name} of type ${definition.type}).`
                    });
                }
            }
        }

        /**
         * Perform for every child
         */
        if (definition.children != null) {
            for (const child of definition.children) {
                CommandPreparer.setDefaultValues(child);
            }
        }
    }

    /**
     * Appends items which should be passed on to later nodes
     * @param definition - The original command definition tree to "prepare"
     */
    private static appendPassOnOptions(definition: ICommandDefinition) {
        // all groups have --help-examples
        definition.passOn.push({
            property: "options",
            value: {
                name: Constants.HELP_EXAMPLES,
                group: Constants.GLOBAL_GROUP,
                description: "Display examples for all the commands in a group",
                type: "boolean"
            },
            ignoreNodes: [
                {
                    type: "command",
                }
            ],
            merge: true
        });

        // add show-inputs-only to all "command" nodes
        definition.passOn.push({
            property: "options",
            value: {
                name: "show-inputs-only",
                group: Constants.GLOBAL_GROUP,
                description: "Show command inputs and do not run the command",
                type: "boolean",
            },
            ignoreNodes: [
                {
                    type: "group",
                }
            ],
            merge: true
        });
    }

    /**
     * Appends options (for profiles, global options like help, etc.) automatically
     * @param {ICommandDefinition} definition - The original command definition tree to "prepare"
     * @param {ICommandOptionDefinition[]} baseProfileOptions - Option definitions sourced from base profile
     * @return {ICommandDefinition} A copy of the original that has been prepared
     */
    private static appendAutoOptions(definition: ICommandDefinition, baseProfileOptions: ICommandOptionDefinition[]): ICommandDefinition {
        // add the json option for all commands
        definition.options.push({
            name: Constants.JSON_OPTION,
            aliases: [Constants.JSON_OPTION_ALIAS],
            group: Constants.GLOBAL_GROUP,
            description: "Produce JSON formatted data from a command",
            type: "boolean"
        });

        // all commands and groups have --help
        definition.options.push({
            name: Constants.HELP_OPTION,
            aliases: [Constants.HELP_OPTION_ALIAS],
            group: Constants.GLOBAL_GROUP,
            description: "Display help text",
            type: "boolean"
        });

        // all commands and groups have --help-web
        definition.options.push({
            name: Constants.HELP_WEB_OPTION,
            aliases: [Constants.HELP_WEB_OPTION_ALIAS],
            group: Constants.GLOBAL_GROUP,
            description: "Display HTML help in browser",
            type: "boolean"
        });

        /**
         * Append any profile related options
         */
        if (definition.profile != null) {
            let types: string[] = [];
            if (definition.profile.required) {
                types = types.concat(definition.profile.required);
            }
            if (definition.profile.optional) {
                types = types.concat(definition.profile.optional);
            }
            const profileOptions: string[] = types.filter((type) => (
                !Array.isArray(definition.profile.suppressOptions) ?
                    true : definition.profile.suppressOptions.indexOf(type) < 0
            ));

            profileOptions.forEach((profOpt) => {
                const [profOptName, profOptAlias] = ProfileUtils.getProfileOptionAndAlias(profOpt);
                definition.options.push({
                    name: profOptName,
                    aliases: [profOptAlias],
                    group: "Profile Options",
                    description: `The name of a (${profOpt}) profile to load for this command execution.`,
                    type: "string"
                });
            });

            // Add any option definitions from base profile that are missing in service profile
            if (definition.options != null && baseProfileOptions.length > 0 && types.length > 1) {
                const optionNames: string[] = definition.options.map((cmdOpt) => cmdOpt.name);
                for (const profOpt of baseProfileOptions) {
                    if (optionNames.indexOf(profOpt.name) === -1) {
                        definition.options.push(profOpt);
                    }
                }
            }
        }

        if (definition.children != null) {
            let allChildrenAreExperimental: boolean = true;
            for (const child of definition.children) {
                if (!child.experimental) {
                    allChildrenAreExperimental = false;
                    break;
                }
            }
            // hide any groups/actions where all the children are experimental but
            // the parent isn't explicitly marked experimental
            if (allChildrenAreExperimental) {
                definition.experimental = true;
            }
        }
        definition.children = definition.children ?
            definition.children.map((child) => {
                if (definition.experimental) {
                    // propagate the experimental setting downwards if a parent is experimental
                    child.experimental = true;
                }
                // prepare each child
                return CommandPreparer.appendAutoOptions(child, baseProfileOptions);
            }) : [];

        if (definition.enableStdin) {
            definition.options.push({
                name: Constants.STDIN_OPTION,
                aliases: [Constants.STDIN_OPTION_ALIAS],
                type: "boolean",
                description: definition.stdinOptionDescription || Constants.STDIN_DEFAULT_DESCRIPTION
            });
        }

        definition.options = definition.options.map((option) => {
            if (option.group == null) {
                if (option.required) {
                    option.group = "Required Options";
                } else {
                    option.group = "Options";
                }
            }
            if (option.aliases == null) {
                option.aliases = [];
            }
            return option;
        });

        // Append the format options if requested
        if (definition.outputFormatOptions) {
            definition.options.push(OptionConstants.RESPONSE_FORMAT_FILTER_OPTION);
            definition.options.push(OptionConstants.RESPONSE_FORMAT_OPTION);
            definition.options.push(OptionConstants.RESPONSE_FORMAT_HEADER_OPTION);
        }

        return definition;
    }

    /**
     * A command definition node can indicate any arbitrary field be "passed on" to it's children. The intention is
     * to provide convienence for the coder of definition document, when they want to apply the same attributes (such
     * as reading from stdin OR which profiles are required) to all of its decedents.
     * @param {ICommandDefinition} definition - the original command document
     * @param {ICommandDefinition} inherit - the current set of attributes/fields being "passed on" - if a "pass on"
     * specification is found in a child document, it overwrites the parents (takes precedence)
     * @return {ICommandDefinition} A copy of the original with all "passed on" fields.
     */
    private static passOn(definition: ICommandDefinition, inherit?: ICommandDefinitionPassOn[]) {
        /**
         * Apply the attributes to the current node - assuming the conditions are met
         */
        if (inherit != null) {
            /**
             * Ensure this passOn specification wants this node to inherit the field
             */
            for (const trait of inherit) {
                if (!CommandPreparer.ignoreNode(definition, trait.ignoreNodes)) {
                    /**
                     * Either merge/append or overwrite the field in the definition.
                     */
                    const cloned = (trait.value != null) ?
                        JSON.parse(JSON.stringify(trait.value)) : undefined;

                    if (cloned == null) {
                        throw new ImperativeError({
                            msg: `The trait (${trait.property}) to pass on cannot have a ` +
                                `value of undefined. (Current definition name: ${definition.name} ` +
                                `of type: ${definition.type})`
                        });
                    }

                    if (trait.merge && Array.isArray(definition[trait.property])) {
                        definition[trait.property] = definition[trait.property].concat(cloned);
                    } else if (trait.merge && definition[trait.property] != null) {
                        definition[trait.property] = DeepMerge(definition[trait.property], cloned);
                    } else {
                        definition[trait.property] = cloned;
                    }
                }
            }
        } else {
            inherit = [];
        }

        /**
         * traits a cumulative - so we can pass down multiple from the same ancestor OR they may accumulate from
         * any number of ancestors.
         */
        inherit = definition.passOn.concat(inherit);
        if (definition.children != null) {
            for (const child of definition.children) {
                CommandPreparer.passOn(child, inherit);
            }
        }
    }

    /**
     * Check if the current node should be ignored. The name of the node is checked agaisnt the specification in
     * the pass on parameters.
     * @param {ICommandDefinition} node - The command definition node
     * @param {ICommandDefinitionPassOnIgnore[]} ignore - The names to ignore
     * @returns {boolean} - True if we are to ignore passing on attributes to the passed definition node.
     */
    private static ignoreNode(node: ICommandDefinition, ignore: ICommandDefinitionPassOnIgnore[]): boolean {
        if (ignore == null) {
            return false;
        }

        for (const ig of ignore) {
            if (ig.name != null && ig.type != null) {
                if (ig.name === node.name && ig.type === node.type) {
                    return true;
                }
            }

            if (ig.type == null) {
                if (ig.name != null && ig.name === node.name) {
                    return true;
                }
            }

            if (ig.name == null) {
                if (ig.type != null && ig.type === node.type) {
                    return true;
                }
            }
        }

        return false;
    }
}
