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

import { IProfileValidationTask } from "./IProfileValidationTask";

/**
 * An overall plan for validating a profile, composed of multiple tasks
 */
export interface IProfileValidationPlan {
    /**
     * The tasks to run to validate the profile.
     * They will be run sequentially in the order specified.
     */
    tasks: IProfileValidationTask[];

    /**
     * Suggestions to the user that will be displayed in the validation
     * report in the event profile validation is not successful.
     */
    failureSuggestions?: string;
}
