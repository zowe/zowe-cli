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

import * as fs from "fs";
import { inspect, isNullOrUndefined } from "util";
import { syntaxErrorHeader } from "../../../messages";
import { CliUtils } from "../../../utilities/src/CliUtils";
import { Constants } from "../../../constants";
import { ICommandDefinition } from "../doc/ICommandDefinition";
import { ICommandValidatorResponse } from "../doc/response/response/ICommandValidatorResponse";
import { CommandUtils } from "../utils/CommandUtils";
import { ICommandOptionDefinition } from "../doc/option/ICommandOptionDefinition";
import { ICommandPositionalDefinition } from "../doc/option/ICommandPositionalDefinition";
import { ICommandOptionValueImplications } from "../doc/option/ICommandOptionValueImplications";
import { ICommandOptionAllowableValues } from "../doc/option/ICommandOptionAllowableValues";
import { ICommandValidatorError } from "../doc/response/response/ICommandValidatorError";
import { CommandResponse } from "../response/CommandResponse";
import { Logger } from "../../../logger";
import { TextUtils } from "../../../utilities";
import { ICommandArguments } from "../doc/args/ICommandArguments";

/**
 * The Imperative default syntax validator. Accepts the input arguments, command
 * definitions, and a response object. Validates the syntax and issues the
 * appropriate error messages if necessary.
 *
 * TODO - Consider limiting to a single purpose of producing error documents
 * TODO - that will be outputted by the command processor in a "more structured"
 * TODO - fasion.
 *
 * @export
 * @class SyntaxValidator
 */
export class SyntaxValidator {
    /**
     * Command option short/long
     */
    public static SHORT = "-";
    public static LONG = "--";

    /**
     * The command definition supplied to validate the arguments against.
     */
    private mCommandDefinition: ICommandDefinition;

    /**
     * The full command definition - which includes the parents of the command.
     */
    private mDefinitionTree: ICommandDefinition;

    /**
     * The full list of command options from the command definition
     */
    private mOptionDefinitionsMap: any;

    /**
     * Get an instance of the logger.
     * @private
     * @type {Logger}
     * @memberof SyntaxValidator
     */
    private mLogger: Logger = Logger.getImperativeLogger();

    /**
     * The error list that is appended to the error response object.
     * @private
     * @type {ICommandValidatorError}
     * @memberof SyntaxValidator
     */
    private mErrorList: ICommandValidatorError[] = [];

    /**
     * Create the object - maintains the definition used to validate against the input arguments.
     * @param {ICommandDefinition} commandDefinition: The command definition document
     * @param {ICommandDefinition} fullCommandDefinition: The full command definition
     */
    constructor(commandDefinition: ICommandDefinition, fullCommandDefinition: ICommandDefinition) {
        this.mCommandDefinition = commandDefinition;
        this.mOptionDefinitionsMap = [];
        if (this.mCommandDefinition.options) {
            for (const option of this.mCommandDefinition.options) {
                this.mOptionDefinitionsMap[option.name] = option;
            }
        }

        this.mDefinitionTree = fullCommandDefinition;
    }

    /**
     * Validate the command syntax.
     * @param {CommandResponse} responseObject: The response object to output the messages.
     * @param {ICommandArguments} commandArguments
     * @return {Promise<ICommandResponse>}
     */
    public validate(responseObject: CommandResponse, commandArguments: ICommandArguments): Promise<ICommandValidatorResponse> {
        return new Promise<ICommandValidatorResponse>((validationComplete) => {
            const syntaxValid: boolean = this.validateSyntax(commandArguments, responseObject);
            validationComplete({valid: syntaxValid});
        });
    }

