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

import { format } from "util";
import { AbstractHelpGenerator } from "./abstract/AbstractHelpGenerator";
import { TextUtils } from "../../utilities/TextUtils";
import { Constants } from "../../constants";
import { CommandUtils } from "../utils/CommandUtils";
import { ImperativeError } from "../../error";
import { IHelpGeneratorParms } from "./doc/IHelpGeneratorParms";
import { IHelpGeneratorFactoryParms } from "./doc/IHelpGeneratorFactoryParms";
import { compareCommands, ICommandDefinition } from "../doc/ICommandDefinition";
import stripAnsi = require("strip-ansi");

/**
 * Imperative default help generator. Accepts the command definitions and constructs
 * the full help text for the command node.
 *
 * TODO - Consider removing word wrap on a fixed with and apply dynamically based on terminal sizes
 * @export
 * @class DefaultHelpGenerator
 * @extends {AbstractHelpGenerator}
 */
export class DefaultHelpGenerator extends AbstractHelpGenerator {
    /**
     * The help indent for spacing/alignment
     * @static
     * @memberof DefaultHelpGenerator
     */
    public static readonly HELP_INDENT = "   ";

    /**
     * Standard imperative error message tag for errors thrown by the help generator
     * @private
     * @static
     * @type {string}
     * @memberof DefaultHelpGenerator
     */
    private static readonly ERROR_TAG: string = "Help Generator Error:";

    /**
     * Indicates that the help generator should skip introducing breaks based on terminal width
     * @type {boolean}
     * @memberof IHelpGeneratorParms
     */
    private skipTextWrap: boolean = false;

    /**
     * Creates an instance of DefaultHelpGenerator.
     * @param {IHelpGeneratorFactoryParms} defaultParms - Imperative config parameters for help generation - See interface for details
     * @param {IHelpGeneratorParms} commandParms - The command definitions for generating help - See interface for details
     * @memberof DefaultHelpGenerator
     */
    constructor(defaultParms: IHelpGeneratorFactoryParms, commandParms: IHelpGeneratorParms) {
        super(defaultParms, commandParms);
        this.skipTextWrap = commandParms.skipTextWrap ?? false;
        this.buildOptionMaps();
    }

    /**
     * Construct the full help text for display.
     * @returns {string} - The full help text
     * @memberof DefaultHelpGenerator
     */
    public buildHelp(): string {
        let helpText: string = "";
        switch (this.mCommandDefinition.type) {
            case "group":
                helpText = this.buildFullGroupHelpText();
                break;
            case "command":
                helpText = this.buildFullCommandHelpText();
                break;
            default:
                throw new ImperativeError({
                    msg: `${DefaultHelpGenerator.ERROR_TAG} Unknown command definition type specified: "${this.mCommandDefinition.type}"`
                });
        }
        return helpText;
    }

    /**
     * Build the help text for a "group" - a group has a set of children  The help text contains the standard
     * description/usage/etc., but unlike a command only displays the next set of "commands" or "groups" that can
     * be issued after the current node.
     * @returns {string} - the full group help text
     * @memberof DefaultHelpGenerator
     */
    public buildFullGroupHelpText(): string {
        let helpText: string = "\n";

        // Description and usage
        helpText += this.buildDescriptionSection();
        helpText += this.buildUsageSection();

        // markdown is not requested, build the children summary tables and
        // The global options
        if (!this.mProduceMarkdown) {
            helpText += this.buildChildrenSummaryTables();
        }

        // Append any options
        helpText += this.buildCommandOptionsSection();

        // Append any global options
        if (!this.mProduceMarkdown) {
            helpText += this.buildGlobalOptionsSection();
        }

        // Get any example text
        helpText += this.buildExamplesSection();
        return helpText;
    }

