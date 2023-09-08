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

import { IImperativeError, ImperativeError } from "../../../error";
import { IHandlerResponseConsoleApi } from "../doc/response/api/handler/IHandlerResponseConsoleApi";
import { IHandlerResponseDataApi } from "../doc/response/api/handler/IHandlerResponseDataApi";
import { ICommandResponseParms } from "../doc/response/parms/ICommandResponseParms";
import { ICommandResponse } from "../doc/response/response/ICommandResponse";
import { TextUtils } from "../../../utilities";
import { COMMAND_RESPONSE_FORMAT, ICommandResponseApi } from "../doc/response/api/processor/ICommandResponseApi";
import { ITaskWithStatus, TaskProgress, TaskStage } from "../../../operations";
import { IHandlerProgressApi } from "../doc/response/api/handler/IHandlerProgressApi";
import { IProgressBarParms } from "../doc/response/parms/IProgressBarParms";
import { Constants } from "../../../constants";
import { ImperativeExpect } from "../../../expect";
import { IHandlerFormatOutputApi } from "../doc/response/api/handler/IHandlerFormatOutputApi";
import { ICommandOutputFormat, OUTPUT_FORMAT } from "../doc/response/response/ICommandOutputFormat";
import { Arguments } from "yargs";
import { ICommandDefinition } from "../../src/doc/ICommandDefinition";
import { OptionConstants } from "../constants/OptionConstants";
import { inspect } from "util";
import * as DeepMerge from "deepmerge";
import ProgressBar = require("progress");
import WriteStream = NodeJS.WriteStream;

const DataObjectParser = require("dataobject-parser");

/**
 * Command response object allocated by the command processor and used to construct the handler response object
 * passed to the command handlers. The response object contains all the methods necessary for a command handler (and
 * the processor) to formulate a command response. Controls buffering of messages and JSON response formats.
 *
 * Instances of this class are only manipulated by the command processor. See "HandlerResponse" for the handler response
 * object.
 *
 * @export
 * @class CommandResponse
 * @implements {ICommandResponseApi}
 */