    /**
     * Validate the options. Includes automatic validation based on option
     * and command definition as well as
     * custom validation provided by the user
     * @return {boolean}: True if the options are valid
     */
    private validateSyntax(commandArguments: ICommandArguments, responseObject: CommandResponse): boolean {
        const optionDefs = this.mOptionDefinitionsMap as { [key: string]: ICommandOptionDefinition };
        let valid = true;

        const util = CommandUtils;
        const fullCommandName = CommandUtils.getFullCommandName(this.mCommandDefinition, this.mDefinitionTree);

        /**
         * Prevent empty string options, regardless of if they are
         * required or not  e.g.   --zosmf-profile (without a value)
         */
        if (!isNullOrUndefined(this.mCommandDefinition.options)) {
            for (const option of this.mCommandDefinition.options) {
                if (!isNullOrUndefined(commandArguments[option.name]) &&
                    (option.type !== "stringOrEmpty" && commandArguments[option.name] === "") ||
                    (option.type !== "boolean" && commandArguments[option.name] === true)) {
                    valid = false;
                    this.emptyValueError(responseObject, option.name);
                }
            }
        }

        const expectedUnderscoreLength = fullCommandName.split(" ").length;
        /**
         * Reject unknown positional arguments
         * TODO Investigate removing this because currently it is not being used. After updating
         * yargs to version >14, it handles unknown positionals automatically in strict mode, before
         * Imperative gets a chance to detect them.
         */
        if (this.mCommandDefinition.type === "command" &&
            !isNullOrUndefined(this.mCommandDefinition.name) &&
            commandArguments._.length > expectedUnderscoreLength) {
            valid = false;
            this.unknownPositionalError(responseObject, commandArguments, expectedUnderscoreLength);
        } else {
            this.mLogger.trace("no unknown positionals. Length of positional arguments was: %s. Contents of _ were %s, Expected " +
                "\"_\" to have length of %s", commandArguments._.length, commandArguments._, expectedUnderscoreLength);
        }

        /**
         * If there is a set of options of which at least one must be specified,
         * make sure at least one of them was specified by the user.
         */
        if (this.mCommandDefinition.mustSpecifyOne &&
            this.mCommandDefinition.mustSpecifyOne.length > 0) {
            let atLeastOneRequiredOptionFound = false;
            for (const option of Object.keys(commandArguments)) {
                if (util.optionWasSpecified(option, this.mCommandDefinition, commandArguments) &&
                    this.mCommandDefinition.mustSpecifyOne.indexOf(option) >= 0) {
                    atLeastOneRequiredOptionFound = true;
                    this.mLogger.debug(".mustSpecifyOneOf() satisfied by %s", option);
                    break;
                }
            }
            if (!atLeastOneRequiredOptionFound) {
                this.mustSpecifyOneError(responseObject);
                valid = false;
            }
        }

        /**
         * If there is a set of options of which at least one must be specified,
         * make sure at least one of them was specified by the user.
         */
        if (this.mCommandDefinition.onlyOneOf &&
            this.mCommandDefinition.onlyOneOf.length > 0) {
            const specified: string[] = [];
            for (const option of this.mCommandDefinition.onlyOneOf) {
                if (util.optionWasSpecified(option, this.mCommandDefinition, commandArguments)) {
                    specified.push(option);
                    this.mLogger.debug(".onlyOneOf option present: %s", option);
                } else {
                    this.mLogger.debug(".onlyOneof option not specified: %s", option);
                }
            }
            if (specified.length > 1) {
                this.onlyOneOfError(responseObject, specified);
                valid = false;
            } else {
                this.mLogger.debug(".onlyOneOf validation passed. %d of the following options were specified: " +
                    "[%s]", specified.length, this.mCommandDefinition.onlyOneOf.join(", "));
            }
        }

        /**
         * Check for missing positional arguments. We can enforce this at the "yargs" definition level, however
         * we would like to have more syntax validation and control over the error message. Therefore, the mark them
         * as "optional" to yargs and enforce the required here.
         */
        if (!isNullOrUndefined(this.mCommandDefinition.positionals) && this.mCommandDefinition.positionals.length > 0) {
            const missingPositionals: ICommandPositionalDefinition[] = [];
            for (const positional of this.mCommandDefinition.positionals) {
                if (positional.required) {
                    // Use replace to trim possible ... which is used for arrays
                    const positionalName = positional.name.replace("...", "");
                    if (commandArguments[positionalName] == null ||
                        (positional.type !== "stringOrEmpty" && commandArguments[positionalName] === "")) {
                        missingPositionals.push(positional);
                    }
                }
            }
            if (missingPositionals.length > 0) {
                this.missingPositionalParameter(missingPositionals, responseObject);
                valid = false;
            }

            /**
             * Validate that the positional parameter matches the supplied regex.
             */
            for (const positional of this.mCommandDefinition.positionals) {
                if (!isNullOrUndefined(commandArguments[positional.name])) {
                    if (positional.regex) {
                        if (isNullOrUndefined(commandArguments[positional.name]
                            .toString().match(new RegExp(positional.regex)))) {
                            valid = false;
                            this.positionalParameterInvalid(positional,
                                commandArguments[positional.name], responseObject);
                        }
                    }
                    if (positional.type === "number") {
                        valid = this.validateNumeric(commandArguments[positional.name], positional, responseObject, true) && valid;
                    }

                    if (!isNullOrUndefined(positional.stringLengthRange) &&
                        !isNullOrUndefined(positional.stringLengthRange[0]) &&
                        !isNullOrUndefined(positional.stringLengthRange[1])) {
                        valid = this.validateOptionValueLength(positional, commandArguments[positional.name], responseObject, true) && valid;
                    }
                }

            }
        }

        for (const optionName of Object.keys(optionDefs)) {
            const optionDef: ICommandOptionDefinition = optionDefs[optionName];

            /**
             * Are any required options omitted?
             */
            if (optionDef.required && !util.optionWasSpecified(optionName, this.mCommandDefinition, commandArguments)) {
                this.missingOptionError(optionDef, responseObject);
                valid = false;
            }

            /**
             * If omitting an option implies that some other option must be specified,
             * validate that with any missing options
             */
            if (!isNullOrUndefined(optionDef.absenceImplications) && optionDef.absenceImplications.length > 0) {
                for (const implication of optionDef.absenceImplications) {
                    if (!util.optionWasSpecified(optionName, this.mCommandDefinition, commandArguments)
                        && !util.optionWasSpecified(implication, this.mCommandDefinition, commandArguments)) {
                        this.absenceImplicationError(optionDef, responseObject);
                        valid = false;
                        break;
                    }
                }
            }

            /**
             * validations that only apply if the option has been specified
             * We consider setting a flag to false  to be "not specifying it"
             */
            if (util.optionWasSpecified(optionName, this.mCommandDefinition, commandArguments)) {

                // yargs puts options specified multiple times into an array even if they are string
                // type. We want to prevent this.
                if (optionDef.type !== "array" && Array.isArray(commandArguments[optionName])) {
                    valid = false;
                    this.specifiedMultipleTimesError(optionDef, responseObject);
                }

                // if the option type IS array but the value provided is not an array,
                // that's an error
                if (optionDef.type === "array" && !Array.isArray(commandArguments[optionName])) {
                    valid = false;
                    this.notAnArrayError(optionDef, responseObject, commandArguments[optionName]);
                }

                // check if the value of the option conforms to the allowableValues (if any)
                if (!isNullOrUndefined(optionDef.allowableValues)) {
                    // Make a copy of optionDef, so that modifications below are only used in this place
                    const optionDefCopy: ICommandOptionDefinition = JSON.parse(JSON.stringify(optionDef));
                    // Use modified regular expressions for allowable values to check and to generate error
                    optionDefCopy.allowableValues.values = optionDef.allowableValues.values.map((regex) => {
                        // Prepend "^" if not existing
                        if (!regex.startsWith("^")) {
                            regex = "^" + regex;
                        }

                        // Append "$" if the last char is an escaped "$" or chars other than "$"
                        if (!regex.endsWith("$") || regex.endsWith("\\$")) {
                            regex = regex + "$";
                        }

                        return regex;
                    });

                    const optionValue = commandArguments[optionName];
                    const optionValueArray = Array.isArray(optionValue) ? optionValue : [optionValue];
                    optionValueArray.filter(value => !this.checkIfAllowable(optionDefCopy.allowableValues, value))
                        .forEach(value => {
                            this.invalidOptionError(optionDefCopy, responseObject, value);
                            valid = false;
                        });
                }

                if (!isNullOrUndefined(optionDef.conflictsWith) && optionDef.conflictsWith.length > 0) {
                    for (const conflict of optionDef.conflictsWith) {
                        if (util.optionWasSpecified(conflict, this.mCommandDefinition, commandArguments)) {
                            this.optionCombinationInvalidError(optionDef,
                                this.getOptionDefinitionFromName(conflict), responseObject);
                            valid = false;
                        }
                    }
                }

                /**
                 * Check validity of implications
                 */
                if (!isNullOrUndefined(optionDef.implies) && optionDef.implies.length > 0) {
                    for (const implication of optionDef.implies) {
                        if (!util.optionWasSpecified(implication, this.mCommandDefinition, commandArguments)) {
                            this.optionDependencyError(optionDef, this.mOptionDefinitionsMap[implication],
                                responseObject);
                            valid = false;
                        }
                    }
                }

                /**
                 * Check validity of 'implication alternatives' (.impliesOneOf())
                 */
                if (!isNullOrUndefined(optionDef.impliesOneOf) && optionDef.impliesOneOf.length > 0) {
                    let implicationSatisfied = false;
                    for (const implication of optionDef.impliesOneOf) {
                        if (util.optionWasSpecified(implication, this.mCommandDefinition, commandArguments)) {
                            this.mLogger.debug(".impliesOneOf() was satisfied by %s", implication);
                            implicationSatisfied = true;
                            break;
                        }
                    }
                    if (!implicationSatisfied) {
                        this.implicationAlternativeError(optionDef, responseObject);
                        valid = false;
                    }
                }

                /**
                 * Check whether local files exist if they are supposed to
                 */
                if (optionDef.type === "existingLocalFile") {
                    if (!fs.existsSync(commandArguments[optionDef.name])) {
                        this.fileOptionError(optionDef, commandArguments, responseObject);
                        valid = false;
                    } else {
                        this.mLogger.debug("the local file %s existed as required",
                            commandArguments[optionDef.name]);
                    }
                } else if (optionDef.type === "boolean") {
                    valid = this.validateBoolean(commandArguments[optionDef.name], optionDef,
                        responseObject) && valid;
                } else if (optionDef.type === "number") {
                    valid = this.validateNumeric(commandArguments[optionDef.name], optionDef,
                        responseObject) && valid;
                }
                /**
                 * Validate that the option's value is valid json.
                 */
                else if (optionDef.type === "json") {
                    try {
                        JSON.parse(commandArguments[optionDef.name]);
                    } catch (e) {
                        valid = false;
                        this.invalidJsonString(e, this.mOptionDefinitionsMap[optionDef.name], responseObject,
                            commandArguments[optionDef.name]);
                    }
                }

                /**
                 * Validate option values
                 */
                if (!isNullOrUndefined(optionDef.numericValueRange) &&
                    !isNullOrUndefined(optionDef.numericValueRange[0]) &&
                    !isNullOrUndefined(optionDef.numericValueRange[1])) {
                    valid = this.validateOptionValueRange(optionDef, commandArguments[optionDef.name],
                        responseObject) && valid;
                }

                /**
                 * Validate option lengths
                 */
                if (!isNullOrUndefined(optionDef.stringLengthRange) &&
                    !isNullOrUndefined(optionDef.stringLengthRange[0]) &&
                    !isNullOrUndefined(optionDef.stringLengthRange[1])) {
                    valid = this.validateOptionValueLength(optionDef, commandArguments[optionDef.name],
                        responseObject) && valid;
                }

                /**
                 * Validate array duplication
                 */
                if (optionDef.type === "array" && optionDef.arrayAllowDuplicate === false) {
                    const value = commandArguments[optionDef.name];
                    if (Array.isArray(value)) {
                        valid = this.validateArrayDuplicate(optionDef, value, responseObject) && valid;
                    }
                }

                if (!isNullOrUndefined(optionDef.valueImplications) && Object.keys(optionDef.valueImplications).length > 0) {
                    for (const value of Object.keys(optionDef.valueImplications)) {
                        const implicationObject: ICommandOptionValueImplications
                            = optionDef.valueImplications[value];
                        if ((implicationObject.isCaseSensitive &&
                            commandArguments[optionName] === value) ||
                            (!implicationObject.isCaseSensitive &&
                                commandArguments[optionName].toUpperCase() === value.toUpperCase())) {
                            for (const impliedOption of implicationObject.impliedOptionNames) {
                                if (!util.optionWasSpecified(impliedOption,
                                    this.mCommandDefinition, commandArguments)) {
                                    this.valueRequiresAdditionalOption(optionDef,
                                        value, this.getOptionDefinitionFromName(impliedOption), responseObject);
                                    valid = false;
                                }
                            }
                        }
                    }
                }
            }
        }

        // TODO - call custom validator?
        return valid;
    }