    /**
     * Returns the help text for the command definition - the help text contains the standard items such as
     * description/usage/etc. and also contains the full option descriptions for the command.
     * @param {boolean} [includeGlobalOptions=true] - Include the global options in the help text
     * @returns {string} - The help text for --help or markdown.
     */
    public buildFullCommandHelpText(includeGlobalOptions: boolean = true): string {
        let helpText = "";

        // Construct the command name section.
        if (!this.mProduceMarkdown && this.mCommandDefinition.name != null &&
            this.mCommandDefinition.name.length > 0) {
            helpText += "\n" + this.buildHeader("COMMAND NAME");
            helpText += (DefaultHelpGenerator.HELP_INDENT + this.mCommandDefinition.name);
            if (this.mCommandDefinition.aliases != null && this.mCommandDefinition.aliases.length > 0) {
                helpText += " | " + this.mCommandDefinition.aliases.join(" | ");
            }

            if (this.mCommandDefinition.experimental) {
                helpText += this.grey(DefaultHelpGenerator.HELP_INDENT + "(experimental command)\n\n");
            } else {
                helpText += "\n\n";
            }
        }

        // Only include global options by request and we're not producing markdown
        includeGlobalOptions = includeGlobalOptions && !this.mProduceMarkdown;

        // Print standard areas like description and usage
        helpText += this.buildDescriptionSection();
        helpText += this.buildUsageSection();

        // Add positional arguments to the help text
        if (this.mCommandDefinition.positionals != null &&
            this.mCommandDefinition.positionals.length > 0) {
            helpText += this.buildPositionalArgumentsSection();
        }

        // Add options to the help text
        helpText += this.buildCommandOptionsSection();
        if (includeGlobalOptions) {
            helpText += this.buildGlobalOptionsSection();
        }

        // Build experimental description section and examples
        helpText += this.getExperimentalCommandSection();
        helpText += this.buildExamplesSection();
        return helpText;
    }

    /**
     * Build a string containing the command name and aliases separated by the vertical bar:
     * command | c
     * @param {ICommandDefinition} commandDefinition - The definition for the command
     * @returns {string} - Contains the command name followed by the aliases (e.g. command | c)
     * @memberof DefaultHelpGenerator
     */
    public buildCommandAndAliases(commandDefinition: ICommandDefinition): string {
        let names: string = commandDefinition.name;
        if (commandDefinition.aliases != null) {
            if (commandDefinition.aliases.join("").trim().length !== 0) {
                names += " | ";
                names += commandDefinition.aliases.join(" | ");
            }
        }
        return names;
    }

    /**
     * Builds a table of commands/groups for display in the help:
     *
     * GROUPS
     * ------
     * group1  hello this is group1
     * group2  hello this is group2
     *
     * @return {string}: Returns the table for display.
     */
    public buildChildrenSummaryTables(): string {
        // Construct a map of all the types and definitions - we may produce multiple tables
        // if the children of the current command are not all the same type
        const childrenDefinitions: ICommandDefinition[] = this.mCommandDefinition.children.sort(compareCommands);
        const typeMap = new Map<string, ICommandDefinition[]>();
        for (const def of childrenDefinitions) {
            const children: ICommandDefinition[] = typeMap.get(def.type);
            if (children == null) {
                typeMap.set(def.type, [def]);
            } else {
                typeMap.set(def.type, children.concat(def));
            }
        }

        // Iterate through the map and children, creating a table with heading for each type
        let fullTableText: string = "";
        typeMap.forEach((definitions, type) => {
            // Construct the table
            const table: any[] = [];
            let maximumLeftHandSide = 0;
            for (const command of definitions) {
                let summaryText: string = "";
                summaryText += command.summary || command.description;

                if (command.deprecatedReplacement) {
                    // Mark with the deprecated tag
                    summaryText += this.grey(" (deprecated)");
                } else if (command.experimental) {
                    // Mark with the experimental tag
                    summaryText += this.grey(" (experimental) ");
                }
                const printString: string = DefaultHelpGenerator.HELP_INDENT + this.buildCommandAndAliases(command);
                if (printString.length > maximumLeftHandSide) {
                    maximumLeftHandSide = printString.length;
                }
                table.push({name: printString, summary: summaryText});
            }
            let maxColumnWidth: number;

            // if all the items in the left hand side are less than half of the screen width,
            // set the maximum column length for the action/object/(child command)/etc. table
            // to be based on that so that we don't wrap unnecessarily
            if (maximumLeftHandSide < TextUtils.getRecommendedWidth() / 2) {
                maxColumnWidth = TextUtils.getRecommendedWidth() - maximumLeftHandSide;
            }
            let tableText = TextUtils.getTable(table, this.mPrimaryHighlightColor, maxColumnWidth, false);
            tableText = tableText.split(/\n/g).map((line: string) => {
                return DefaultHelpGenerator.HELP_INDENT + line; // indent the table
            }).join("\n");

            const properCaseType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
            fullTableText += this.renderHelp(this.buildHeader(properCaseType + "s") + tableText + "\n\n");
        });

        // Return all the table tests
        return fullTableText;
    }

