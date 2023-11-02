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

import { IProfileSchema } from "../definition/IProfileSchema";
import { IValidateProfile } from "./IValidateProfile";

/**
 * Input to the "validateProfile" internal API. Indicates the schema document to be used for the validation.
 * @export
 * @interface IValidateProfileWithSchema
 * @extends {IValidateProfile}
 */
export interface IValidateProfileWithSchema extends IValidateProfile {
    /**
     * The profile JSON schema document.
     * @type {IProfileSchema}
     * @memberof IValidateProfileWithSchema
     */
    schema: IProfileSchema;
}
