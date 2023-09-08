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

import { IImperativeError } from "./doc/IImperativeError";
import { IImperativeErrorParms } from "./doc/IImperativeErrorParms";
import chalk from "chalk";

/**
 *
 * @export
 * @class ImperativeError
 * @extends {Error}
 */
export class ImperativeError extends Error {
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
            // @DEPRECATED - Log a nice message instead of breaking plugins that might be doing stuff
            // @TODO - REMOVE THIS BEFORE THE NEXT RELEASE
            if (Object.prototype.hasOwnProperty.call(parms, "suppressReport")) {
                // eslint-disable-next-line no-console
                console.warn(chalk.yellow.bold( // I can't import console because of circular dependencies
                    "[DEPRECATED] suppressReport property of ImperativeError has been deprecated. " +
                    "It will be removed in a future release."
                ));
            }

            /**
             * Append a tag if present
             */
            if (parms.tag) {
                this.mMessage = parms.tag + ": " + this.mMessage;
            }
        }
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
