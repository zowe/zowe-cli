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

import { ImperativeError } from "../../error";
import { Constants } from "../../constants";
import { Arguments } from "yargs";
import { TextUtils } from "./TextUtils";
import { IOptionFormat } from "./doc/IOptionFormat";
import { CommandProfiles, ICommandOptionDefinition, ICommandPositionalDefinition,
    ICommandProfile, IHandlerParameters
} from "../../cmd";
import { ICommandArguments } from "../../cmd/src/doc/args/ICommandArguments";
import { IProfile } from "../../profiles";
import * as prompt from "readline-sync";
import * as os from "os";
import { IPromptOptions } from "../../cmd/src/doc/response/api/handler/IPromptOptions";

/**
 * Cli Utils contains a set of static methods/helpers that are CLI related (forming options, censoring args, etc.)
 * @export
 * @class CliUtils
 */
export class CliUtils {
    /**
     * Used as the place holder when censoring arguments in messages/command output
     * @static
     * @memberof CliUtils
     */
    public static readonly CENSOR_RESPONSE = "****";

    /**
     * A list of cli options/keywords that should normally be censored
     * @static
     * @memberof CliUtils
     */
    public static CENSORED_OPTIONS = ["auth", "p", "pass", "password", "passphrase", "credentials",
        "authentication", "basic-auth", "basicAuth"];

    /**
     * Get the 'dash form' of an option as it would appear in a user's command,
     * appending the proper number of dashes depending on the length of the option name
     * @param {string} optionName - e.g. my-option
     * @returns {string} - e.g. --my-option
     */
    public static getDashFormOfOption(optionName: string): string {
        if ((optionName !== undefined && optionName !== null) && optionName.length >= 1) {
            const dashes = optionName.length > 1 ? Constants.OPT_LONG_DASH : Constants.OPT_SHORT_DASH;
            return dashes + optionName;
        } else {
            throw new ImperativeError({
                msg: "A null or blank option was supplied. Please correct the option definition."
            });
        }
    }

    /**
     * Copy and censor any sensitive CLI arguments before logging/printing
     * @param {string[]} args - The args list to censor
     * @returns {string[]}
     */
    public static censorCLIArgs(args: string[]): string[] {
        const newArgs: string[] = JSON.parse(JSON.stringify(args));
        const censoredValues = CliUtils.CENSORED_OPTIONS.map(CliUtils.getDashFormOfOption);
        for (const value of censoredValues) {
            if (args.indexOf(value) >= 0) {
                const valueIndex = args.indexOf(value);
                if (valueIndex < args.length - 1) {
                    newArgs[valueIndex + 1] = CliUtils.CENSOR_RESPONSE; // censor the argument after the option name
                }
            }
        }
        return newArgs;
    }

    /**
     * Copy and censor a yargs argument object before logging
     * @param {yargs.Arguments} args the args to censor
     * @returns {yargs.Arguments}  a censored copy of the arguments
     */
    public static censorYargsArguments(args: Arguments): Arguments {
        const newArgs: Arguments = JSON.parse(JSON.stringify(args));

        for (const optionName of Object.keys(newArgs)) {
            if (CliUtils.CENSORED_OPTIONS.indexOf(optionName) >= 0) {
                const valueToCensor = newArgs[optionName];
                newArgs[optionName] = CliUtils.CENSOR_RESPONSE;
                for (const checkAliasKey of Object.keys(newArgs)) {
                    if (newArgs[checkAliasKey] === valueToCensor) {
                        newArgs[checkAliasKey] = CliUtils.CENSOR_RESPONSE;
                    }
                }
            }
        }
        return newArgs;
    }


