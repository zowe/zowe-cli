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

const os = require("os");
import { IImperativeError } from "./doc/IImperativeError";
import { IImperativeErrorParms } from "./doc/IImperativeErrorParms";

/**
 * This private interface is used to hold the string or object value of
 * various ImperativeError properties. Used by function recordPropForOutput().
 */
interface IErrOutputData {
    stringVal: string;
    rawVal: any;
}

/**
 *
 * @export
 * @class ImperativeError
 * @extends {Error}
 */
export class ImperativeError extends Error {
    private static readonly RAW_ERR_MSG = "Raw error data from operation:\n";

    /**
     * The message generated/specified for the error - used for display/message/diagnostic purposes
     * @private
     * @type {string}
     * @memberof ImperativeError
     */
    private mMessage: string;

    /**
     * Construct the Imperative error object. Contains the defaults of the error and optionally captures diagnostics
     * and other information.
     * @param {IImperativeError} details - the error details and text (stack, messages, etc.)
     * @param {IImperativeErrorParms} parms - control parameters to indicate logging of node-report and more
     */
    constructor(public mDetails: IImperativeError, parms?: IImperativeErrorParms) {
        super();
        this.mMessage = mDetails.msg;

        /**
         * If parms are present, handle them, otherwise perform the default diagnostic collection
         */
        if (parms) {
            /**
             * Append a tag if present
             */
            if (parms.tag) {
                this.mMessage = parms.tag + ": " + this.mMessage;
            }
        }
    }

    /**
     * Within the Zowe client SDK, errors are often thrown, caught, modified, and re-thrown.
     * Sometimes the error that we catch is a standard JavaScript Error. Other times the
     * error is already an ImperativeError (which can contain more details). A hard-coded
     * reliance on ImperativeError properties like causeErrors and additionalDetails will not
     * work if the existingErr is a standard JavaScript Error. Also, the properties of an
     * ImperativeError can be nested under various properties within its causeErrors property.
     *
     * The purpose of this utility function is to interrogate the existing error to form the
     * most meaningful ImperativeError possible.
     *
     * @param {string} existingErr
     *      An existing error to be incorporated into the resulting ImperativeError.
     *
     * @param {string} mainMsg
     *      The main message text for the resulting ImperativeError. If not supplied,
     *      the existingErr.message value will be used.
     *
     * @returns A newly created ImperativeError
     * @memberof ImperativeError
     */
    public static newImpErrorFromExistingError(existingErr: any, mainMsg: string = "") : ImperativeError {
        if (!existingErr) {
            return new ImperativeError({
                msg: "The supplied parameter 'existingErr' was incorrectly null or undefined",
                causeErrors: "Stupid programming error",
                additionalDetails: "Fix your program"
            });
        }

        // set a mainMsg if one is not supplied as a parm
        let existingErrMsgUsed = false;
        if (!mainMsg) {
            if (existingErr.mMessage) {
                mainMsg = existingErr.mMessage;
                existingErrMsgUsed = true;
            }
            else if (existingErr.message) {
                mainMsg = existingErr.message;
                existingErrMsgUsed = true;
            } else {
                mainMsg = "No problem text was supplied.";
            }
        }

        // use the existingErr's message text as the cause (unless we already used that message)
        let causeToUse = "";
        if (existingErr.mMessage && !existingErrMsgUsed) {
            causeToUse = existingErr.mMessage;
        }
        else if (existingErr.message && !existingErrMsgUsed) {
            causeToUse = existingErr.message;
        }
        else if (existingErr.causeErrors?.mMessage) {
            causeToUse = existingErr.causeErrors.mMessage;
        }
        else if (existingErr.cause?.message) {
            causeToUse = existingErr.cause.message;
        }

        const detailsOutput: IErrOutputData = {
            stringVal: "",
            rawVal: {}
        };

        // Record existingErr's causeErrors property as a string or as raw data.
        // Sometimes causeErrors are nested. Try the nested one first.
        if (!ImperativeError.recordPropForOutput(existingErr.mDetails?.causeErrors?.mDetails?.causeErrors, detailsOutput)) {
            ImperativeError.recordPropForOutput(existingErr.mDetails?.causeErrors, detailsOutput);
        }

        // Append existingErr's additionalDetails-like property if it is a string, or record it as an object
        if (!ImperativeError.recordPropForOutput(existingErr.additionalDetails, detailsOutput)) {
            if (!ImperativeError.recordPropForOutput(existingErr.causeErrors?.additionalDetails, detailsOutput)) {
                if (!ImperativeError.recordPropForOutput(existingErr.cause, detailsOutput)) {
                    if (!(existingErr instanceof ImperativeError)) {
                        // only record the entire existingErr for other people's errors
                        ImperativeError.recordPropForOutput(existingErr, detailsOutput);
                    }
                }
            }
        }

        // if we could not discover a text message, dump the recorded raw data
        if (detailsOutput.stringVal.length === 0) {
            if (Object.keys(detailsOutput.rawVal).length > 0) {
                detailsOutput.stringVal = ImperativeError.RAW_ERR_MSG + JSON.stringify(detailsOutput.rawVal, null, 2);
            }
        }
        if (detailsOutput.stringVal.length === 0) {
            detailsOutput.stringVal = "No further details are available.";
        }

        const impErrProps: IImperativeError = {
            msg: mainMsg,
            additionalDetails: detailsOutput.stringVal
        };
        if (causeToUse.length > 0) {
            impErrProps.causeErrors = causeToUse;
        }
        return new ImperativeError(impErrProps);
    }