    /**
     * Issue an error message indicating that the JSON string provided is not valid.
     * @param {Error} error - the JSON parse try/catch error.
     * @param {ICommandOptionDefinition} optionDefinition - The Option definition
     * Validate the options. Includes automatic validation based on option
     * and command definition as well as custom validation provided by the user
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @return {boolean}: True if the options are valid, false if there is a syntax error
     */
    private invalidJsonString(error: Error, optionDefinition: ICommandOptionDefinition,
        responseObject: CommandResponse, valueSpecified: any) {
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        // TODO - check if JSON can be positional
        const msg: string = responseObject.console.error(
            `Invalid JSON string supplied for the following option:\n${this.getDashFormOfOption(optionDefinition.name)}\n` +
            `\nYou specified:\n${valueSpecified}\n` +
            `\nJSON parsing failed with the following error:\n${error.message}`);
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDefinition.name, definition: optionDefinition});
    }

    /**
     * Issue the 'file must exist' error
     * @param {ICommandOptionDefinition} optionDefinition: the option definition for which the user specified a non-existent file
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @param {ICommandArguments} commandArguments: The arguments specified by the user.
     * @param isPositional - is the option a positional option? defaults to false
     */
    private fileOptionError(optionDefinition: ICommandOptionDefinition | ICommandPositionalDefinition,
        commandArguments: ICommandArguments, responseObject: CommandResponse,
        isPositional: boolean = false): void {
        const mustacheSummary: any = this.getMustacheSummaryForOption(optionDefinition, isPositional);
        mustacheSummary.value = commandArguments[optionDefinition.name];
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject
            .console.error("Invalid file path specified for option:\n{{long}} {{aliases}}\n" +
                "\nYou specified:\n\"{{&value}}\"\n\nThe file does not exist",
            mustacheSummary);
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDefinition.name, definition: optionDefinition});
    }

    /**
     * Build up an object used for filling in syntax error messages with fields from an
     * option definition
     * @param optionDefinition - the option definition to use
     * @param isPositional - is the option a positional option? defaults to false
     * @returns {{long: string, aliases: string, description: string}} -
     *              an object used to replace {{variables}} with mustache
     */
    private getMustacheSummaryForOption(optionDefinition: ICommandOptionDefinition | ICommandPositionalDefinition,
        isPositional: boolean = false): any {
        let aliasString;

        if (!isPositional) {
            const def = optionDefinition as ICommandOptionDefinition;
            aliasString = (!isNullOrUndefined(def.aliases) && def.aliases.length > 0) ?
                "(" + def.aliases.map((alias: string) => {
                    return this.getDashFormOfOption(alias);
                }).join(",") + ")" : "";
        } else {
            aliasString = "";
        }
        let longName: string;
        if (isPositional) {
            longName = CliUtils
                .getPositionalSyntaxString(optionDefinition.required, optionDefinition.name);
        } else {
            longName = CliUtils.getDashFormOfOption(optionDefinition.name);
        }
        return {
            long: longName,
            aliases: aliasString,
            description: TextUtils.wordWrap(optionDefinition.description)
        };
    }

    /**
     * Get the 'dash form' of an option as it would appear in a user's command,
     * appending the proper number of dashes depending on the length of the option name
     * @param {string} optionName - e.g. my-option
     * @returns {string} - e.g. --my-option
     */
    private getDashFormOfOption(optionName: string): string {
        const dashes = optionName.length > 1 ? Constants.OPT_LONG_DASH :
            Constants.OPT_SHORT_DASH;
        return dashes + optionName;
    }

    private getOptionDefinitionFromName(name: string): ICommandOptionDefinition {
        const defs: { [key: string]: ICommandOptionDefinition } =
            this.mOptionDefinitionsMap as { [key: string]: ICommandOptionDefinition };
        for (const defName of Object.keys(defs)) {
            if (defName === name) {
                return defs[defName];
            }
        }
        throw new Error("No such option was defined: " + name);
    }

    /**
     * Accept the input and check for a match.
     * @param {string} input: the input value to check.
     * @param {ICommandOptionAllowableValues} allowable: The set of allowable values.
     * @returns {boolean}: true if the value is allowable.
     */
    private checkIfAllowable(allowable: ICommandOptionAllowableValues, input: string): boolean {
        let matchFound: boolean = false;
        for (const value of allowable.values) {
            const flags = allowable.caseSensitive ? "g" : "ig";
            if (new RegExp(value, flags).test(input)) {
                matchFound = true;
                break;
            }
        }
        return matchFound;
    }

    /**
     * Issue the 'option is required' error.
     * @param {ICommandOptionDefinition} optionDefinition: the definition for this option
     * @param {CommandResponse} responseObject: The response object for producing messages.
     */
    private missingOptionError(optionDefinition: ICommandOptionDefinition,
        responseObject: CommandResponse): void {
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject.console.error(
            "Missing Required Option:\n{{long}} {{aliases}}\n\n" +
            "Option Description:\n{{description}}",
            this.getMustacheSummaryForOption(optionDefinition));
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDefinition.name, definition: optionDefinition});
    }

    /**
     * Issue error message indicating that the positional parameter specified does not match the regex.
     * @param {ICommandPositionalDefinition} positionalDefinition: The positional argument definition.
     * @param {string} specified: The argument that was specified.
     * @param {CommandResponse} responseObject: The response object for producing messages.
     */
    private positionalParameterInvalid(positionalDefinition: ICommandPositionalDefinition, specified: string,
        responseObject: CommandResponse) {
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string =
            responseObject.console.error("Invalid format specified for positional option:\n{{parameter}}\n\n" +
                "You specified:\n{{spec}}\n\nOption must match the following regular expression:\n{{format}}",
            {
                parameter: positionalDefinition.name, format: positionalDefinition.regex,
                spec: specified, desc: TextUtils.wordWrap(positionalDefinition.description)
            });
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: positionalDefinition.name, definition: positionalDefinition});
    }

    /**
     * Validate the that option's value is within the range specified. If not, error messages will be issued.
     *
     * @param {ICommandOptionDefinition} optionDefinition: The option definition
     * @param {string} optionValue: The option value
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @return {boolean}: false if the option's value is not valid.
     */
    private validateOptionValueRange(optionDefinition: ICommandOptionDefinition, optionValue: number,
        responseObject: CommandResponse): boolean {
        let valid: boolean = true;
        const min = optionDefinition.numericValueRange[0];
        const max = optionDefinition.numericValueRange[1];
        if ((optionValue < min) ||
            (optionValue > max)) {
            responseObject.console.errorHeader(syntaxErrorHeader.message);
            const msg: string = responseObject.console.error("Invalid numeric value specified for option:\n{{option}}\n\n" +
                "You specified:\n{{value}}\n\n" +
                "Value must be between {{min}} and {{max}} (inclusive)", {
                option: this.getDashFormOfOption(optionDefinition.name),
                length: optionValue,
                value: optionValue,
                min,
                max,
            });
            valid = false;
            this.appendValidatorError(responseObject,
                {message: msg, optionInError: optionDefinition.name, definition: optionDefinition});
        }

        return valid;
    }

    /**
     * Validate the that option's value is within the range specified. If not, error messages will be issued.
     *
     * @param {ICommandOptionDefinition|ICommandPositionalDefinition} optionDefinition: The option definition
     * @param {string} optionValue: The option value
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @param isPositional - is this a positional option? this method works with regular options and positionals
     * @return {boolean}: false if the value is not valid.
     */
    private validateOptionValueLength(optionDefinition: ICommandOptionDefinition | ICommandPositionalDefinition, optionValue: string,
        responseObject: CommandResponse, isPositional: boolean = false): boolean {
        let valid: boolean = true;
        const min = optionDefinition.stringLengthRange[0];
        const max = optionDefinition.stringLengthRange[1];

        if (optionValue.length < min || optionValue.length > max) {
            responseObject.console.errorHeader(syntaxErrorHeader.message);
            const msg: string = responseObject.console.error("Invalid value length for option:\n{{option}}\n\n" +
                "You specified a string of length {{length}}:\n{{optionValue}}\n\n" +
                "The length must be between {{min}} and {{max}} (inclusive)", {
                option: isPositional ? optionDefinition.name : this.getDashFormOfOption(optionDefinition.name),
                length: optionValue.length,
                optionValue,
                min,
                max
            });
            this.appendValidatorError(responseObject,
                {message: msg, optionInError: optionDefinition.name, definition: optionDefinition});
            valid = false;
        }

        return valid;
    }

    /**
     * Validate if the option's value as array contains duplicates. If yes, error messages will be issued.
     *
     * @param {ICommandOptionDefinition} optionDefinition: The option definition
     * @param {string} optionValue: The option value
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @return {boolean}: false if the value is not valid.
     */
    private validateArrayDuplicate(optionDefinition: ICommandOptionDefinition,
        optionValue: string[],
        responseObject: CommandResponse): boolean {
        const existingValuesSet = new Set<string>();
        const duplicateValuesSet = new Set<string>();

        // Determine duplicate values
        for (const value of optionValue) {
            if (existingValuesSet.has(value)) {
                duplicateValuesSet.add(value);
            } else {
                existingValuesSet.add(value);
            }
        }

        // Print error for each duplicate value
        for (const duplicateValue of duplicateValuesSet) {
            responseObject.console.errorHeader(syntaxErrorHeader.message);
            const msg: string = responseObject.console.error("Duplicate value specified for option:\n{{option}}\n\n" +
                "You specified:\n{{value}}\n\n" +
                "Duplicate values are not allowed", {
                option: this.getDashFormOfOption(optionDefinition.name),
                value: duplicateValue
            });
            this.appendValidatorError(responseObject,
                {message: msg, optionInError: optionDefinition.name, definition: optionDefinition});
        }

        const valid = (duplicateValuesSet.size === 0);
        return valid;
    }

    /**
     * Issue the options require one another (dependency) error.
     *
     * @param {ICommandOptionDefinition} optionDef1: the first option that requires the second (or visa-versa)
     * @param {ICommandOptionDefinition} optionDef2: the first option that requires the second (or visa-versa)
     * @param {CommandResponse} responseObject: The response object for producing messages.
     */
    private optionDependencyError(optionDef1: ICommandOptionDefinition,
        optionDef2: ICommandOptionDefinition,
        responseObject: CommandResponse) {
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string =
            responseObject.console.error("If you specify the following option:\n{{option}}\n\nYou must also specify:\n{{dependsOn}}", {
                option: this.getDashFormOfOption(optionDef1.name),
                dependsOn: this.getDashFormOfOption(optionDef2.name),
            });
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDef1.name, definition: optionDef2});
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDef2.name, definition: optionDef2});
    }

    /**
     * "impliesOneOf" (implicationAlternatives) condition was not satisfied
     * @param {ICommandOptionDefinition} optionDef: the option that requires  at least one of a group of options
     * @param {CommandResponse} responseObject: The response object for producing messages.
     */
    private implicationAlternativeError(optionDef: ICommandOptionDefinition,
        responseObject: CommandResponse) {
        const implications = "[" + optionDef.impliesOneOf.map((implication) => {
            return this.getDashFormOfOption(this.getOptionDefinitionFromName(implication).name);
        }).join(",") + "]";
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject.console.error(
            "If you specify the following option:\n{{option}}\n\n" +
            "You must also specify at least one of the following:\n{{dependsOn}}", {
                option: this.getDashFormOfOption(optionDef.name),
                dependsOn: implications
            });
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDef.name, definition: optionDef});
    }

    /**
     *  If an option was specified, some other option should have been specified
     * @param {ICommandOptionDefinition} optionDef: the option whose absence implies the presence of other options.
     * @param {CommandResponse} responseObject: The response object for producing messages.
     */
    private absenceImplicationError(optionDef: ICommandOptionDefinition,
        responseObject: CommandResponse) {
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject.console.error("If you do not specify the following option:\n{{option}}\n" +
            "\nYou must specify one of these options:\n[{{dependsOn}}]", {
            option: this.getDashFormOfOption(optionDef.name),
            dependsOn: optionDef.absenceImplications.map((option) => {
                return this.getDashFormOfOption(this.getOptionDefinitionFromName(option).name);
            }).join(", ")
        });
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDef.name, definition: optionDef});
    }

    /**
     * Issue the options are mutually exclusive error.
     * @param {ICommandOptionDefinition} optionDef1: the first of the conflicting options.
     * @param {ICommandOptionDefinition} optionDef2: the second of hte conflicting options.
     * @param {CommandResponse} responseObject: The response object for producing messages.
     */
    private optionCombinationInvalidError(optionDef1: ICommandOptionDefinition,
        optionDef2: ICommandOptionDefinition,
        responseObject: CommandResponse) {
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string
            = responseObject.console.error("The following options conflict (mutually exclusive):\n{{a}}\n{{b}}", {
                a: this.getDashFormOfOption(optionDef1.name),
                b: this.getDashFormOfOption(optionDef2.name)
            });
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDef1.name, definition: optionDef1});
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDef2.name, definition: optionDef2});
    }

    /**
     * If the option was specified multiple times despite not being an array type option, that's a syntax error
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @param {ICommandOptionDefinition} failingOption: The option with the non-allowable value
     */
    private specifiedMultipleTimesError(failingOption: ICommandOptionDefinition,
        responseObject: CommandResponse) {
        const mustacheSummary = this.getMustacheSummaryForOption(failingOption);
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject.console.error(
            "You cannot specify the following option multiple times:\n{{long}} {{aliases}}",
            mustacheSummary);
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: failingOption.name, definition: failingOption});
    }

    /**
     * If the option requires one of a set of values and the value provided doesn't match
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @param {ICommandOptionDefinition} failingOption: The option with the non-allowable value
     * @param {any} value - the value specified by the user which was not an array
     */
    private notAnArrayError(failingOption: ICommandOptionDefinition,
        responseObject: CommandResponse, value: any) {
        const mustacheSummary = this.getMustacheSummaryForOption(failingOption);
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject.console.error(
            "The following option is of type 'array', but an array was not specified:\n{{long}} {{aliases}}" +
            "\n\nYou specified: " + value
            + "\n\nIf you are attempting to specify an array from an environmental variable, specify the value " +
            "delimited by spaces. If one of the values contains a space, you may surround it with single quotes.\nExample:" +
            "MY_VAR=\"value1 value2 'value 3 with space'",
            mustacheSummary);
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: failingOption.name, definition: failingOption});
    }

    /**
     * If the option requires one of a set of values and the value provided doesn't match
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @param {ICommandOptionDefinition} failingOption: The option with the non-allowable value
     * @param value - the value that was specified by the user
     */
    private invalidOptionError(failingOption: ICommandOptionDefinition,
        responseObject: CommandResponse, value: any) {
        const mustacheSummary = this.getMustacheSummaryForOption(failingOption);
        mustacheSummary.allowed = inspect(failingOption.allowableValues.values);
        mustacheSummary.optionVal = value;
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject.console.error(
            "Invalid value specified for option:\n{{long}} {{aliases}}\n\n" +
            "You specified:\n{{optionVal}}\n\n" +
            "The value must match one of the following regular expressions:\n{{allowed}}.",
            mustacheSummary);
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: failingOption.name, definition: failingOption});
    }

    /**
     * If this option's specification requires another  option to be present. e.g. '--type TXT' requires that
     * '--maxlinelength' be specified. That condition was not satisfied, so issue an error message
     *
     * @param {ICommandOptionDefinition} optionDef: The option definition whose value requires
     * more options which were not specified
     * (e.g. '--type TXT' the specification of TXT requires that the user specify '--maxlinelength')
     * @param {string} value: The value that requries additional options (e.g. TXT in '--type TXT'
     * @param {ICommandOptionDefinition} requires: The parameter that it requires.
     * @param {CommandResponse} responseObject: The response object for producing messages.
     */
    private valueRequiresAdditionalOption(optionDef: ICommandOptionDefinition, value: string,
        requires: ICommandOptionDefinition,
        responseObject: CommandResponse) {
        const aMustache = this.getMustacheSummaryForOption(optionDef);
        const bMustache = this.getMustacheSummaryForOption(requires);
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string
            = responseObject.console.error("If you specify the value {{value}}" +
            " for option {{a_long}} {{a_short}}, " +
            "you must also specify a value for the option  {{b_long}} {{b_short}}\nDescription:\n{{b_description}}",
            {
                value,
                a_long: aMustache.long,
                a_short: aMustache.aliases,
                b_long: bMustache.long,
                b_short: bMustache.aliases,
                b_description: TextUtils.wordWrap(bMustache.description)
            });
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionDef.name, definition: optionDef});
    }

    /**
     * Validate that the option's value is a boolean type
     * @param {any} value: The value passed to validate.
     * @param {ICommandOptionDefinition} optionDefinition: The definition for this option.
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @param isPositional - is the option a positional option? defaults to false
     */
    private validateBoolean(value: any,
        optionDefinition: ICommandOptionDefinition,
        responseObject: CommandResponse,
        isPositional: boolean = false): boolean {
        const mustacheSummary: any = this.getMustacheSummaryForOption(optionDefinition, isPositional);
        mustacheSummary.value = value;

        if (value !== undefined && value !== true && value !== false) {
            responseObject.console.errorHeader(syntaxErrorHeader.message);
            const msg: string = responseObject
                .console.error("Invalid value specified for option:\n{{long}} {{aliases}}\n\n" +
                    "You specified:\n{{value}}\n\n" +
                    "The value must be a boolean (true or false).",
                mustacheSummary);
            this.appendValidatorError(responseObject,
                {message: msg, optionInError: optionDefinition.name, definition: optionDefinition});
            return false;
        }
        return true;
    }


    /**
     * Validate that the option's value is numeric.
     * @param {any} value: The value passed to validate.
     * @param {ICommandOptionDefinition| ICommandPositionalDefinition} optionDefinition: The definition for this option.
     * @param {CommandResponse} responseObject: The response object for producing messages.
     * @param isPositional - is the option a positional option? defaults to false
     */
    private validateNumeric(value: any,
        optionDefinition: ICommandOptionDefinition | ICommandPositionalDefinition,
        responseObject: CommandResponse,
        isPositional: boolean = false): boolean {
        const mustacheSummary: any = this.getMustacheSummaryForOption(optionDefinition, isPositional);
        mustacheSummary.value = value;
        if (isNaN(value)) {
            responseObject.console.errorHeader(syntaxErrorHeader.message);
            const msg: string = responseObject
                .console.error("Invalid value specified for option:\n{{long}} {{aliases}}\n\n" +
                    "You specified:\n{{value}}\n\n" +
                    "The value must be a number",
                mustacheSummary);
            this.appendValidatorError(responseObject,
                {message: msg, optionInError: optionDefinition.name, definition: optionDefinition});
            return false;
        }
        return true;
    }

    /**
     * If one of a set of options are required, issue an error message with the list of required options.
     */
    private mustSpecifyOneError(responseObject: CommandResponse) {
        const missingOptionNames: string[] = this.mCommandDefinition.mustSpecifyOne.map((option) => {
            return this.getDashFormOfOption(this.getOptionDefinitionFromName(option).name);
        });
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject.console.error(
            "You must specify one of the following options for this command:\n[%s]",
            missingOptionNames.join(", "));
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: missingOptionNames.toString()});
    }

    /**
     * If more than one of a set of options are specified, issue an error message with the list of offending options
     */
    private onlyOneOfError(responseObject: CommandResponse, specified: string[]) {
        const onlyOneOf: string[] = this.mCommandDefinition.onlyOneOf.map((option) => {
            return this.getDashFormOfOption(this.getOptionDefinitionFromName(option).name);
        });
        const specifiedDashForm: string[] = specified.map((option) => {
            return this.getDashFormOfOption(option);
        });
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject.console.error(
            "You may specify only one of the following options for this command:\n[%s]\n\n" +
            "You specified the following:\n[%s]",
            onlyOneOf.join(", "), specifiedDashForm.join(", "));
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: onlyOneOf.toString()});
    }

    /**
     * If the user specifies no value for an option that requires a string value,
     * that's an error
     */
    private emptyValueError(responseObject: CommandResponse, optionName: string) {
        responseObject.console.errorHeader(syntaxErrorHeader.message);
        const msg: string = responseObject.console.error(
            "No value specified for option:\n%s\n\n" +
            "This option requires a value of type:\n%s\n\n" +
            "Option Description:\n%s",
            CliUtils.getDashFormOfOption(optionName),
            this.getOptionDefinitionFromName(optionName).type,
            TextUtils.wordWrap(this.getOptionDefinitionFromName(optionName).description));
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: optionName});
    }

    /**
     * If the user specifies an extra positional option
     */
    private unknownPositionalError(responseObject: CommandResponse, commandArguments: ICommandArguments,
        expectedUnderscoreLength: number) {
        responseObject.console.errorHeader(syntaxErrorHeader.message);

        const badOptionsSummary = commandArguments._.slice(expectedUnderscoreLength)
            .map((argument) => {
                return "\"" + argument + "\"";
            }).join(", ");

        const msg: string = responseObject.console.error(
            "You specified the following unknown values: %s.\n\n Could not " +
            "interpret them as a group, command name, or positional option.",
            badOptionsSummary
        );
        this.appendValidatorError(responseObject,
            {message: msg, optionInError: "unknown"});
    }

    /**
     * Issue an error message indicating the missing positional parameters
     * @param {string[]} missingPositionals - The list of missing positional parameters for the command.
     * @param {CommandResponse} responseObject: The response object for producing messages.
     */
    private missingPositionalParameter(missingPositionals: ICommandPositionalDefinition[],
        responseObject: CommandResponse) {
        for (const missing of missingPositionals) {
            responseObject.console.errorHeader(syntaxErrorHeader.message);
            const message: string
                = responseObject.console.error("Missing Positional Argument: {{missing}}\n" +
                "Argument Description: {{optDesc}}",
                {missing: missing.name, optDesc: TextUtils.wordWrap(missing.description)});
            this.appendValidatorError(responseObject,
                {
                    message,
                    optionInError: missing.name, definition: missing
                });
        }
    }

    /**
     * Append the validator error to the response object.
     * @param {CommandResponse} responseObject: The Zowe response object
     * @param {ICommandValidatorError} error: The error to append.
     */
    private appendValidatorError(responseObject: CommandResponse, error: ICommandValidatorError) {
        this.mErrorList.push(error);
        responseObject.data.setObj(this.mErrorList);
    }
}
