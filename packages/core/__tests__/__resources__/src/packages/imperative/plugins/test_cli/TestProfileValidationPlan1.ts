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

import {
    IProfileValidationPlan,
    IProfileValidationTask,
    IProfileValidationTaskResult,
    VALIDATION_OUTCOME
} from "@zowe/core-for-zowe-sdk";

// you can implement the validation plan as a Typescript class
// or any other way that allows us to  do: new (require("your profile validation plan module file name"))
class TestProfileValidationPlan1 implements IProfileValidationPlan {
    public get tasks(): IProfileValidationTask[] {
        return [{
            name: "Check the size option",
            description: "The size should be manageable",
            taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                let outcome: VALIDATION_OUTCOME;
                let description;
                if (profile.importance === "irrelevant") {
                    outcome = "Failed";
                    description = "This is not worth it";
                } else if (profile.importance === "desirable") {
                    outcome = "OK";
                    description = "We should work on it some time";
                } else if (profile.importance === "critical") {
                    outcome = "Warning";
                    description = "We must work on this now";
                } else {
                    outcome = "Failed";
                    description = "The importance is unknown: " + profile.importance;
                }
                const result: IProfileValidationTaskResult = {
                    associatedEndpoints: [], outcome, resultDescription: description
                };
                done(result);
            },
            // only run these tasks if it is important enough for the time we must spend
            // if the size task fails, these will be skipped with a warning
            dependentTasks: [
                {
                    name: "Should we work on this item",
                    description: "The duration determines whether we bother",
                    taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                        const daysToDeadline: number = 100;
                        let outcome: VALIDATION_OUTCOME;
                        let description;
                        if (profile.importance === "desirable") {
                            if (profile.duration <= 10) {
                                outcome = "OK";
                                description = "Let's do this";
                            } else {
                                outcome = "Failed";
                                description = "It takes too long for what it is worth";
                            }
                        }

                        if (profile.importance === "critical") {
                            if (profile.duration <= 1000) {
                                outcome = "OK";
                                description = "Let's work our butts off";
                            } else {
                                outcome = "Failed";
                                description = "We might as well go out of business";
                            }
                        }

                        const result: IProfileValidationTaskResult = {
                            associatedEndpoints: [], outcome, resultDescription: description
                        };
                        done(result);
                    }
                }
            ]
        }];
    }

    public get failureSuggestions(): string {
        return "You should have contracted with one of our competitors";
    }
}

export = TestProfileValidationPlan1;