    /**
     * Build the usage diagram for the command.
     * TODO - very simple at the moment, should be enhanced with a "better" diagram
     * @returns {string}
     * @memberof DefaultHelpGenerator
     */
    public buildUsageDiagram(): string {
        let usage: string = /* binary name */ this.mRootCommandName + " "
            + CommandUtils.getFullCommandName(this.mCommandDefinition, this.mDefinitionTree);
        // For a command, build the usage diagram with positional and options.
        if (this.mCommandDefinition.type === "command") {
            // Place the positional parameters.
            if (this.mCommandDefinition.positionals != null) {
                for (const positional of this.mCommandDefinition.positionals) {
                    usage += " " + ((positional.required) ? "<" + positional.name + ">" : "[" + positional.name + "]");
                }
            }
            // Append the options segment
            usage += " " + Constants.OPTIONS_SEGMENT;
        } else if (this.mCommandDefinition.type === "group") {
            // Determine what command section we are currently at and append the correct usages.
            usage = usage.trim();
            if (this.mCommandDefinition.children != null && this.mCommandDefinition.children.length > 0) {
                // Get all the possible command types. (E.G <group>, <command>, <command|group>, ETC)
                let nextType = "<";

                // usage += " <";
                const types: string[] = [];
                for (const definition of this.mCommandDefinition.children) {
                    if (!types.includes(definition.type)) {
                        types.push(definition.type);
                    }
                }
                nextType += types.join("|") + ">";

                usage += ` ${nextType}\n\n${DefaultHelpGenerator.HELP_INDENT}Where ${nextType} is one of the following:`;
            } else {
                usage += " " + Constants.OPTIONS_SEGMENT;
            }
        } else {
            throw new ImperativeError({
                msg: `${DefaultHelpGenerator.ERROR_TAG} Unknown or unsupported command type ` +
                    `"${this.mCommandDefinition.type}" used in command definition.`
            });
        }

        return usage;
    }

    /**
     * Build the usage section of the help text:
     *
     * USAGE
     * -----
     * command blah [options]
     *
     * @returns {string} - The usage help text section
     * @memberof DefaultHelpGenerator
     */
    public buildUsageSection(): string {
        return this.renderHelp(this.buildHeader("Usage")
            + DefaultHelpGenerator.HELP_INDENT + this.buildUsageDiagram()) + "\n\n";
    }

    /**
     * Build the global options section of the command help text.
     *
     * GLOBAL OPTIONS
     * --------------
     * ...
     *
     * @returns {string} - The global options help text section
     * @memberof DefaultHelpGenerator
     */
    public buildGlobalOptionsSection(): string {
        let result = this.buildHeader(Constants.GLOBAL_GROUP);
        if (this.groupToOption[Constants.GLOBAL_GROUP] != null) {
            for (const globalOption of this.groupToOption[Constants.GLOBAL_GROUP]) {
                result += this.buildOptionText(globalOption, this.optionToDescription[globalOption]);
            }
        }
        return this.renderHelp(result);
    }