    /**
     * Accepts the full set of loaded profiles and attempts to match the option names supplied with profile keys.
     *
     * @param {Map<string, IProfile[]>} profileMap - the map of type to loaded profiles. The key is the profile type
     * and the value is an array of profiles loaded for that type.
     *
     * @param {definitions} definitions - the profile definition on the command.
     *
     * @param {(Array<ICommandOptionDefinition | ICommandPositionalDefinition>)} options - the full set of command options
     * for the command being processed
     *
     * @returns {*}
     *
     * @memberof CliUtils
     */
    public static getOptValueFromProfiles(profiles: CommandProfiles, definitions: ICommandProfile,
        options: Array<ICommandOptionDefinition | ICommandPositionalDefinition>): any {
        let args: any = {};

        // Construct the precedence order to iterate through the profiles
        let profileOrder: any = (definitions.required != null) ? definitions.required : [];
        if (definitions.optional != null) {
            profileOrder = profileOrder.concat(definitions.optional);
        }

        // Iterate through the profiles in the order they appear in the list provided. For each profile found, we will
        // attempt to match the option name to a profile property exactly - and extract the value from the profile.
        profileOrder.forEach((profileType: string) => {

            // Get the first profile loaded - for now, we won't worry about profiles and double-type loading for dependencies
            const profile: IProfile = profiles.get(profileType, false);
            if (profile == null && definitions.required != null && definitions.required.indexOf(profileType) >= 0) {
                throw new ImperativeError({
                    msg: `Profile of type "${profileType}" does not exist within the loaded profiles for the command and it is marked as required.`,
                    additionalDetails: `This is an internal imperative error. ` +
                        `Command preparation was attempting to extract option values from this profile.`
                });
            } else if (profile != null) {
                // For each option - extract the value if that exact property exists
                options.forEach((opt) => {
                    let cases;
                    if (profile[opt.name] == null && "aliases" in opt) {
                        // Use aliases for backwards compatibility
                        // Search for first alias available in the profile
                        const oldOption = opt.aliases.find(o => profile[o] != null);
                        // Get the camel an kebab case
                        if (oldOption) cases = CliUtils.getOptionFormat(oldOption);
                    }

                    if (cases == null) {
                        cases = CliUtils.getOptionFormat(opt.name);
                    }

                    // We have to "deal" with the situation that the profile contains both cases - camel and kebab.
                    // This is to support where the profile options have "-", but the properties are camel case in the
                    // yaml file - which is currently how most imperative CLIs have it coded.
                    const profileKebab = profile[cases.kebabCase];
                    const profileCamel = profile[cases.camelCase];

                    // If the profile has either type (or both specified) we'll add it to args if the args object
                    // does NOT already contain the value in any case
                    if ((profileCamel !== undefined || profileKebab !== undefined) &&
                        (!Object.prototype.hasOwnProperty.call(args, cases.kebabCase) &&
                         !Object.prototype.hasOwnProperty.call(args, cases.camelCase))) {

                        // If both case properties are present in the profile, use the one that matches
                        // the option name explicitly
                        const value = (profileKebab !== undefined && profileCamel !== undefined) ?
                            ((opt.name === cases.kebabCase) ? profileKebab : profileCamel) :
                            ((profileKebab !== undefined) ? profileKebab : profileCamel);
                        const keys = CliUtils.setOptionValue(opt.name,
                            ("aliases" in opt) ? (opt as ICommandOptionDefinition).aliases : [],
                            value
                        );
                        args = {...args, ...keys};
                    }
                });
            }
        });
        return args;
    }

    /**
     * Using Object.assign(), merges objects in the order they appear in call. Object.assign() copies and overwrites
     * existing properties in the target object, meaning property precedence is least to most (left to right).
     *
     * See details on Object.assign() for nuance.
     *
     * @param {...any[]} args - variadic set of objects to be merged
     *
     * @returns {*} - the merged object
     *
     */
    public static mergeArguments(...args: any[]): any {
        let merged = {};
        args.forEach((obj) => {
            merged = {...merged, ...obj};
        });
        return merged;
    }

    /**
     * Accepts the full set of command options and extracts their values from environment variables that are set.
     *
     * @param {(Array<ICommandOptionDefinition | ICommandPositionalDefinition>)} options - the full set of options
     * specified on the command definition. Includes both the option definitions and the positional definitions.
     *
     * @returns {ICommandArguments["args"]} - the argument style object with both camel and kebab case keys for each
     * option specified in environment variables.
     *
     */
    public static extractEnvForOptions(envPrefix: string,
        options: Array<ICommandOptionDefinition | ICommandPositionalDefinition>): ICommandArguments["args"] {
        let args: ICommandArguments["args"] = {};
        options.forEach((opt) => {
            let envValue: any = CliUtils.getEnvValForOption(envPrefix, opt.name);

            if (envValue != null) {
                // Perform the proper conversion if necessary for the type
                // ENV vars are extracted as strings
                switch (opt.type) {

                    // convert strings to booleans if the option is boolean type
                    case "boolean":
                        if (envValue.toUpperCase() === "TRUE") {
                            envValue = true;
                        } else if (envValue.toUpperCase() === "FALSE") {
                            envValue = false;
                        }
                        break;

                    // convert strings to numbers if the option is number type
                    case "number": {
                        const BASE_TEN = 10;
                        const oldEnvValue = envValue;
                        envValue = parseInt(envValue, BASE_TEN);
                        // if parsing fails, we'll re-insert the original value so that the
                        // syntax failure message is clearer
                        if (isNaN(envValue)) {
                            envValue = oldEnvValue;
                        }
                        break;
                    }
                    // convert to an array of strings if the type is array
                    case "array": {
                        envValue = this.extractArrayFromEnvValue(envValue);
                        break;
                    }
                    // Do nothing for other option types
                    default:
                        break;
                }

                const keys = CliUtils.setOptionValue(opt.name,
                    ("aliases" in opt) ? (opt as ICommandOptionDefinition).aliases : [],
                    envValue
                );
                args = {...args, ...keys};
            }
        });
        return args;
    }

