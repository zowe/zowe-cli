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

import { inspect } from "util";
import { TestLogger } from "../../../../__tests__/src/TestLogger";
import { IProfile } from "../../doc/definition/IProfile";
import { IProfileValidationPlan } from "../doc/IProfileValidationPlan";
import { IProfileValidationReport } from "../doc/IProfileValidationReport";
import { IProfileValidationTaskResult } from "../doc/IProfileValidationTaskResult";
import { ProfileValidator } from "../api/ProfileValidator";
import { IProfileValidationTask } from "../../..";

jest.mock("../../../../imperative/src/Imperative");


const oldForceColorOption = process.env.FORCE_COLOR;

describe("We should provide the ability to validate Imperative CLI profiles by trying out different APIs", () => {
    beforeAll(async () => {
        process.env.FORCE_COLOR = "0";
    });
    const displayName = "dummy";
    afterAll(() => {
        process.env.FORCE_COLOR = oldForceColorOption;
    }
    );
    const dummyProfile: IProfile = {name: "dummy", type: "dummy"};

    it("If we have a mock plan with a failing parent test, the validation should fail and " +
        "none of the tasks dependent on the failing task should run ", () => {
        let anyTaskRun = false;
        const plan: IProfileValidationPlan = {
            tasks: [{
                name: "Master task",
                description: "This will fail, and none of the rest should run ",
                taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                    done({
                        outcome: "Failed",
                        resultDescription: "Failing master task"
                    });
                },
                dependentTasks: [
                    {
                        name: "Task one",
                        description: "First task which should not run",
                        taskFunction: async (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                            anyTaskRun = true; // shouldn't happen!
                            done({
                                outcome: "Warning",
                                resultDescription: "This should not run!"
                            });
                        },
                        dependentTasks: [
                            {
                                name: "Task two",
                                description: "Two level nested task",
                                taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                                    anyTaskRun = true; // shouldn't happen!
                                    done({
                                        outcome: "Warning",
                                        resultDescription: "This should not run!"
                                    });
                                }
                            }]
                    }, {
                        name: "Task three",
                        description: "Second task which should not run",
                        taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                            anyTaskRun = true; // shouldn't happen!
                            done({
                                outcome: "Warning",
                                resultDescription: "This should not run!"
                            });
                        }
                    }
                ]
            }]
        };

        return ProfileValidator.validate(dummyProfile, plan, displayName).then((report: IProfileValidationReport) => {
            const textReport = ProfileValidator.getTextDisplayForReport(report, plan, displayName, "yellow",
                "dummy", "dummy");
            TestLogger.info(textReport);
            expect(report.overallResult).toEqual("Failed");
            expect(anyTaskRun).toBeFalsy();

        });
    });

    it("If we have a mock plan with a parent test that gets a warning, the validation should fail and " +
        "none of the tasks dependent on the failing task should run ", () => {
        let anyTaskRun = false;
        const plan: IProfileValidationPlan = {
            tasks: [{
                name: "Master task",
                description: "This will fail, and none of the rest should run ",
                taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                    done({
                        outcome: "Warning",
                        resultDescription: "Failing master task"
                    });
                },
                dependentTasks: [
                    {
                        name: "Task one",
                        description: "First task which should not run",
                        taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                            anyTaskRun = true; // shouldn't happen!
                            done({
                                outcome: "Warning",
                                resultDescription: "This should not run!"
                            });
                        },
                        dependentTasks: [
                            {
                                name: "Task two",
                                description: "Two level nested task",
                                taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                                    anyTaskRun = true; // shouldn't happen!
                                    done({
                                        outcome: "Warning",
                                        resultDescription: "This should not run!"
                                    });
                                }
                            }]
                    }, {
                        name: "Task three",
                        description: "Second task which should not run",
                        taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                            anyTaskRun = true; // shouldn't happen!
                            done({
                                outcome: "Warning",
                                resultDescription: "This should not run!"
                            });
                        }
                    }
                ]
            }]
        };

        return ProfileValidator.validate(dummyProfile, plan, displayName)
            .then((report: IProfileValidationReport) => {
                const textReport = ProfileValidator.getTextDisplayForReport(report, plan, displayName, "yellow",
                    "dummy", "dummy");
                expect(report.overallResult).toEqual("Warning");
                expect(anyTaskRun).toBeFalsy();
                expect(textReport).toContain("ambiguous results");
            });
    });

    it("If we have a mock plan with a passing parent test,  one failing task and two passing tasks, " +
        "the overall result should be failure ", () => {

        const plan: IProfileValidationPlan = {

            tasks: [{
                name: "Master task",
                description: "This will fail, and none of the rest should run ",
                taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                    done({
                        outcome: "OK",
                        resultDescription: "This should pass"
                    });
                },
                dependentTasks: [
                    {
                        name: "Task one",
                        description: "First task which succeeds",
                        taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                            done({
                                outcome: "OK",
                                resultDescription: "Passes"
                            });
                        },
                    },
                    {
                        name: "Task two",
                        description: "Second task which fails",
                        taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                            done({
                                outcome: "Failed",
                                resultDescription: "Fails"
                            });
                        },

                    }, {
                        name: "Task three",
                        description: "Third task which succeeds",
                        taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                            done({
                                outcome: "OK",
                                resultDescription: "Passes"
                            });
                        }
                    }
                ]
            }]
        };

        return ProfileValidator.validate(dummyProfile, plan, displayName).then((report: IProfileValidationReport) => {
            const textReport = ProfileValidator.getTextDisplayForReport(report, plan, displayName, "yellow",
                "dummy", "dummy");
            expect(report.overallResult).toEqual("Failed");
            expect(textReport).toContain("will not function");
        });
    });

    const goodPlan: IProfileValidationPlan = {
        tasks: [{
            name: "Master task",
            description: "This will succeed, the rest should run",
            taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                done({
                    outcome: "OK",
                    resultDescription: "This should pass"
                });
            },
            dependentTasks: [
                {
                    name: "Task one",
                    description: "First task which succeeds",
                    taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                        done({
                            outcome: "OK",
                            resultDescription: "This should pass"
                        });
                    }
                },
                {
                    name: "Task two",
                    description: "Second task which fails",
                    taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                        done({
                            outcome: "OK",
                            resultDescription: "This should pass"
                        });
                    },

                }, {
                    name: "Task three",
                    description: "Third task which succeeds",
                    taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                        done({
                            outcome: "OK",
                            resultDescription: "This should pass"
                        });
                    }
                }
            ]
        }]
    };
    it("If we have a mock plan with all passing tests, the result should be a successful validation", () => {


        return ProfileValidator.validate(dummyProfile, goodPlan, displayName).then((report: IProfileValidationReport) => {
            const textReport = ProfileValidator.getTextDisplayForReport(report, goodPlan, displayName, "yellow",
                "dummy", "dummy");
            TestLogger.info(textReport);
            expect(report.overallResult).toEqual("OK");
            expect(textReport).toContain("valid and ready");
        });
    });

    it("If we have a mock plan with a parent test that throws an unexpected exception, " +
        "the dependent tasks should still be skipped and we should still get " +
        "a report ", () => {
        let anyTaskRun = false;
        const errorMessage = "This shouldn't disrupt the flow";
        const plan: IProfileValidationPlan = {
            tasks: [{
                name: "Master task",
                description: "This will fail, and none of the rest should run ",
                taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                    throw new Error(errorMessage);
                },
                dependentTasks: [
                    {
                        name: "Task one",
                        description: "First task which should not run",
                        taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                            anyTaskRun = true; // shouldn't happen!
                            done({
                                outcome: "Warning",
                                resultDescription: "This should not run!"
                            });
                        },
                        dependentTasks: [
                            {
                                name: "Task two",
                                description: "Two level nested task",
                                taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                                    anyTaskRun = true; // shouldn't happen!
                                    done({
                                        outcome: "Warning",
                                        resultDescription: "This should not run!"
                                    });
                                }
                            }]
                    }, {
                        name: "Task three",
                        description: "Second task which should not run",
                        taskFunction: (profile: any, done: (result: IProfileValidationTaskResult) => void) => {
                            anyTaskRun = true; // shouldn't happen!
                            done({
                                outcome: "Warning",
                                resultDescription: "This should not run!"
                            });
                        }
                    }
                ]
            }]
        };

        return ProfileValidator.validate(dummyProfile, plan, displayName).then((report: IProfileValidationReport) => {
            const textReport = ProfileValidator.getTextDisplayForReport(report, plan, displayName, "yellow",
                "dummy", "dummy");
            TestLogger.info(textReport);
            expect(report.taskResults[0].resultDescription).toContain(errorMessage);
            expect(report.overallResult).toEqual("Failed");
            expect(anyTaskRun).toBeFalsy();
        });
    });

    it("If we get a text report for a validation plan, the report should contain all of the descriptions " +
        "for each task", () => {
        let expectedWords: string[] = [];
        const findExpectedWordsInTask = (task: IProfileValidationTask) => {
            expectedWords = expectedWords.concat(task.description.split(" "));
            for (const dependent of (task.dependentTasks || [])) {
                findExpectedWordsInTask(dependent);
            }
        };
        for (const task of goodPlan.tasks) {
            findExpectedWordsInTask(task);
        }
        const textPlanReport = ProfileValidator.getTextDisplayForPlan(goodPlan, dummyProfile, "yellow");
        for (const word of expectedWords) {
            expect(textPlanReport).toContain(word);
        }
    });

    it("If we try to validate with a plan with no tasks in it, an error should be thrown to let " +
        "profile/module contributors know that their plan is invalid ", async () => {
        const plan: IProfileValidationPlan = {tasks: []};
        let caughtError;
        try {
            await ProfileValidator.validate(dummyProfile, plan, displayName);
        } catch (error) {
            caughtError = error;
            TestLogger.info("Got an error during validation as expected: " + inspect(error));
        }
        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain("tasks");
    });

    it("If we validate a profile with a result description that is too long, it should be truncated", async () => {
        const thirtyTimes = 30;
        const longDescription = Array(thirtyTimes)
            .join("ABCDEFGHIJKLMNOPQRSTUVABCDEFGHIJKLMNOPQRSTUVABCDEFGHIJKLMNOPQRSTUV");
        const plan: IProfileValidationPlan = {
            tasks: [{
                name: "Task one",
                description: "Task which has a long result description",
                taskFunction: (profile: any, taskDone: (result: IProfileValidationTaskResult) => void) => {
                    taskDone({
                        outcome: "Warning",
                        resultDescription: longDescription
                    });
                }
            }]
        };
        let textReport: string;
        let caughtError;
        try {
            const report = await ProfileValidator.validate(dummyProfile, plan, displayName);
            textReport = ProfileValidator.getTextDisplayForReport(report, plan, displayName, "yellow", "dummy", "dummy");
        } catch (error) {
            caughtError = error;
            TestLogger.info("Got an error during unexpected validation: " + inspect(error));
        }
        expect(caughtError).toBeUndefined();
        expect(textReport).toContain(longDescription.substring(0, 10)); // expect the report to have
        // at least ten characters in a row of the description (Could test more but it's in a tabular format
        // so the characters don't appear together
        expect(textReport).toContain("..."); // expect it to be truncated
    });

    it("a failed profile validation report should include specified failure suggestions", async () => {
        const failureSuggestion = "Try fixing whatever is wrong";
        const plan: IProfileValidationPlan = {
            tasks: [{
                name: "Task one",
                description: "Task which has a long result description",
                taskFunction: (profile: any, taskDone: (result: IProfileValidationTaskResult) => void) => {
                    taskDone({
                        outcome: "Failed",
                        resultDescription: "The task failed"
                    });
                }
            }],
            failureSuggestions: failureSuggestion
        };
        let textReport: string;
        let caughtError;
        try {
            const report = await ProfileValidator.validate(dummyProfile, plan, displayName);
            textReport = ProfileValidator.getTextDisplayForReport(report, plan, displayName, "yellow", "dummy", "dummy");
        } catch (error) {
            caughtError = error;
            TestLogger.info("Got an error during unexpected validation: " + inspect(error));
        }
        expect(caughtError).toBeUndefined();
        // each word of the failure suggestions should appear (tabular format
        // so the characters don't appear together)
        for (const word of failureSuggestion.split(" ")) {
            expect(textReport).toContain(word);
        }
    });
});