    /**
     * Build the command description section of the help text:
     *
     * DESCRIPTION
     * -----------
     * This command is great.
     *
     * @returns {string} - The command description text
     * @memberof DefaultHelpGenerator
     */
    public buildDescriptionSection(): string {
        let descriptionForHelp: string = "";
        if (!this.mProduceMarkdown) {
            descriptionForHelp += this.buildHeader("DESCRIPTION");
        }
        let description = this.mCommandDefinition.description
            || this.mCommandDefinition.summary;

        // we place the deprecated message in the DESCRIPTION help section
        if (this.mCommandDefinition.deprecatedReplacement) {
            const noNewlineInText = this.mCommandDefinition.deprecatedReplacement.replace(/\n/g, " ");
            description += this.grey("\n\nWarning: This " + this.mCommandDefinition.type +
                " has been deprecated.\nRecommended replacement: " + noNewlineInText);
        }
        if (this.mProduceMarkdown) {
            description = this.escapeMarkdown(description);  // escape Markdown special characters
        }
        if (this.skipTextWrap) {
            descriptionForHelp += TextUtils.indentLines(description, this.mProduceMarkdown ? "" : DefaultHelpGenerator.HELP_INDENT);
        } else {
            descriptionForHelp += TextUtils.wordWrap(description,
                undefined,
                this.mProduceMarkdown ? "" : DefaultHelpGenerator.HELP_INDENT
            );
        }
        return this.renderHelp(descriptionForHelp + "\n\n");
    }

    /**
     * Return the help text format for positional parameters - includes the parameter itself, the optional regex,
     * and the full description.
     * @returns {string} - The help text for each positional parameter.
     * @memberof DefaultHelpGenerator
     */
    public buildPositionalArgumentsSection(): string {
        if (this.mCommandDefinition.positionals != null && this.mCommandDefinition.positionals.length > 0) {
            let positionalsHelpText: string = this.buildHeader("Positional Arguments");
            for (const positional of this.mCommandDefinition.positionals) {
                const positionalString = "{{codeBegin}}" +
                    positional.name + "{{codeEnd}}\t\t " +
                    this.dimGrey("{{italic}}(" + this.explainType(positional.type) + "){{italic}}");
                let fullDescription = positional.description;
                if (positional.regex) {
                    fullDescription += (DefaultHelpGenerator.HELP_INDENT +
                        DefaultHelpGenerator.HELP_INDENT + "Must match regular expression: {{codeBegin}}"
                        + positional.regex + "{{codeEnd}}\n\n");
                }
                positionalsHelpText += this.buildOptionText(positionalString, fullDescription);
            }
            return this.renderHelp(positionalsHelpText);
        } else {
            throw new ImperativeError({
                msg: `${DefaultHelpGenerator.ERROR_TAG} Unable to print positional arguments: None were supplied.`
            });
        }
    }

    /**
     * From the map of options (group to option), formulate the group and options in the form of:
     *
     * OPTION GROUP
     * ------------
     *
     *   option1
     *
     *      Description of option1
     *
     *   option2
     *
     *      Description of option2
     *
     * @return {string}
     */
    public buildCommandOptionsSection(): string {
        let result = "";
        for (const group of Object.keys(this.groupToOption)) {
            if (group === Constants.GLOBAL_GROUP) {
                // skip global options for now, we'll put them somewhere else
                continue;
            }
            result += this.buildHeader(group);
            for (const optionString of this.groupToOption[group]) {
                result += this.buildOptionText(optionString, this.optionToDescription[optionString]);
            }
        }
        return this.renderHelp(result);
    }

    /**
     * Build the text for option:
     *
     * --option
     *
     *    The description for this option
     *
     * @param {string} optionString - The option string (-- form or positional, etc.)
     * @param {string} description - The description for the option
     * @return {string} - The option text
     */
    public buildOptionText(optionString: string, description: string): string {
        if (this.mProduceMarkdown) {
            description = this.escapeMarkdown(description);  // escape Markdown special characters
        }
        if (this.skipTextWrap) {
            description = TextUtils.indentLines(description.trim(), DefaultHelpGenerator.HELP_INDENT + DefaultHelpGenerator.HELP_INDENT);
        } else {
            description = TextUtils.wordWrap(description.trim(),
                undefined,
                DefaultHelpGenerator.HELP_INDENT + DefaultHelpGenerator.HELP_INDENT
            );
        }
        if (this.mProduceMarkdown) {
            // for markdown, remove leading spaces from the description so that the first line
            // is not indented
            description = description.replace(/^\s*/, "");
        }
        return this.renderHelp(format("{{bullet}}%s\n\n{{indent}}{{bullet}}{{space}}%s\n\n",
            DefaultHelpGenerator.HELP_INDENT + optionString,
            description
        ));
    }