    /**
     * Convert an array of strings provided as an environment variable
     *
     * @param envValue String form of the array
     * @returns String[] based on environment variable
     */
    public static extractArrayFromEnvValue(envValue: string): string[] {
        const regex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
        let arr = [];
        let match = regex.exec(envValue);
        let removed = envValue;
        while (match != null) {
            removed = removed.replace(match[0], "");
            const replace = match[0].replace("\\'", "'");
            const trimmed = replace.replace(/(^')|('$)/g, "");
            arr.push(trimmed);
            match = regex.exec(envValue);
        }
        removed = removed.trim();
        arr = arr.concat(removed.split(/[\s\n]+/g));
        return arr;
    }

    /**
     * Get the value of an environment variable associated with the specified option name.
     * The environment variable name will be formed by concatenating an environment name prefix,
     * and the cmdOption using underscore as the delimiter.
     *
     * The cmdOption name can be specified in camelCase or in kabab-style.
     * Regardless of the style, it will be converted to upper case.
     * We replace dashes in Kabab-style values with underscores. We replace each uppercase
     * character in a camelCase value with underscore and that character.
     *
     * The envPrefix will be used exactly as specified.
     *
     * Example: The values myEnv-Prefix and someOptionName would retrieve
     * the value of an environment variable named
     *      myEnv-Prefix_SOME_OPTION_NAME
     *
     * @param {string} envPrefix - The prefix for environment variables for this CLI.
     *      Our caller can use the value obtained by ImperativeConfig.instance.envVariablePrefix,
     *      which will use the envVariablePrefix from the Imperative config object,
     *      and will use the rootCommandName as a fallback value.
     *
     * @param {string} cmdOption - The name of the option in either camelCase or kabab-style.
     *
     * @returns {string | null} - The value of the environment variable which corresponds
     *      to the supplied option for the supplied command. If no such environment variable
     *      exists we return null.
     *
     * @memberof CliUtils
     */
    public static getEnvValForOption(envPrefix: string, cmdOption: string): string | null {
        // Form envPrefix and cmdOption into an environment variable
        const envDelim = "_";
        let envVarName = CliUtils.getOptionFormat(cmdOption).kebabCase;
        envVarName = envPrefix + envDelim + "OPT" + envDelim +
            envVarName.toUpperCase().replace(/-/g, envDelim);

        // Get the value of the environment variable
        if (Object.prototype.hasOwnProperty.call(process.env, envVarName)) {
            return process.env[envVarName];
        }

        // no corresponding environment variable exists
        return null;
    }

    /**
     * Constructs the yargs style positional argument string.
     * @static
     * @param {boolean} positionalRequired - Indicates that this positional is required
     * @param {string} positionalName - The name of the positional
     * @returns {string} - The yargs style positional argument string (e.g. <name>);
     * @memberof CliUtils
     */
    public static getPositionalSyntaxString(positionalRequired: boolean, positionalName: string): string {
        const leftChar = positionalRequired ? "<" : "[";
        const rightChar = positionalRequired ? ">" : "]";
        return leftChar + positionalName + rightChar;
    }