export class CommandResponse implements ICommandResponseApi {
    /**
     * Imperative Error tag for error messaging
     * @private
     * @static
     * @type {string}
     * @memberof CommandResponse
     */
    private static readonly RESPONSE_ERR_TAG: string = "Command Response Error:";
    /**
     * Max column width for formulating tabular output
     * @private
     * @static
     * @memberof CommandProcessor
     */
    private static readonly MAX_COLUMN_WIDTH = 9999;
    /**
     * The full set of control parameters for the response - see the interface for details.
     * @private
     * @type {ICommandResponseParms}
     * @memberof CommandResponse
     */
    private mControl: ICommandResponseParms;
    /**
     * Enable silent mode - means absolutely NO output will be written to the console/terminal.
     * @private
     * @type {boolean}
     * @memberof CommandResponse
     */
    private mSilent: boolean = false;
    /**
     * Command handler succeeded flag - true if the command succeeded.
     * @private
     * @type {boolean}
     * @memberof CommandResponse
     */
    private mSucceeded: boolean = true;
    /**
     * Command handler exit code. Will be used when exiting the process at the end of command execution
     * @private
     * @type {number}
     * @memberof CommandResponse
     */
    private mExitCode: number = null;
    /**
     * The default highlight color for chalk
     * @private
     * @memberof CommandResponse
     */
    private mPrimaryTextColor = Constants.DEFAULT_HIGHLIGHT_COLOR;
    /**
     * The stderr buffer - collects all messages sent to stderr.
     * @private
     * @type {Buffer}
     * @memberof CommandResponse
     */
    private mStderr: Buffer = Buffer.alloc(0);
    /**
     * The stdout buffer - collects all messages sent to stdout.
     * @private
     * @type {Buffer}
     * @memberof CommandResponse
     */
    private mStdout: Buffer = Buffer.alloc(0);
    /**
     * The message placed on the response object when the JSON response is built
     * @private
     * @type {string}
     * @memberof CommandResponse
     */
    private mMessage: string = "";
    /**
     * The "data" object that is placed on the JSON response object of the command
     * @private
     * @type {*}
     * @memberof CommandResponse
     */
    private mData: any = {};
    /**
     * The error object appended to the JSON response to the command - automatically added if the handler rejects
     * the promise.
     * @private
     * @type {IImperativeError}
     * @memberof CommandResponse
     */
    private mError: IImperativeError;
    /**
     * Progress bar instance - only one can be present at any given time.
     * @private
     * @type {*}
     * @memberof CommandResponse
     */
    private mProgressBar: any;
    /**
     * API instance for the progress bar - used to create/end command progress bars.
     * @private
     * @type {IHandlerProgressApi}
     * @memberof CommandResponse
     */
    private mProgressApi: IHandlerProgressApi;
    /**
     * API instance for the data APIs - used to populate the JSON response object fields.
     * @private
     * @type {IHandlerResponseDataApi}
     * @memberof CommandResponse
     */
    private mDataApi: IHandlerResponseDataApi;
    /**
     * API instance for the console APIs - used to write messages to stdout/stderr.
     * @private
     * @type {IHandlerResponseConsoleApi}
     * @memberof CommandResponse
     */
    private mConsoleApi: IHandlerResponseConsoleApi;
    /**
     * Format APIs for automatically formatting output data
     * @private
     * @type {IHandlerFormatOutputApi}
     * @memberof CommandResponse
     */
    private mFormatApi: IHandlerFormatOutputApi;
    /**
     * The command response format - JSON, default, etc.
     * @private
     * @type {COMMAND_RESPONSE_FORMAT}
     * @memberof CommandResponse
     */
    private mResponseFormat: COMMAND_RESPONSE_FORMAT;
    /**
     * The progress bar spinner chars.
     * @private
     * @type {string}
     * @memberof CommandResponse
     */
    private mProgressBarSpinnerChars: string = "-oO0)|(0Oo-";
    /**
     * The command definition document - may be undefined/null
     * @private
     * @type {ICommandDefinition}
     * @memberof CommandResponse
     */
    private mDefinition: ICommandDefinition;
    /**
     * The arguments passed to the command - may be undefined/null
     * @private
     * @type {Arguments}
     * @memberof CommandResponse
     */
    private mArguments: Arguments;

    /**
     * Creates an instance of CommandResponse.
     * @param {ICommandResponseParms} params - See the interface for details.
     * @memberof CommandResponse
     */
    constructor(params?: ICommandResponseParms) {
        this.mControl = (params == null) ? {} : params;
        this.mArguments = this.mControl.args;
        this.mDefinition = this.mControl.definition;
        this.mPrimaryTextColor = this.mControl.primaryTextColor == null ? this.mPrimaryTextColor : this.mControl.primaryTextColor;
        ImperativeExpect.toNotBeEqual(this.mPrimaryTextColor.trim(), "",
            `${CommandResponse.RESPONSE_ERR_TAG} The primary text color supplied is blank. Must provide a valid color.`);
        const formats: string[] = ["json", "default"];
        this.mResponseFormat = (this.mControl.responseFormat == null) ? "default" : this.mControl.responseFormat;
        ImperativeExpect.toBeOneOf(this.mResponseFormat, formats,
            `${CommandResponse.RESPONSE_ERR_TAG} Response format invalid. Valid formats: "${formats.join(",")}"`);
        this.mSilent = (this.mControl.silent == null) ? false : this.mControl.silent;
        this.mProgressBarSpinnerChars = (this.mControl.progressBarSpinner == null) ? this.mProgressBarSpinnerChars : this.mControl.progressBarSpinner;
    }

