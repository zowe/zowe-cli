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

import { IProfileValidationReport } from "../doc/IProfileValidationReport";
import { IProfileValidationPlan } from "../doc/IProfileValidationPlan";
import {
    IProfileValidationTask,
    IProfileValidationTaskFunction,
    VALIDATION_OUTCOME
} from "../doc/IProfileValidationTask";
import { IProfileValidationTaskResult } from "../doc/IProfileValidationTaskResult";
import { isNullOrUndefined } from "util";
import { Logger, LoggerUtils } from "../../../../logger";
import { TextUtils } from "../../../../utilities";
import { IPromiseWithProgress, ITaskWithStatus, TaskProgress, TaskStage } from "../../../../operations";
import { ICommandOptionDefinition } from "../../../../cmd";
import { IProfile } from "../../doc/definition/IProfile";
import { CliUtils } from "../../../../utilities/src/CliUtils";

/**
 * API for going through the full validation test for a Zowe CLI profile
 * and producing validation report
 * @internal
 */
export class ProfileValidator {

    /**
     * The key used to access the filename for the type containing the profile
     * validation plan object. On your profile validation command definition,
     * specify the filename in   .customize[CUSTOMIZE_PLAN_KEY]
     * @type {string}
     */
    public static readonly CUSTOMIZE_PLAN_KEY = "validationPlanModule";

    /**
     * The command line option for printing the validation plan only
     */
    public static get PRINT_PLAN_OPTION(): ICommandOptionDefinition {
        return {
            name: "print-plan-only", aliases: ["plan", "p"],
            description: "Instead of validating your profile, print out " +
                "a table of the tasks used for validation. This will explain the different services and " +
                "functionality that will be tested during profile validation.",
            type: "boolean"
        };
    }