    /**
     * Format the help header - normally used in help generation etc.
     * @static
     * @param {string} header
     * @param {string} [indent=" "]
     * @param {string} color
     * @returns {string}
     * @memberof CliUtils
     */
    public static formatHelpHeader(header: string, indent: string = " ", color: string): string {
        if (header === undefined || header === null || header.trim().length === 0) {
            throw new ImperativeError({
                msg: "Null or empty header provided; could not be formatted."
            });
        }
        const numDashes = header.length + 1;
        const headerText = TextUtils.formatMessage("{{indent}}{{headerText}}\n{{indent}}{{dashes}}",
            {headerText: header.toUpperCase(), dashes: Array(numDashes).join("-"), indent});
        return TextUtils.chalk[color](headerText);
    }

    /**
     * Display a message when the command is deprecated.
     * @static
     * @param {string} handlerParms - the IHandlerParameters supplied to
     *                                a command handler's process() function.
     * @memberof CliUtils
     */
    public static showMsgWhenDeprecated(handlerParms: IHandlerParameters) {
        if (handlerParms.definition.deprecatedReplacement) {
            // form the command that is deprecated
            let oldCmd: string;
            if (handlerParms.positionals.length >= 1) {
                oldCmd = handlerParms.positionals[0];
            }
            if (handlerParms.positionals.length >= 2) {
                oldCmd = oldCmd + " " + handlerParms.positionals[1];
            }

            // display the message
            handlerParms.response.console.error("\nWarning: The command '" + oldCmd + "' is deprecated.");
            handlerParms.response.console.error("Recommended replacement: " +
                handlerParms.definition.deprecatedReplacement);
        }
    }

    /**
     * Accepts an option name, and array of option aliases, and their value
     * and returns the arguments style object.
     *
     * @param {string} optName - The command option name, usually in kebab case (or a single word)
     *
     * @param {string[]} optAliases - An array of alias names for this option
     *
     * @param {*} value - The value to assign to the argument
     *
     * @returns {ICommandArguments["args"]} - The argument style object
     *
     * @example <caption>Create Argument Object</caption>
     *
     * CliUtils.setOptionValue("my-option", ["mo", "o"], "value");
     *
     * // returns
     * {
     *    "myOption": "value",
     *    "my-option": "value",
     *    "mo": "value",
     *    "o": "value"
     * }
     *
     */
    public static setOptionValue(optName: string, optAliases: string[], value: any): ICommandArguments["args"] {
        let names: IOptionFormat = CliUtils.getOptionFormat(optName);
        const args: ICommandArguments["args"] = {};
        args[names.camelCase] = value;
        args[names.kebabCase] = value;
        for (const optAlias of optAliases) {
            if (optAlias.length === 1) {
                // for single character aliases, set the value using the alias verbatim
                args[optAlias] = value;
            } else {
                names = CliUtils.getOptionFormat(optAlias);
                args[names.camelCase] = value;
                args[names.kebabCase] = value;
            }
        }
        return args;
    }

    /**
     * Display a prompt that hides user input and reads from stdin
     * DOES NOT WORK WITH COMMANDS THAT ALSO READ STDIN
     * Useful for prompting the user for sensitive info such as passwords
     * Synchronous
     * @deprecated Use the asynchronous method `readPrompt` instead
     * @param message - The message to display to the user e.g. "Please enter password:"
     * @returns value - the value entered by the user
     */
    public static promptForInput(message: string): string {
        prompt.setDefaultOptions({mask: "", hideEchoBack: true});
        return prompt.question(message);
    }