    get format(): IHandlerFormatOutputApi {
        // Access to "this" from the inner class
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const outer: CommandResponse = this;

        if (this.mFormatApi == null) {
            this.mFormatApi = new class implements IHandlerFormatOutputApi {
                /**
                 * Format output data from the command based on the defaults specified OR the parameters specified by
                 * the user.
                 * @param {ICommandOutputFormat} format
                 */
                public output(format: ICommandOutputFormat): void {

                    // The input parameters must not be null and we will make a copy to not alter the original
                    ImperativeExpect.toNotBeNullOrUndefined(format, "No format parameters were supplied");
                    ImperativeExpect.toNotBeNullOrUndefined(format.output, "No output data to format was supplied");
                    ImperativeExpect.toBeOneOf(format.format, OptionConstants.RESPONSE_FORMAT_TYPES,
                        `Output format must be one of the following: ${OptionConstants.RESPONSE_FORMAT_TYPES.toString()}`);

                    // If the output is an array and the length is 0 or - do nothing
                    if ((Array.isArray(format.output) && format.output.length === 0) ||
                        (Object.keys(format.output).length === 0 && format.output.constructor === Object)) {
                        return;
                    }

                    // Create a copy of the params to manipulate
                    let formatCopy;
                    try {
                        formatCopy = JSON.parse(JSON.stringify(format));
                    } catch (copyErr) {
                        outer.console.errorHeader(`Non-formatted output data`);
                        outer.console.error(`${inspect(format.output, {depth: null, compact: true} as any)}`);
                        throw new ImperativeError({
                            msg: `Error copying input parameters. Details: ${copyErr.message}`,
                            additionalDetails: copyErr
                        });
                    }

                    // Depending on the command definition and arguments, override the format options
                    if (outer.mDefinition != null && outer.mDefinition.outputFormatOptions != null) {
                        formatCopy.format = (outer.mArguments != null && outer.mArguments.responseFormatType != null) ?
                            outer.mArguments.responseFormatType : formatCopy.format;
                        formatCopy.fields = (outer.mArguments != null && outer.mArguments.responseFormatFilter != null) ?
                            outer.mArguments.responseFormatFilter : formatCopy.fields;
                        formatCopy.header = (outer.mArguments != null && outer.mArguments.responseFormatHeader != null) ?
                            outer.mArguments.responseFormatHeader : formatCopy.header;
                    }

                    // Format the output for the command, if an error occurs, output the format error data
                    // so that the response is still available to the user
                    try {
                        this.formatOutput(formatCopy, outer);
                    } catch (formatErr) {
                        outer.console.errorHeader(`Non-formatted output data`);
                        outer.console.error(`${inspect(format.output, {compact: true} as any)}`);
                        throw formatErr;
                    }
                }

                /**
                 * Formats and prints the data/output passed. The handler dictates (via the ICommandOutputFormat params)
                 * the default output format. However, if the user has specified any of the response-format options,
                 * those take precedence over the defaults.
                 * @private
                 * @param {ICommandOutputFormat} params - the command format output parameters (see interface for details)
                 * @param {CommandResponse} response - the command response object
                 * @param {Arguments} args - the arguments passed on the command line by the user
                 * @memberof CommandProcessor
                 */
                private formatOutput(params: ICommandOutputFormat, response: CommandResponse) {

                    // If a single filter is specified, save the field the data was extracted from
                    const extractedFrom = (params.fields != null && params.fields.length === 1 && typeof params.output !== "string") ?
                        params.fields[0] : undefined;

                    // If filter fields are present, filter the object
                    params.output = this.filterProperties(params);

                    // Process each type according to the data presented from the handler
                    switch (params.format) {

                        // Output the data as a string
                        case "string":
                        // Stringify if not a string
                            if (typeof params.output !== "string") {
                                params.output = JSON.stringify(params.output);
                            }

                            // Log the string data
                            response.console.log(params.output);
                            break;
                        // Output the data as a list of strings
                        case "list":
                            if (Array.isArray(params.output)) {

                                // Filter the properties by request and stringify if needed
                                const list: string[] = [];
                                params.output.forEach((entry) => {
                                    if (typeof entry === "object") {
                                        list.push(JSON.stringify(entry));
                                    } else {
                                        list.push(entry);
                                    }
                                });

                                // Join each array entry on a newline
                                params.output = list.join("\n");
                                response.console.log(params.output);
                            } else {
                                throw new ImperativeError({
                                    msg: this.errorDetails(params, "Arrays", extractedFrom)
                                });
                            }
                            break;

                        // Output the data as an object or list of objects (prettified)
                        case "object":
                            if (Array.isArray(params.output) || typeof params.output === "object") {

                                // Build the table and catch any errors that may occur from the packages
                                let pretty;
                                try {
                                // Prettify the data
                                    pretty = TextUtils.prettyJson(params.output, undefined, undefined, "");
                                } catch (prettyErr) {
                                    throw new ImperativeError({
                                        msg: `Error formulating pretty JSON for command response. Details: ` +
                                            `${prettyErr.message}`,
                                        additionalDetails: prettyErr
                                    });
                                }

                                // Print the output
                                response.console.log(pretty);
                            } else {
                                throw new ImperativeError({
                                    msg: this.errorDetails(params, "JSON objects or Arrays", extractedFrom)
                                });
                            }
                            break;

                        // Output the data as a table
                        case "table":
                            if (typeof params.output === "object" || Array.isArray(params.output)) {

                                // Build the table and catch any errors that may occur from the packages
                                let table;
                                try {
                                // Adjust if required
                                    if (!Array.isArray(params.output)) {
                                        params.output = [params.output];
                                    }

                                    // Build the table
                                    table = TextUtils.getTable(params.output, "yellow", CommandResponse.MAX_COLUMN_WIDTH,
                                        (params.header != null) ? params.header : false);
                                } catch (tableErr) {
                                    throw new ImperativeError({
                                        msg: `Error formulating table for command response. ` +
                                            `Details: ${tableErr.message}`,
                                        additionalDetails: tableErr
                                    });
                                }

                                // Print the table
                                response.console.log(table);
                            } else {
                                throw new ImperativeError({
                                    msg: this.errorDetails(params, "JSON objects or Arrays", extractedFrom)
                                });
                            }
                            break;
                        default:
                            throw new ImperativeError({
                                msg: `Invalid output format of "${params.format}" supplied. ` +
                                    `Contact the command handler creators for support.`
                            });
                    }
                }

                /**
                 * Formulate an error with details for the user to help diagnose the problem.
                 * @private
                 * @param {ICommandOutputFormat} params - the format parameters
                 * @param {string} appliedTo - where this format type can be applied to
                 * @param {string} extractedFrom - if the data was extracted from a field, specify the field here, so
                 * that it makes sense to the user.
                 * @returns {string} - the error string
                 */
                private errorDetails(params: ICommandOutputFormat, appliedTo: string, extractedFrom?: string): string {
                    return `The format type of "${params.format}" can only be applied to ${appliedTo}.\n` +
                        `The data being formatted is of type ` +
                        `"${(Array.isArray(params.output)) ? "array" : typeof params.output}".` +
                        `${(extractedFrom != null) ? `\nNote that the data being formatted was extracted from property "${extractedFrom}" ` +
                            `because that field was specified as the single filter.` : ""}`;
                }

                /**
                 * Filter fields from top level of the object. Iterates over each property and deletes if not present in the
                 * "keep" array.
                 * @private
                 * @param {*} obj - the object to remove the properties
                 * @param {string[]} keep - an array of properties to keep on the object
                 * @memberof CommandProcessor
                 */
                private filterProperties(params: ICommandOutputFormat): any {
                    // Retain the original object/data if there is nothing to do
                    let filtered: any = params.output;

                    // If there are no filter fields, return the original object/data
                    if (params.fields != null && params.fields.length > 0) {

                        // Extract the single filter if required
                        let singleFilter: any;
                        if (params.fields.length === 1 && typeof params.output === "object") {
                            singleFilter = params.fields[0];
                        }

                        // Perform the filtering depending on if a single filter was specified
                        if (singleFilter != null && !Array.isArray(params.output)) {

                            // Extract only the single field - this allows a single object property
                            // to be selected and output without "meta" info (like the prop name)
                            const dataObjectParser = new DataObjectParser(params.output);
                            filtered = dataObjectParser.get(singleFilter);

                        } else if (singleFilter != null && Array.isArray(params.output) && (params.format === "list" || params.format === "string")) {

                            // Extract each of the single fields and output as a list of strings
                            const strings: string[] = [];
                            params.output.forEach((entry) => {
                                const dataObjectParser = new DataObjectParser(entry);
                                strings.push(dataObjectParser.get(singleFilter));
                            });
                            filtered = strings;

                        } else if (Array.isArray(params.output)) {

                            // Extract all the fields from each entry in the array
                            filtered = [];
                            params.output.forEach((entry) => {
                                filtered.push(this.extractProperties(entry, params.fields, params.format));
                            });
                        } else if (typeof params.output === "object") {

                            // Extract each field from the object
                            filtered = this.extractProperties(params.output, params.fields, params.format);
                        }
                    }

                    // Return the original or filtered object/data
                    return filtered;
                }

                /**
                 * Extract the properties from the objects that the user specified
                 * @private
                 * @param {*} dataObj - The data object to extract the properties from
                 * @param {string[]} keepProps - the properties to extract
                 * @param {OUTPUT_FORMAT} format - the output format
                 * @returns {*} - the "filtered" object
                 */
                private extractProperties(dataObj: any, keepProps: string[], format: OUTPUT_FORMAT): any {
                    let extracted: any = dataObj;
                    if (keepProps != null && keepProps.length > 0 && typeof dataObj === "object") {
                        extracted = {};
                        const objParser = new DataObjectParser(dataObj);
                        const extractedParser = new DataObjectParser(extracted);
                        for (const extractProp of keepProps) {

                            // If the response format is table, then extract the data
                            // and create a property with hyphenated names to allow
                            // for the user to create a proper table fro nested extractions
                            const propValue = objParser.get(extractProp);
                            if (format === "table") {

                                // Use the dots for the table
                                extracted[extractProp] = propValue;
                            } else {

                                // Keep the object structure
                                extractedParser.set(extractProp, propValue);
                            }

                        }
                    }
                    return extracted;
                }
            }();
        }

        return this.mFormatApi;
    }

