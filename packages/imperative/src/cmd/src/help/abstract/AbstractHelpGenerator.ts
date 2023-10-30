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

import { TextUtils } from "../../../../utilities";
import { format, isNullOrUndefined } from "util";
import { ImperativeError } from "../../../../error/src/ImperativeError";
import { Logger } from "../../../../logger/src/Logger";
import { IHelpGeneratorParms } from "../doc/IHelpGeneratorParms";
import { IHelpGeneratorFactoryParms } from "../doc/IHelpGeneratorFactoryParms";
import { IHelpGenerator } from "../doc/IHelpGenerator";
import { Constants } from "../../../../constants";
import { ICommandDefinition } from "../../doc/ICommandDefinition";
import { CommandOptionType, ICommandOptionDefinition } from "../../doc/option/ICommandOptionDefinition";

export abstract class AbstractHelpGenerator implements IHelpGenerator {

    public static SHORT_DASH = "-";
    public static LONG_DASH = "--";

    /**
     * Get a heading for the CLI / help
     * @param {string} header - The text you want to display in the header
     * @param indent - prefix the the heading and dashes with this string (defaults to one space)
     * @param color - the color to highlight the header in
     * @returns {string} the formatted/colored header
     */
    public static formatHelpHeader(header: string, indent: string = " ", color: string): string {
        if (isNullOrUndefined(header) || header.trim().length === 0) {
            throw new ImperativeError({
                msg: "Null or empty header provided; could not be formatted."
            });
        }
        const numDashes = header.length + 1;
        const headerText = TextUtils.formatMessage("{{indent}}{{headerText}}\n{{indent}}{{dashes}}",
            { headerText: header.toUpperCase(), dashes: Array(numDashes).join("-"), indent });
        return TextUtils.chalk[color](headerText);
    }

    /**
     * The command name being invoked by the user.
     * For example, when using "banana --help", banana is the command name.
     */
    protected mRootCommandName: string;

    /**
     * The command definition for which we are building help
     */
    protected mCommandDefinition: ICommandDefinition;
    /**
     * The full command definition - which includes the parents of the command.
     */
    protected mDefinitionTree: ICommandDefinition;

    /**
     * Produce markdown - not help text.
     */
    protected mProduceMarkdown: boolean = false;

    /**
     * Logger
     */
    protected mLog: Logger;

    protected mPrimaryHighlightColor: string;

    /**
     * The configured experimental command description.
     * Has a default, generic description which can be overridden through parameters
     * to the constructor
     * @type {string}
     */
    protected mExperimentalCommandDescription: string = Constants.DEFAULT_EXPERIMENTAL_COMMAND_EXPLANATION;
    /**
     * A map of group names to option names and aliases - useful in help text/doc generation
     * e.g. this.grouptoOption["job options"] -> [ "--async | -a ", "--activate | -A"]
     */
    protected groupToOption: {
        [key: string]: string[];
    } = {};
    /**
     * A map of option names and aliases to their descriptions - useful in help text/doc generation
     * e.g. this.optionToDescription["--async | a"] -> "Don't wait for this job to complete before returning"
     */
    protected optionToDescription: {
        [key: string]: string;
    } = {};

    /**
     * Get log instance
     */
    protected get log(): Logger {
        return this.mLog;
    }

    // TODO - rework these parameter (and possible the help generator scheme)
    constructor(defaultParms: IHelpGeneratorFactoryParms, commandParms: IHelpGeneratorParms) {
        if (isNullOrUndefined(commandParms.commandDefinition) || isNullOrUndefined(commandParms.fullCommandTree)) {
            throw new ImperativeError({
                msg: "Error initializing help generator. The command definition or command definition tree was null or undefined.",
                additionalDetails: JSON.stringify(commandParms.commandDefinition) + "\n\n" + JSON.stringify(commandParms.fullCommandTree)
            });
        }
        this.mCommandDefinition = commandParms.commandDefinition;
        this.mDefinitionTree = commandParms.fullCommandTree;
        this.mProduceMarkdown = defaultParms.produceMarkdown;
        this.mRootCommandName = defaultParms.rootCommandName;
        this.mPrimaryHighlightColor = defaultParms.primaryHighlightColor;
        this.mLog = Logger.getImperativeLogger();
        if (commandParms.experimentalCommandsDescription != null) {
            // use the configured experimental command description, if any
            this.mExperimentalCommandDescription = commandParms.experimentalCommandsDescription;
        }
    }

    public abstract buildHelp(): string;

    public getOptionAndAliasesString(option: ICommandOptionDefinition, caseSensitive?: boolean): string {
        let aliasString = "";
        if (!isNullOrUndefined(option.aliases) && option.aliases.length > 0 &&
            (option.aliases.join("").trim().length !== 0)) {

            const formattedOptAliases = [];
            aliasString += " | ";
            for (const alias of option.aliases) {
                if (!isNullOrUndefined(alias) && alias.length > 0) {
                    formattedOptAliases.push("{{codeBegin}}" +
                        (alias.length === 1 ? "-" : "--") + alias + "{{codeEnd}}");
                }
                else {
                    this.log.warn("The aliases for option " + option.name + " contained a null or empty alias." +
                        "This has been ignored; please take corrective action in your option definition.");
                }
            }
            aliasString += formattedOptAliases.join(" | ");
        }


        const explainedType: string = this.explainType(option.type);
        aliasString += " {{italic}}" + this.dimGrey("(" + explainedType + ")") + "{{italic}}";
        // if (!option.required) {
        //    aliasString += " {{italic}}" + this.dimGrey("(optional)") + "{{italic}}";
        // }
        if (caseSensitive) {
            aliasString += " {{italic}}" + this.dimGrey("(case sensitive)") + "{{italic}}";
        }
        return this.renderHelp(format("{{codeBegin}}%s{{codeEnd}}%s", (option.name?.length === 1 ? "-" : "--") + option.name, aliasString));
    }