    /**
     * Produces a header for the current section in help:
     *
     * COMMANDS
     * --------
     *
     * @param {string} header - the header text (e.g. COMMANDS)
     * @returns {string} - The header
     * @memberof DefaultHelpGenerator
     */
    public buildHeader(header: string): string {
        return this.renderHelp(format("{{header}}{{header}}{{header}}{{header}}{{space}}%s\n\n",
            this.mProduceMarkdown ? header :
                DefaultHelpGenerator.formatHelpHeader(header, undefined, this.mPrimaryHighlightColor)));
    }

    /**
     * Build the examples text for the command. Examples include the command example (which normally is able to
     * be copy/pasted verbatim) and the description for the example.
     * TODO - we should remove wordwrap from this
     * @returns {string} - The example text
     * @memberof DefaultHelpGenerator
     */
    public buildExamplesSection(): string {
        let examplesText = "";
        if (this.mCommandDefinition.examples != null) {
            examplesText = this.mCommandDefinition.examples.map((example) => {
                const prefix = example.prefix != null ? example.prefix + "{{space}} " : "";
                const exampleHyphen = this.mProduceMarkdown ? "" : "-";
                const options = (example.options.length > 0) ? ` ${example.options}` : "";
                const description = this.mProduceMarkdown ? this.escapeMarkdown(example.description) : example.description;
                let exampleText = "{{bullet}}" + exampleHyphen + " {{space}}" + description + ":\n\n";
                if (this.skipTextWrap) {
                    exampleText = TextUtils.indentLines(exampleText, this.mProduceMarkdown ? "" : DefaultHelpGenerator.HELP_INDENT);
                } else {
                    exampleText = TextUtils.wordWrap(exampleText,
                        undefined,
                        this.mProduceMarkdown ? "" : DefaultHelpGenerator.HELP_INDENT);
                }
                exampleText += "      {{bullet}}{{space}}{{codeBegin}}$ {{space}}" +
                    prefix +
                    this.mRootCommandName + " " +
                    CommandUtils.getFullCommandName(this.mCommandDefinition,
                        this.mDefinitionTree) + options + "{{codeEnd}}\n";
                return exampleText;
            }).join("\n");
            if (this.mCommandDefinition.examples.length > 0) {
                examplesText = this.buildHeader("Examples") + examplesText + "\n";
            }
        }
        return this.renderHelp(examplesText);
    }

    /**
     * Get a blurb explaining experimental commands if this command is experimental
     * @returns {string} - If this command is experimental, returns the experimental command explanation block
     * @memberof DefaultHelpGenerator
     */
    public getExperimentalCommandSection(): string {
        if (!this.mCommandDefinition.experimental || this.mProduceMarkdown) {
            return "";
        }
        let experimentalSection = "";
        experimentalSection += DefaultHelpGenerator.formatHelpHeader("About Experimental Commands",
            undefined, this.mPrimaryHighlightColor);
        if (this.skipTextWrap) {
            experimentalSection += TextUtils.indentLines(this.mExperimentalCommandDescription, DefaultHelpGenerator.HELP_INDENT);
        } else {
            experimentalSection += "\n\n" + TextUtils.wordWrap(this.mExperimentalCommandDescription,
                undefined, DefaultHelpGenerator.HELP_INDENT) + "\n\n";
        }
        return this.renderHelp(experimentalSection);
    }

    /**
     * Utility function to escape Markdown special characters.
     * Note: This should only be called once to avoid double escaping.
     * @param {string} text - The text to escape
     * @return {string} - The escaped string
     */
    private escapeMarkdown(text: string): string {
        return stripAnsi(text).replace(/([*#\-`_[\]+.!\\])/g, "\\$1");
    }
}