    /**
     * Accessor for the console API - Handlers will use this API to write console messages.
     * @readonly
     * @type {IHandlerResponseConsoleApi}
     * @memberof CommandResponse
     */
    get console(): IHandlerResponseConsoleApi {
        // Access to "this" from the inner class
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const outer: CommandResponse = this;

        // Create only a single instance of the console API
        if (this.mConsoleApi == null) {
            this.mConsoleApi = new class implements IHandlerResponseConsoleApi {

                /**
                 * Write a message/data to stdout. Appends a newline character if the input is of type string. If the
                 * command response indicates JSON format, then the message is automatically buffered.
                 * @param {(string | Buffer)} message - The message/data to write to stdout (can be a format string).
                 * @param {...any[]} values - The format values. Ignored if a buffer is passed
                 * @returns {string} - The formatted data or the original data.toString() if a buffer was passed
                 */
                public log(message: string | Buffer, ...values: any[]): string {
                    if (!Buffer.isBuffer(message)) {
                        let msg: string = outer.formatMessage(message.toString(), ...values);
                        msg += "\n";
                        outer.writeAndBufferStdout(msg);
                        return msg;
                    } else {
                        outer.writeAndBufferStdout(message);
                        return message.toString();
                    }
                }

                /**
                 * Write a message to stderr. Appends a newline character if the input is of type string.  If the
                 * command response indicates JSON format, then the message is automatically buffered.
                 * @param {(string | Buffer)} message - The message/data to write to stderr (can be a format string).
                 * @param {...any[]} values - The format values.
                 * @returns {string} - The formatted data, or the original data.toString() if a buffer was passed
                 */
                public error(message: string | Buffer, ...values: any[]): string {
                    if (!Buffer.isBuffer(message)) {
                        let msg: string = outer.formatMessage(message.toString(), ...values);
                        msg += "\n";
                        outer.writeAndBufferStderr(msg);
                        return msg;
                    } else {
                        outer.writeAndBufferStderr(message);
                        return message.toString();
                    }

                }

                /**
                 * Writes a red message header to stderr (followed by a newline). Used to highlight error conditions
                 * and messages for the user.
                 * @param {string} message - The message to use as the header.
                 * @param {string} [delimeter] - The a delimeter to prints.
                 * @returns {string} - The string that is printed (including the color codes)
                 */
                public errorHeader(message: string, delimeter = ":"): string {
                    const msg = TextUtils.chalk.red(message + `${delimeter}\n`);
                    outer.writeAndBufferStderr(msg);
                    return msg;
                }
            }();
        }

        // Return the instance of the console API
        return this.mConsoleApi;
    }