    /**
     *  Produce a profile validation report for a specific profile
     * @param {IProfile} profile the profile to validate
     * @param {IProfileValidationPlan} plan - the profile validation testing plan
     * @param productDisplayName - the display name for your CLI
     * @returns {IPromiseWithProgress<IProfileValidationReport>} a promise of the validation report, with an additional field
     *                              that can be used to create a progress bar or track progress in another UI
     */
    public static validate(profile: IProfile,
        plan: IProfileValidationPlan,
        productDisplayName: string): IPromiseWithProgress<IProfileValidationReport> {
        const log = Logger.getImperativeLogger();
        const progress: ITaskWithStatus = {
            stageName: TaskStage.IN_PROGRESS,
            percentComplete: TaskProgress.ZERO_PERCENT,
            statusMessage: "Preparing to validate profile"
        };
        const promise: any = new Promise<IProfileValidationReport>((validationComplete) => {
            const report: IProfileValidationReport = {
                overallResult: "OK", // start with success and change it if there are any failures
                taskResults: [],
                overallMessage: "Your profile is valid and ready for use with " +
                    productDisplayName,
                profile
            };
            log.debug("Validating profile with %d tasks", plan.tasks.length);

            let tasksCompleted = 0;
            let numTasksToComplete = 0;
            const countTasks = (task: IProfileValidationTask) => {
                numTasksToComplete++;
                if (!isNullOrUndefined(task.dependentTasks)) {
                    for (const dependent of task.dependentTasks) {
                        countTasks(dependent);
                    }
                }
            };
            for (const task of plan.tasks) {
                countTasks(task); // get the total number of tasks
            }
            if (numTasksToComplete === 0) {
                throw new Error("Validation plan has no tasks! If you want to validate a profile, " +
                    "you need at least one task in your plan.");
            }

            let tasksToRun = [].concat(plan.tasks);

            // define how tasks will be handled when we run them
            const runTask = () => {
                const currentTask = tasksToRun[0];
                tasksToRun = tasksToRun.slice(1); // take off the task we're working on now

                const skipDependentTask = (dependentTask: IProfileValidationTask, result: IProfileValidationTaskResult) => {
                    // add a 'skipped task' result for each descendant dependent task
                    const skippedResult: IProfileValidationTaskResult = {
                        taskName: dependentTask.name,
                        associatedEndpoints: dependentTask.associatedEndpoints,
                        outcome: "Warning",
                        resultDescription: TextUtils.formatMessage(
                            "Skipped due to '%s' getting a result of %s",
                            currentTask.name, this.outcomeToString(result.outcome))
                    };
                    report.taskResults.push(skippedResult);
                    tasksCompleted++;
                    if (!isNullOrUndefined(dependentTask.dependentTasks)) {
                        for (const grandDependent of dependentTask.dependentTasks) {
                            skipDependentTask(grandDependent, result);
                        }
                    }
                };

                const taskFunction: IProfileValidationTaskFunction = currentTask.taskFunction;
                progress.percentComplete = (((tasksCompleted) / numTasksToComplete) * TaskProgress.ONE_HUNDRED_PERCENT);
                progress.statusMessage = TextUtils.formatMessage("Checking '%s' (%d of %d)", currentTask.name,
                    tasksCompleted + 1, numTasksToComplete);
                try {
                    taskFunction(profile, (result: IProfileValidationTaskResult) => {
                        result.associatedEndpoints = currentTask.associatedEndpoints;
                        result.taskName = currentTask.name;
                        // task is complete, store off the results
                        tasksCompleted++;
                        report.taskResults.push(result);
                        log.debug("Profile validation task result: task name: %s, outcome %s, description %s, associated endpoints: %s",
                            result.taskName, this.outcomeToString(result.outcome), result.resultDescription,
                            (isNullOrUndefined(result.associatedEndpoints) ? "none" : result.associatedEndpoints.join(", ")));

                        // set the overall status of the validation based on this outcome
                        // only 100% success is considered a successful validation
                        if (result.outcome === "Warning" && report.overallResult === "OK") {
                            report.overallResult = "Warning";

                        } else if (result.outcome === "Failed") {
                            // mark the validation failed if any task fails
                            report.overallResult = "Failed";
                        }
                        if (!isNullOrUndefined(currentTask.dependentTasks)) {
                            if (result.outcome === "Failed" || result.outcome === "Warning") {
                                log.warn("Parent task %s failed, skipping dependent tasks",
                                    currentTask.name);
                                for (const dependent of currentTask.dependentTasks) {
                                    skipDependentTask(dependent, result);
                                }
                            } else {
                                // add the dependent tasks as the next tasks to execute
                                log.debug("Adding dependent tasks of %s to the lists of tasks to run",
                                    currentTask.name);
                                tasksToRun = currentTask.dependentTasks.concat(tasksToRun);
                            }
                        }
                        if (tasksCompleted < numTasksToComplete) {
                            // if there are more tasks, run the next one
                            runTask();
                        } else {
                            log.info("All profile validation tasks have completed. The profile's validity: %s",
                                this.outcomeToString(report.overallResult));
                            validationComplete(report);
                        }
                    });
                }
                /**
                     * Catch unexpected exceptions within the task function
                     */ catch (e) {
                    tasksCompleted++;
                    report.overallResult = "Failed";
                    log.error("Error during profile validation: %s\n%s", e.message, e.stack);
                    const result: IProfileValidationTaskResult = {
                        outcome: "Failed",
                        resultDescription: "Encountered an unexpected exception: " + e.message,
                        associatedEndpoints: currentTask.associatedEndpoints,
                        taskName: currentTask.taskName
                    };
                    report.taskResults.push(result);
                    log.warn("Parent task %s failed, skipping dependent tasks",
                        currentTask.name);
                    for (const dependent of currentTask.dependentTasks) {
                        skipDependentTask(dependent, result);
                    }
                    if (tasksCompleted < numTasksToComplete) {
                        // if there are more tasks, run the next one
                        runTask();
                    } else {
                        log.info("All profile validation tasks have completed. The profile's validity: %s",
                            this.outcomeToString(report.overallResult));
                        validationComplete(report);
                    }

                }
            };
            runTask();
        });

        promise.progress = progress;
        return promise;
    }

