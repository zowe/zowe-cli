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

import { IValidateProfileWithSchema } from "./IValidateProfileWithSchema";

/**
 * Input to the "validateProfile" internal API. Indicates the schema document to be used for the validation.
 * Used with the CLI Profile manager - validation is skipped until the profile is fully built
 * @export
 * @interface IValidateProfileWithSchema
 * @extends {IValidateProfile}
 */
export interface IValidateProfileForCLI extends IValidateProfileWithSchema {
    /**
     * If false/undefined, validation will be skipped until validation
     * is called again with "true" (indicating that the profile building is complete)
     */
    readyForValidation: boolean;
}