    /**
     * Accessor for the data api class - Handlers will use this to construct/influence the response JSON object (data
     * is only displayed to the user if JSON mode is requested).
     * @readonly
     * @type {IHandlerResponseDataApi}
     * @memberof CommandResponse
     */
    get data(): IHandlerResponseDataApi {
        // Access to "this" from the inner class.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const outer: CommandResponse = this;

        // Only create a single instance
        if (this.mDataApi == null) {
            this.mDataApi = new class {

                /**
                 * Sets the response object "data" field to be the object passed. The data field indicates any structured
                 * JSON/object data that the command wants to return for programmatic consumption.
                 * @param {*} obj - The object to set
                 * @param {boolean} merge - If true will merge with the existing object. If false, the object is
                 * completely overwritten.
                 */
                public setObj(data: any, merge = false) {
                    outer.mData = (merge) ? DeepMerge(outer.mData, data) : data;
                }

                /**
                 * Sets the Message field in the response. The message field indicates a short summary of the command
                 * to the programmatic caller (JSON response format) of the command.
                 * @param {string} message - The message (can be a format string).
                 * @param {...any[]} values - The format string values.
                 * @returns {string} - The formatted string.
                 */
                public setMessage(message: string, ...values: any[]): string {
                    const formatted: string = outer.formatMessage(message, values);
                    outer.mMessage = formatted;
                    return outer.mMessage;
                }

                /**
                 * Sets the response object "data" field to be the object passed. The data field indicates any structured
                 * JSON/object data that the command wants to return for programmatic consumption.
                 * @param {*} obj - The object to set
                 * @param {boolean} merge - If true will merge with the existing object. If false, the object is
                 * completely overwritten.
                 */
                public setExitCode(code: number) {
                    outer.mExitCode = code;
                    return outer.mExitCode;
                }
            }();
        }

        // Return the data API
        return this.mDataApi;
    }