    public abstract buildFullCommandHelpText(includeGlobalOptions: boolean): string;

    protected buildOptionMaps() {
        this.groupToOption = {};
        this.optionToDescription = {};

        if (isNullOrUndefined(this.mCommandDefinition.options)) {
            return;
        }
        for (const option of this.mCommandDefinition.options.filter(opt => !opt.hidden)) {

            const group = option.group;
            if (!this.groupToOption[group]) {
                this.groupToOption[group] = [];
            }
            const caseSensitive = this.getCaseSensitiveFlagByOptionName(option.name);
            const optionAndAliases = this.getOptionAndAliasesString(option, caseSensitive);
            this.groupToOption[group].push(optionAndAliases);

            // build the option help text
            let optionText = option.description;
            const defaultValueText = [undefined, null].includes(option.defaultValue) ? "" : this.grey("\nDefault value: " + option.defaultValue);
            const allowableValuesText = option.allowableValues ? this.grey("\nAllowed values: " + option.allowableValues.values.join(", ")) : "";
            if (defaultValueText.length > 0 || allowableValuesText.length > 0) {
                optionText += "\n";
                optionText += defaultValueText + allowableValuesText;
            }

            // Place the help text in the map
            this.optionToDescription[optionAndAliases] = optionText;
        }
    }

    protected getCaseSensitiveFlagByOptionName(optionName: string): boolean {
        if (!isNullOrUndefined(this.mCommandDefinition.customize) &&
            !isNullOrUndefined(this.mCommandDefinition.customize.commandStatement) &&
            !isNullOrUndefined(this.mCommandDefinition.customize.commandStatement.children)) {
            for (const child of this.mCommandDefinition.customize.commandStatement.children) {
                if (child.name.toUpperCase() === optionName.toUpperCase()) {
                    return child.caseSensitive;
                }
            }
        }
        return undefined;
    }

    protected renderHelp(help: string): string {
        if (isNullOrUndefined(help)) {
            throw new ImperativeError({
                msg: "Help unable to be rendered - the supplied help text was null or undefined."
            });
        }
        // avoid replacing any literal {{strings like this}} in the help
        const validTags = ["indent", "space", "italic", "header", "bullet", "codeBegin", "codeEnd"];
        const mustachePattern = /\{\{([a-z0-9-]*?)\}\}/ig;
        help = help.replace(mustachePattern, (fullMatch, variableName) => {
            if (validTags.indexOf(variableName) >= 0) {
                return fullMatch;
            }
            else {
                // temporarily change the mustache delimiter to avoid
                // replacing literal curly braces in the help
                return "{{=<% %>=}}" + fullMatch + "<%={{ }}=%>";
            }
        });

        if (this.mProduceMarkdown) {
            return TextUtils.renderWithMustache(help, {
                indent: "\t",
                space: " ",
                italic: "*",
                header: "#",
                bullet: "*",
                codeBegin: "`",
                codeEnd: "`"
            });
        } else {
            return TextUtils.renderWithMustache(help, {
                indent: "",
                space: "",
                header: "",
                italic: "",
                bullet: "",
                codeBegin: "",
                codeEnd: ""
            });
        }
    }

    protected explainType(type: CommandOptionType) {
        let explainedType = type as string;
        if (explainedType === "existingLocalFile") {
            explainedType = "local file path";
        } else if (explainedType === "stringOrEmpty") {
            explainedType = "string";
        }
        return explainedType;
    }

    /**
     * Highlight text in dim grey (disabled if producing markdown)
     * @param {string} text - the text you would like to highlight
     * @returns {string} the highlighted text
     */
    protected dimGrey(text: string) {
        if (this.mProduceMarkdown) {
            return text;
        }
        return TextUtils.chalk.grey.dim(text);
    }

    /**
     * Highlight text in grey (disabled if producing markdown)
     * @param {string} text - the text you would like to highlight
     * @returns {string} the highlighted text
     */
    protected grey(text: string) {
        if (this.mProduceMarkdown) {
            return text;
        }
        return TextUtils.chalk.grey(text);
    }

    /*
     * Highlight text in orange (disabled if producing markdown)
     * @param {string} text - the text you would like to highlight
     * @returns {string} the highlighted text
     *
     * This function is unused, but it is here in case we ever want it.
     * It is too difficult to test uncalled private functions in jest,
     * so this function is just commented out.
     *
    protected orange(text: string) {
        if (this.mProduceMarkdown) {
            return text;
        }
        return TextUtils.chalk.keyword("orange")(text);
    }
    */
}
