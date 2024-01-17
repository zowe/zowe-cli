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

/**
 * Describes the operand in error and provides the full definition for the option/operand - normally exposed when the
 * JSON response format is requested.
 * @export
 * @interface ICommandValidatorError
 */
export interface ICommandValidatorError {
    /**
     * The validation error message.
     * @type {string}
     * @memberof ICommandValidatorError
     */
    message: string;
    /**
     * The option that failed validation.
     * @type {string}
     * @memberof ICommandValidatorError
     */
    optionInError?: string;
    /**
     * The option definition that failed.
     * @type {*}
     * @memberof ICommandValidatorError
     */
    definition?: any;
}