    /**
     * Accessor for the progress bar API - Handlers will use this API to create/destroy command progress bars.
     * @readonly
     * @type {IHandlerProgressApi}
     * @memberof CommandResponse
     */
    get progress(): IHandlerProgressApi {
        // Remember "this" for the inner classes usage and ensure that progress bar has not been started.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const outer: CommandResponse = this;

        // Ensure there is only a single instance created of the progress API class
        if (this.mProgressApi == null) {

            // Create an instance of the class
            this.mProgressApi = new class {
                private mProgressBarSpinnerIndex = 0;
                private mProgressTask: ITaskWithStatus;
                private mProgressBarPollFrequency = 65;  // eslint-disable-line @typescript-eslint/no-magic-numbers
                private mProgressBarTemplate: string = " " + TextUtils.chalk[outer.mPrimaryTextColor](":bar|") + " :current%  " +
                    TextUtils.chalk[outer.mPrimaryTextColor](":spin") + " | :statusMessage";
                private mProgressBarInterval: any;
                private mProgressBarStdoutStartIndex: number;
                private mProgressBarStderrStartIndex: number;
                /**
                 * TODO: get from config - default value is below
                 */
                private mProgressBarSpinnerChars: string = "-oO0)|(0Oo-";

                /**
                 * Start a progress bar (assuming silent mode is not enabled).
                 * @param {IProgressBarParms} params - Progress bar control - See interface for details.
                 */
                public startBar(params: IProgressBarParms): void {
                    if (outer.mProgressBar != null) {
                        throw new ImperativeError({
                            msg: `${CommandResponse.RESPONSE_ERR_TAG} A progress bar has already been started. ` +
                                `Please call progress.endBar() before starting a new one.`
                        });
                    }
                    if (!outer.silent && outer.mResponseFormat !== "json") {

                        // Persist the task specifications and determine the stream to use for the progress bar
                        this.mProgressBarStdoutStartIndex = outer.mStdout.length;
                        this.mProgressBarStderrStartIndex = outer.mStderr.length;
                        this.mProgressTask = params.task;
                        const stream: WriteStream = (params.stream == null) ?
                            process.stderr : params.stream;

                        // Create the progress bar instance
                        outer.mProgressBar = new ProgressBar(this.mProgressBarTemplate, {
                            total: 100,
                            width: 10,
                            stream,
                            complete: "█",
                            clear: true,
                            incomplete: "_",
                        });

                        // Set the interval based on the params of the default
                        this.mProgressBarInterval = setInterval(this.updateProgressBar.bind(this),
                            (params.updateInterval == null) ? this.mProgressBarPollFrequency : params.updateInterval);
                    }
                }

                /**
                 * Destroy the outstanding progress bar
                 */
                public endBar(): void {
                    if (outer.mProgressBar != null) {
                        if (this.mProgressBarInterval != null) {
                            clearInterval(this.mProgressBarInterval);
                            this.mProgressBarInterval = undefined;
                        }
                        outer.mProgressBar.update(1, {
                            statusMessage: "Complete",
                            spin: " "
                        });
                        outer.mProgressBar.terminate();
                        process.stdout.write(outer.mStdout.subarray(this.mProgressBarStdoutStartIndex));
                        process.stderr.write(outer.mStderr.subarray(this.mProgressBarStderrStartIndex));
                        this.mProgressTask = undefined;

                        // clear the progress bar field
                        outer.mProgressBar = undefined;
                    }
                }

                /**
                 * Update the progress bar to the next step, if the stage indicates failed or complete, the
                 * progress bar is automatically ended.
                 * @private
                 */
                private updateProgressBar(): void {
                    if (this.mProgressTask == null ||
                        this.mProgressTask.stageName === TaskStage.COMPLETE ||
                        this.mProgressTask.stageName === TaskStage.FAILED) {
                        this.endBar();
                    } else {
                        if (this.mProgressBarInterval != null) {
                            const percentRatio = this.mProgressTask.percentComplete / TaskProgress.ONE_HUNDRED_PERCENT;
                            this.mProgressBarSpinnerIndex = (this.mProgressBarSpinnerIndex + 1) % this.mProgressBarSpinnerChars.length;
                            outer.mProgressBar.update(percentRatio, {
                                statusMessage: this.mProgressTask.statusMessage,
                                spin: this.mProgressBarSpinnerChars[this.mProgressBarSpinnerIndex]
                            });
                        }
                    }
                }
            }();
        }

        // Return the progress bar API
        return this.mProgressApi;
    }

