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

import { IProfileValidationPlan, IProfileValidationTask } from "../../../../../../src/profiles";
import { IProfileValidationTaskResult } from "../../../../../../src/profiles/validation/doc/IProfileValidationTaskResult";

export = class ManyFieldValidationPlan implements IProfileValidationPlan {

    public get tasks(): IProfileValidationTask[] {
        return [
            {
                description: "Tea should be earl_grey",
                name: "Tea color",
                taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                    let result: IProfileValidationTaskResult;
                    if (profile.tea == null || profile.tea !== "earl_grey") {
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
