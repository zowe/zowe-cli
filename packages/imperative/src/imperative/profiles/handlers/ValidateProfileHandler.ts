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

import { isNullOrUndefined } from "util";
import { CliProfileManager, ICommandHandler, IHandlerParameters } from "../../../cmd";
import { IImperativeError, ImperativeError } from "../../../error";
import { Imperative } from "../../../index";
import {
    IProfileValidationPlan,
    IProfileValidationReport,
    IProfileValidationTask,
    ProfilesConstants,
    ProfileValidator
} from "../../../profiles";
import { Logger } from "../../../logger";
import { ImperativeConfig } from "../../../utilities";

/**
 * Generic handler for validating a profile and printing a report in response
 */
export default class ValidateProfileHandler implements ICommandHandler {
    /**
     * Get an instance of the imperative logger.
     * @private
     * @type {Logger}
     * @memberof ValidateProfileHandler
     */
    private mLogger: Logger = Imperative.api.imperativeLogger;

    public async process(params: IHandlerParameters): Promise<void> {

        const profileType = params.definition.customize[ProfilesConstants.PROFILES_COMMAND_TYPE_KEY];

        let manager: CliProfileManager;
        try {
            // Extract the profile manager
            manager = Imperative.api.profileManager(profileType);
        } catch (error) {
            // profileIO error is thrown when calling old profile functions in team config mode.
            params.response.console.error(
                "An error occurred trying to validate a profile.\n" + error.message
            );
            return;
        }

        let profileName = manager.getDefaultProfileName();

        // if the user specified a specific profile, we can determine the name of the profile from that
        if (params.arguments.profileName != null) {
            profileName = params.arguments.profileName;
        }

        const profileToValidate = (await manager.load({failNotFound: true, name: profileName})).profile;
        let plan: IProfileValidationPlan;
        try {
            // load the definition of the plan from the specified file path
            // this will return the class definition of the plan
            const planModule = Imperative.getProfileConfiguration(profileType).validationPlanModule;
            plan = require(planModule);
            // instantiate the plan object
            plan = new (plan as any)();
        } catch (e) {
            const planLoadErr: IImperativeError = {
                msg: "An error was encountered trying to load the plan to validate the Zowe profile.",
                additionalDetails: e.message,
                causeErrors: e
            };
            throw new ImperativeError(planLoadErr);
        }

        // if the user just requested that we print the plan rather than actually validate the profile
        if (params.arguments[ProfileValidator.PRINT_PLAN_OPTION.name]) {

            Logger.getImperativeLogger().debug("Printed plan for profile validation requested");
            params.response.console.log(Buffer.from(ProfileValidator.getTextDisplayForPlan(plan, profileToValidate,
                ImperativeConfig.instance.loadedConfig.primaryTextColor)));

            const cleanTaskForJSONOutput = (task: IProfileValidationTask) => {
                delete task.taskFunction;
                if (!isNullOrUndefined(task.dependentTasks)) {
                    for (const dependent of task.dependentTasks) {
                        cleanTaskForJSONOutput(dependent);
                    }
                }
            };
            // add the object version of the plan to the JSON response, without the task functions
            // since they can't be printed
            for (const task of plan.tasks) {
                cleanTaskForJSONOutput(task);
            }
            params.response.data.setObj(plan);
            return;
        }
        let report: IProfileValidationReport;
        try {
            const promise = ProfileValidator.validate(profileToValidate,
                plan, ImperativeConfig.instance.loadedConfig.productDisplayName);
            params.response.progress.startBar({task: promise.progress});
            report = await promise;
            params.response.data.setObj(report);
            const reportText = Buffer.from(ProfileValidator.getTextDisplayForReport(report, plan,
                ImperativeConfig.instance.loadedConfig.productDisplayName,
                ImperativeConfig.instance.loadedConfig.primaryTextColor,
                profileName,
                profileType));
            params.response.console.log(reportText);
        } catch (validateError) {
            const unexpectedError: IImperativeError = {
                msg: "Encountered an unexpected exception " +
                    "while validating your profile. ",
                additionalDetails: validateError.message,
                causeErrors: validateError
            };
            params.response.console.error("Failed to validate profile due to unexpected exception");
            throw new ImperativeError(unexpectedError);
        }
        if (report.overallResult !== "OK") {
            throw new ImperativeError({msg: "The profile validation was not successful"});
        }
    }

}