    /**
     * Get a printed/tabular version of your validation report
     * @param {IProfileValidationReport} report - your completed validation result
     * @param plan - the validation plan to use
     * @param productDisplayName - the display name for your CLI used in the final result text
     * @param primaryHighlightColor - color used to highlight headings and tables (used with chalk package)
     * @param profileName - the name of the profile that was validated
     * @param profileType - the type of the profile that was validated
     * @returns {string} - the formatted report
     */
    public static getTextDisplayForReport(report: IProfileValidationReport, plan: IProfileValidationPlan,
        productDisplayName: string, primaryHighlightColor: string,
        profileName: string, profileType: string): string {
        const log = Logger.getImperativeLogger();
        let text = "";

        let {failed, undetermined, succeeded} = this.countOutcomes(report);

        text += CliUtils.formatHelpHeader("Profile Summary", undefined, primaryHighlightColor) + "\n\n";
        const censoredProfile = LoggerUtils.censorYargsArguments(report.profile as any);
        text += TextUtils.prettyJson(censoredProfile);
        text += CliUtils.formatHelpHeader("Profile Validation Results", undefined, primaryHighlightColor) + "\n\n";

        /**
         * Get a colored summary of the total numbers of failed, warning, and succeeded tests
         */
        if (failed === 0) {
            failed = TextUtils.chalk.gray(failed);
        } else {
            failed = TextUtils.chalk.red(failed);
        }
        if (undetermined === 0) {
            undetermined = TextUtils.chalk.gray(undetermined);
        } else {
            undetermined = TextUtils.chalk.yellow(undetermined);
        }
        if (succeeded === 0) {
            succeeded = TextUtils.chalk.gray(succeeded);
        } else {
            succeeded = TextUtils.chalk.green(succeeded);
        }

        interface ITaskResultRow {
            Task: string;
            Status: string;
            Description: string;
            Endpoint: string;
        }

        const tableObject: ITaskResultRow[] = report.taskResults.map((taskResult) => {
            let statusChar = "";
            if (taskResult.outcome === "OK") {
                statusChar = TextUtils.chalk.green("OK");
            } else if (taskResult.outcome === "Warning") {
                statusChar = TextUtils.chalk.yellow("?\nWarning");
            } else if (taskResult.outcome === "Failed") {
                statusChar = TextUtils.chalk.red("X\nFailed");
            }
            let description = taskResult.resultDescription;
            const maxDescriptionLength = 500;
            if (description.length > maxDescriptionLength) {
                description = description.substring(0, maxDescriptionLength) + "...(more info in log)";
                log.info("Truncated description from profile validation: %s", taskResult.resultDescription);
            }
            const result = {
                Task: taskResult.taskName,
                Status: statusChar,
                Description: description,
                Endpoint: taskResult.associatedEndpoints ? taskResult.associatedEndpoints.join(", ") : undefined
            };
            if (isNullOrUndefined(result.Endpoint)) {
                // this prevents the endpoint column from showing up
                // if there are no endpoints specified
                delete result.Endpoint;
            }
            return result;
        });
        text += TextUtils.getTable(tableObject, primaryHighlightColor, undefined, true, true, true) + "\n\n";
        text += TextUtils.wordWrap(TextUtils.formatMessage("Of %s tests, %s succeeded, %s failed, and %s had warnings or undetermined results.\n\n",
            report.taskResults.length, succeeded, failed, undetermined));

        if (report.overallResult === "OK") {
            text += TextUtils.chalk.green("   *~~ Perfect score! Wow! ~~*   ") + "\n\n";
        }
        let outcomeMessage = "";
        switch (report.overallResult) {
            case "OK":
                outcomeMessage = "is valid and ready for use with " + productDisplayName + ".\n All profile validation tests " +
                    "succeeded.";
                break;
            case "Failed":
                outcomeMessage = "will not function fully with " + productDisplayName + ".\nAt least one of the above " +
                    "tests failed. " + (plan.failureSuggestions ? "\n" + plan.failureSuggestions : "");
                break;
            case "Warning":
                outcomeMessage = "might not function properly with " + productDisplayName + ".\nAt least one of the above " +
                    "tests got ambiguous results. " + (plan.failureSuggestions ? "\n" + plan.failureSuggestions : "");
                break;
            default:
                log.warn("Unknown validation outcome in report for %s profile %s", profileType, profileName);
        }

        text += TextUtils.wordWrap(TextUtils.formatMessage("The %s profile named \"%s\" %s\n",
            profileType + "", profileName + "", outcomeMessage));
        return text;
    }

