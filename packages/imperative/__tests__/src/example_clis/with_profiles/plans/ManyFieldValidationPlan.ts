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

import { IProfileValidationPlan, IProfileValidationTask } from "../../../../../packages/profiles";
import { IProfileValidationTaskResult } from "../../../../../packages/profiles/src/validation/doc/IProfileValidationTaskResult";
import { isNullOrUndefined } from "util";

export = class ManyFieldValidationPlan implements IProfileValidationPlan {

    public get tasks(): IProfileValidationTask[] {
        return [
            {
                description: "Tea should be earl_grey",
                name: "Tea color",
                taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                    let result: IProfileValidationTaskResult;
                    if (isNullOrUndefined(profile.tea) || profile.tea !== "earl_grey") {
                        result = {
                            outcome: "Failed",
                            resultDescription: "Tea was not earl_grey"
                        };
                    } else {
                        result = {
                            outcome: "OK",
                            resultDescription: "Tea was earl_grey"
                        };
                    }
                    done(result);
                }
            }
        ];
    }

    public get failureSuggestions(): string {
        return "Get earl grey tea";
    }
};