    /**
     * Accessor for the silent flag - silent indicates that the command produces absolutely no output to the console.
     * @readonly
     * @type {boolean}
     * @memberof CommandResponse
     */
    public get silent(): boolean {
        return this.mSilent;
    }

    /**
     * Setter for the succeeded flag (sets to false to indicate command failure).
     * @memberof CommandResponse
     */
    public failed(): void {
        this.mSucceeded = false;
    }

    /**
     * Setter for the succeeded flag (sets to true to indicate command success).
     * @memberof CommandResponse
     */
    public succeeded(): void {
        this.mSucceeded = true;
    }

    /**
     * Buffer the message (string or buffer) to the stdout buffer. Used to accumulate messages for different reasons
     * (JSON mode is enabled, etc.).
     * @param {(Buffer | string)} data - The data/messages to buffer.
     * @memberof CommandResponse
     */
    public bufferStdout(data: Buffer | string) {
        this.mStdout = Buffer.concat([this.mStdout, ((data instanceof Buffer) ? data : Buffer.from(data))]);
    }

    /**
     * Buffer the message (string or buffer) to the stderr buffer. Used to accumulate messages for different reasons
     * (JSON mode is enabled, etc.).
     * @param {(Buffer | string)} data - The data/messages to buffer.
     * @memberof CommandResponse
     */
    public bufferStderr(data: Buffer | string) {
        this.mStderr = Buffer.concat([this.mStderr, ((data instanceof Buffer) ? data : Buffer.from(data))]);
    }

    /**
     * Setter for the error object in the response - automatically populated by the Command Processor if the handler
     * rejects the handler promise.
     * @param {IImperativeError} error - The error object to place in the response.
     * @memberof CommandResponse
     */
    public setError(error: IImperativeError): void {
        this.mError = error;
    }