    /**
     * This function interrogates the supplied propertyVal. If it is a string, it it appended
     * to outputData.stringVal. If propertyVal is not a string and it is not null-or-undefined,
     * and outputData.rawVal is currently empty, propertyVal is placed into outputData.rawVal.
     *
     * @param {IErrOutputData} outputData [output]
     *      One (or neither) of outputData.stringVal or outputData.rawVal properties are
     *      populated by this function. Before the first call to recordPropForOutput,
     *      stringVal should be an empty string and rawVal should be an empty object.
     *
     * @returns True if a property was recorded. False otherwise.
     * @memberof ImperativeError
     */
    private static recordPropForOutput(propertyVal: any, outputData: IErrOutputData): boolean {
        if (!propertyVal) {
            return false;
        }

        if (typeof propertyVal === "string") {
            if (propertyVal.startsWith(ImperativeError.RAW_ERR_MSG)) {
                // do not append to our stringVal if propertyVal is already stringified raw data
                return false;
            }
            // append to the string output
            if (outputData.stringVal.length > 0 && propertyVal.length > 0) {
                outputData.stringVal += os.EOL;
            }
            outputData.stringVal += propertyVal;
            return true;
        } else {
            // only record one raw property
            if (Object.keys(outputData.rawVal).length === 0) {
                outputData.rawVal = JSON.stringify(propertyVal);
                return true;
            }
        }
        return false;
    }

    /**
     * Return causeErrors
     * @readonly
     * @type {any[]}
     * @memberof ImperativeError
     */
    public get causeErrors(): any {
        return this.mDetails.causeErrors;
    }

    /**
     * Return additionalDetails
     * @readonly
     * @type {string}
     * @memberof ImperativeError
     */
    public get additionalDetails(): string {
        return this.mDetails.additionalDetails;
    }

    /**
     * Return IImperativeError object
     * @readonly
     * @type {IImperativeError}
     * @memberof ImperativeError
     */
    public get details(): IImperativeError {
        return this.mDetails;
    }

    /**
     * Return errorCode
     * @readonly
     * @type {string}
     * @memberof ImperativeError
     */
    public get errorCode(): string {
        return this.mDetails.errorCode;
    }

    /**
     * Return whether or not the error dump should be suppressed
     * @readonly
     * @type {string}
     * @memberof ImperativeError
     */
    public get suppressDump(): boolean {
        return this.mDetails.suppressDump;
    }

    /**
     * Return stack info
     * @readonly
     * @type {string}
     * @memberof ImperativeError
     */
    public get stack(): string {
        return this.mDetails.stack;
    }

    /**
     * Accessor for the error message.
     * @readonly
     * @return {string}: The error message
     * @memberof ImperativeError
     */
    public get message(): string {
        return this.mMessage;
    }

}
