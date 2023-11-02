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

import { IProfileValidationTaskResult } from "./IProfileValidationTaskResult";
import { VALIDATION_OUTCOME } from "./IProfileValidationTask";
import { IProfile } from "../../doc/definition/IProfile";

/**
 * Complete report of the results of profile validation
 */
export interface IProfileValidationReport {
    /**
     * Is the profile valid overall?
     */
    overallResult: VALIDATION_OUTCOME;
    /**
     * A final message explaining the general result of the report
     */
    overallMessage: string;
    /**
     * List of detailed task results from running the profile validation
     */
    taskResults: IProfileValidationTaskResult[];
    /**
     * The profile that was validated
     */
    profile: IProfile;
}