    /**
     * Returns the JSON response for the command.
     * @returns {ICommandResponse} - The command JSON response - See the interface for details.
     * @memberof CommandResponse
     */
    public buildJsonResponse(): ICommandResponse {

        let exitCode = this.mExitCode;
        if (exitCode == null) {
            exitCode = this.mSucceeded ? 0 : Constants.ERROR_EXIT_CODE;
        }

        return {
            success: this.mSucceeded,
            exitCode,
            message: this.mMessage,
            stdout: this.mStdout,
            stderr: this.mStderr,
            data: this.mData,
            error: this.mError
        };
    }

    /**
     * Writes the JSON response to the console - Done normally by the command processor dependending on the response
     * format specified in the object.
     * @returns {ICommandResponse} - Returns the constructed response that is written to the console.
     * @memberof CommandResponse
     */
    public writeJsonResponse(): ICommandResponse {
        let response: ICommandResponse;
        try {
            response = this.buildJsonResponse();
            (response.stderr as any) = response.stderr.toString();
            (response.stdout as any) = response.stdout.toString();
            if (!this.mSilent) {
                this.writeStdout(JSON.stringify(response, null, 2));
            }
        } catch (e) {
            throw new ImperativeError({
                msg: `${CommandResponse.RESPONSE_ERR_TAG} An error occurred stringifying the JSON response object. ` +
                    `Error Details: ${e.message}`,
                additionalDetails: e
            });
        }
        return response;
    }

    /**
     * Accessor for the response format - see the type for available options - controls how the response will be
     * presented to the user (JSON format, default, etc.)
     * @readonly
     * @type {COMMAND_RESPONSE_FORMAT}
     * @memberof CommandResponse
     */
    public get responseFormat(): COMMAND_RESPONSE_FORMAT {
        return this.mResponseFormat;
    }

    /**
     * Complete any outstanding progress bars.
     * @memberof CommandResponse
     */
    public endProgressBar(): void {
        if (this.mProgressApi != null) {
            this.mProgressApi.endBar();
        }
    }

    /**
     * Internal accessor for the full control parameters passed to the command response object.
     * @readonly
     * @private
     * @type {ICommandResponseParms}
     * @memberof CommandResponse
     */
    private get control(): ICommandResponseParms {
        return this.mControl;
    }

    /**
     * Uses text utils to format the message (format strings).
     * @private
     * @param {string} msg - The format message
     * @param {...any[]} values - The substitution values for the format string
     * @returns {string} - Returns the formatted message
     * @memberof CommandResponse
     */
    private formatMessage(msg: string, ...values: any[]): string {
        return TextUtils.formatMessage(msg, ...values);
    }

    /**
     * Buffers to stdout and optionally prints the msg to the console.
     * @private
     * @param {(Buffer | string)} data - The data to write/buffer
     * @memberof CommandResponse
     */
    private writeAndBufferStdout(data: Buffer | string) {
        this.bufferStdout(data);
        if (this.write()) {
            this.writeStdout(data);
        }
    }

    /**
     * Writes the data to stdout
     * @private
     * @param {*} data - the data to write
     * @memberof CommandResponse
     */
    private writeStdout(data: any) {
        process.stdout.write(data);
    }

    /**
     * Buffers to stderr and optionally prints the msg to the console.
     * @private
     * @param {(Buffer | string)} data - The data to write/buffer
     * @memberof CommandResponse
     */
    private writeAndBufferStderr(data: Buffer | string) {
        this.bufferStderr(data);
        if (this.write()) {
            this.writeStderr(data);
        }
    }

    /**
     * Writes the data to stderr
     * @private
     * @param {*} data - the data to write to stderr
     * @memberof CommandResponse
     */
    private writeStderr(data: any) {
        process.stderr.write(data);
    }

    /**
     * Indicates if output should be written immediately to the console/terminal. If silent mode is true or response
     * format indicates JSON, then write() will return false.
     * @private
     * @returns {boolean} - True if the output should be written to the console/terminal.
     * @memberof CommandResponse
     */
    private write(): boolean {
        return !this.control.silent && this.mResponseFormat !== "json" && this.mProgressBar == null;
    }
}