    /**
     * Get a printed/tabular version of your validation plan,
     * so that the user can see what steps the Zowe CLI will take to validate their profile
     * @param {IProfileValidationPlan} plan - the plan for profile validation
     * @param profile - the profile that would be validated - used only in this case to show a summary of the profile's contents
     * @param primaryHighlightColor - primary highlight color for use with chalk
     * @returns {string} - the formatted report
     */
    public static getTextDisplayForPlan(plan: IProfileValidationPlan, profile: IProfile, primaryHighlightColor: string): string {
        let text = "";

        text += CliUtils.formatHelpHeader("Profile Summary", undefined, primaryHighlightColor) + "\n\n";
        const censoredProfile = LoggerUtils.censorYargsArguments(profile as any);
        text += TextUtils.prettyJson(censoredProfile);
        text += CliUtils.formatHelpHeader("Profile Validation Plan", undefined, primaryHighlightColor) + "\n\n";

        /**
         * Collapse the tree of task dependencies into a 1D array
         * so that we can display it in the table
         */
        const allTasks: IProfileValidationTask[] = [];
        const addTasks = (task: IProfileValidationTask) => {
            allTasks.push(task);
            if (!isNullOrUndefined(task.dependentTasks)) {
                for (const dependent of task.dependentTasks) {
                    addTasks(dependent);
                }
            }
        };
        for (const task of plan.tasks) {
            addTasks(task);
        }

        interface ITaskPlanRow {
            Task: string;
            Description: string;
            Endpoints: string;
        }

        const tableObject: ITaskPlanRow[] = allTasks.map((task) => {
            const result: ITaskPlanRow = {
                Task: task.name,
                Description: task.description,
                Endpoints: task.associatedEndpoints ? task.associatedEndpoints.join(", ") : undefined
            };
            if (result.Endpoints == null) {
                delete result.Endpoints;
            }
            return result;
        });
        text += TextUtils.getTable(tableObject, primaryHighlightColor, undefined,
            true, true) + "\n\n";
        return text;
    }

    /**
     * Get a more readable version of the outcome
     * @param {VALIDATION_OUTCOME} outcome - the outcome to convert to readable version
     * @returns {string} - full version of the outcome
     */
    public static outcomeToString(outcome: VALIDATION_OUTCOME): string {
        if (outcome === "OK") {
            return "Succeeded";
        } else if (outcome === "Warning") {
            return "Warning";
        } else if (outcome === "Failed") {
            return "Failed";
        }
    }

    /**
     * Get the total number of each type of profile validation outcome
     * @param {IProfileValidationReport} report - the report from which
     * @returns {{succeeded: number, undetermined: number, failed: number}} - total count
     *                                   of what has succeeded, undetermined, failed
     */
    private static countOutcomes(report: IProfileValidationReport): { succeeded: number, undetermined: number, failed: number } {
        const log = Logger.getImperativeLogger();
        const result = {succeeded: 0, undetermined: 0, failed: 0};
        for (const task of report.taskResults) {
            switch (task.outcome) {
                case "OK":
                    result.succeeded++;
                    break;
                case "Warning":
                    result.undetermined++;
                    break;
                case "Failed":
                    result.failed++;
                    break;
                default:
                    log.warn("Unknown validation outcome for %s profile %s", report.profile.type, report.profile.name);
            }
        }
        return result;
    }
}