    /**
     * Sleep for the specified number of miliseconds.
     * @param timeInMs Number of miliseconds to sleep
     *
     * @example
     *      // create a synchronous delay as follows:
     *      await CliUtils.sleep(3000);
     */
    public static async sleep(timeInMs: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, timeInMs);
        });
    }

    /**
     * Prompt the user with a question and wait for an answer,
     * but only up to the specified timeout.
     *
     * @deprecated Use `readPrompt` instead which supports more options
     * @param questionText The text with which we will prompt the user.
     *
     * @param hideText Should we hide the text. True = display stars.
     *                 False = display text. Default = false.
     *
     * @param secToWait The number of seconds that we will wait for an answer.
     *                  If not supplied, the default is 600 seconds.
     *
     * @return A string containing the user's answer, or null if we timeout.
     *
     * @example
     *      const answer = await CliUtils.promptWithTimeout("Type your answer here: ");
     *      if (answer === null) {
     *          // abort the operation that you wanted to perform
     *      } else {
     *          // use answer in some operation
     *      }
     */
    public static async promptWithTimeout(
        questionText: string,
        hideText: boolean = false,
        secToWait: number = 600,
    ): Promise<string> {

        // readline provides our interface for terminal I/O
        const readline = require("readline");
        const ttyIo = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
            prompt: questionText
        });
        const writeToOutputOrig = ttyIo._writeToOutput;

        // ask user the desired question and then asynchronously read answer
        ttyIo.prompt();
        let answerToReturn: string = null;
        ttyIo.on("line", (answer: string) => {
            answerToReturn = answer;
            ttyIo.close();
        }).on("close", () => {
            if (hideText) {
                // The user's Enter key was echoed as a '*', so now output a newline
                ttyIo._writeToOutput = writeToOutputOrig;
                ttyIo.output.write("\n");
            }
        });

        // when asked to hide text, override output to only display stars
        if (hideText) {
            ttyIo._writeToOutput = function _writeToOutput(stringToWrite: string) {
                if (stringToWrite === os.EOL) {
                    return;
                }
                if (stringToWrite.length === 1) {
                    // display a star for each one character of the hidden response
                    ttyIo.output.write("*");
                } else {
                    /* After a backspace, we get a string with the whole question
                     * and the hidden response. Redisplay the prompt and hide the response.
                     */
                    let stringToShow = stringToWrite.substring(0, questionText.length);
                    for (let count = 1; count <= stringToWrite.length - questionText.length; count ++) {
                        stringToShow += "*";
                    }
                    ttyIo.output.write(stringToShow);
                }
            };
        }

        // Ensure that we use a reasonable timeout
        const maxSecToWait = 900; // 15 minute max
        if (secToWait > maxSecToWait || secToWait <= 0) {
            secToWait = maxSecToWait;
        }

        // loop until timeout, to give our earlier asynch read a chance to work
        const oneSecOfMillis = 1000;
        for (let count = 1; answerToReturn === null && count <= secToWait; count++) {
            await CliUtils.sleep(oneSecOfMillis);
        }

        // terminate our use of the ttyIo object
        ttyIo.close();
        return answerToReturn;
    }

    /**
     * Prompt the user with a question and wait for an answer,
     * but only up to the specified timeout.
     *
     * @param message The text with which we will prompt the user.
     *
     * @param opts.hideText Should we hide the text. True = display stars.
     *        False = display text. Default = false.
     *
     * @param opts.secToWait The number of seconds that we will wait for an answer.
     *        If not supplied, the default is 10 minutes.
     *        If 0 is specified, we will never timeout.
     *        Numbers larger than 3600 (1 hour) are not allowed.
     *
     * @param opts.maskChar The character that should be used to mask hidden text.
     *        If null is specified, then no characters will be echoed back.
     *
     * @return A string containing the user's answer, or null if we timeout.
     *
     * @example
     *      const answer = await CliUtils.readPrompt("Type your answer here: ");
     *      if (answer === null) {
     *          // abort the operation that you wanted to perform
     *      } else {
     *          // use answer in some operation
     *      }
     */
    public static async readPrompt(message: string, opts?: IPromptOptions): Promise<string | null> {
        // Ensure that we use a reasonable timeout
        let secToWait = opts?.secToWait || 600;  // eslint-disable-line @typescript-eslint/no-magic-numbers
        const maxSecToWait = 3600; // 1 hour max
        if (secToWait > maxSecToWait || secToWait < 0) {
            secToWait = maxSecToWait;
        }

        return new Promise((resolve, reject) => {
            require("read")({
                input: process.stdin,
                output: process.stdout,
                terminal: true,
                prompt: message,
                silent: opts?.hideText,
                replace: opts?.maskChar,
                timeout: secToWait ? (secToWait * 1000) : null  // eslint-disable-line @typescript-eslint/no-magic-numbers
            }, (error: any, result: string) => {
                if (error == null) {
                    resolve(result);
                } else if (error.message === "canceled") {
                    process.exit(2);
                } else if (error.message === "timed out") {
                    resolve(null);
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * Accepts the yargs argument object and constructs the base imperative
     * argument object. The objects are identical to maintain compatibility with
     * existing CLIs and plugins, but the intent is to eventually phase out
     * having CLIs import anything from Yargs (types, etc).
     *
     * @param {Arguments} args - Yargs argument object
     *
     * @returns {ICommandArguments} - Imperative argument object
     *
     */
    public static buildBaseArgs(args: Arguments): ICommandArguments {
        const impArgs: ICommandArguments = {...args};
        Object.keys(impArgs).forEach((key) => {
            if (key !== "_" && key !== "$0" && impArgs[key] === undefined) {
                delete impArgs[key];
            }
        });
        return impArgs;
    }

    /**
     * Takes a key and converts it to both camelCase and kebab-case.
     *
     * @param key The key to transform
     *
     * @returns An object that contains the new format.
     *
     * @example <caption>Conversion of keys</caption>
     *
     * CliUtils.getOptionFormat("helloWorld");
     *
     * // returns
     * const return1 = {
     *     key: "helloWorld",
     *     camelCase: "helloWorld",
     *     kebabCase: "hello-world"
     * }
     *
     * /////////////////////////////////////////////////////
     *
     * CliUtils.getOptionFormat("hello-world");
     *
     * // returns
     * const return2 = {
     *     key: "hello-world",
     *     camelCase: "helloWorld",
     *     kebabCase: "hello-world"
     * }
     *
     * /////////////////////////////////////////////////////
     *
     * CliUtils.getOptionFormat("hello--------world");
     *
     * // returns
     * const return3 = {
     *     key: "hello--------world",
     *     camelCase: "helloWorld",
     *     kebabCase: "hello-world"
     * }
     *
     * /////////////////////////////////////////////////////
     *
     * CliUtils.getOptionFormat("hello-World-");
     *
     * // returns
     * const return4 = {
     *     key: "hello-World-",
     *     camelCase: "helloWorld",
     *     kebabCase: "hello-world"
     * }
     */
    public static getOptionFormat(key: string): IOptionFormat {
        return {
            camelCase: key.replace(/(-+\w?)/g, (match, p1) => {
                /*
                 * Regular expression checks for 1 or more "-" characters followed by 0 or 1 word character
                 * The last character in each match is converted to upper case and returned only if it
                 * isn't equal to "-"
                 *
                 * Examples: (input -> output)
                 *
                 * - helloWorld         -> helloWorld
                 * - hello-world        -> helloWorld
                 * - hello--------world -> helloWorld
                 * - hello-World-       -> helloWorld
                 */
                const returnChar = p1.substr(-1).toUpperCase();
                return returnChar !== "-" ? returnChar : "";
            }),
            kebabCase: key.replace(/(-*[A-Z]|-{2,}|-$)/g, (match, p1, offset, inputString) => {
                /*
                 * Regular expression matches the following:
                 *
                 * 1. Any string segment containing 0 or more "-" characters followed by any uppercase letter.
                 * 2. Any string segment containing 2 or more consecutive "-" characters
                 * 3. Any string segment where the last character is "-"
                 *
                 * Matches for 1.
                 *
                 * - "A"           -> If condition 1.2
                 * - "-B"          -> If condition 2.2
                 * - "------C"     -> If condition 2.2
                 *
                 * Matches for 2.
                 *
                 * - "--"          -> If condition 2.1.1
                 * - "-------"     -> If condition 2.1.1 or 2.1.2
                 *
                 * 2.1.1 will be entered if the match is the last sequence of the string
                 * 2.1.2 will be entered if the match is not the last sequence of the string
                 *
                 * Matches for 3.
                 * - "-<end_of_string>" -> If condition 1.1
                 *
                 * Examples: (input -> output)
                 *
                 * - helloWorld         -> hello-world
                 * - hello-world        -> hello-world
                 * - hello--------world -> hello-world
                 * - hello-World-       -> hello-world
                 */

                if (p1.length === 1) {                                          // 1
                    if (p1 === "-") {                                           // 1.1
                        // Strip trailing -
                        return "";
                    } else {                                                    // 1.2
                        // Change "letter" to "-letter"
                        return "-" + p1.toLowerCase();
                    }
                } else {                                                        // 2
                    const returnChar = p1.substr(-1); // Get the last character of the sequence

                    if (returnChar === "-") {                                   // 2.1
                        if (offset + p1.length === inputString.length) {        // 2.1.1
                            // Strip a trailing -------- sequence
                            return "";
                        } else {                                                // 2.1.2
                            // Change a sequence of -------- to a -
                            return "-";
                        }
                    } else {                                                    // 2.2
                        // Change a sequence of "-------letter" to "-letter"
                        return "-" + returnChar.toLowerCase();
                    }
                }
            }),
            key
        };
    }
}
