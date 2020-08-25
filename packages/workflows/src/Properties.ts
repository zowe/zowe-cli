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


import { AbstractSession, Headers } from "@zowe/imperative";
import { ZosmfRestClient } from "../";
import { WorkflowConstants, nozOSMFVersion,
        noWorkflowKey } from "./WorkflowConstants";
import { WorkflowValidator } from "./WorkflowValidator";
import { IWorkflowInfo } from "./doc/IWorkflowInfo";
import { IStepSummary } from "./doc/IStepSummary";
import { IStepInfo } from "./doc/IStepInfo";

export class PropertiesWorkflow {
    /**
     * This operation returns properties of the workflow.
     * Parameters indicators are mandatory,request can include steps and variables indicator for requested result.
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string} workflowfKey - Key of workflow.
     * @param {string} zOSMFVersion - the URI path that identifies the version of the provisioning service.
     * @param {boolean} steps - Optional parameter for listing steps properties.
     * @param {boolean} variables - Optional parameter for listing variables properties.
     * @returns {Promise<IWorkflowInfo>} z/OSMF response object
     * @memberof Properties
     */
    // main method
    public static async getWorkflowProperties(session: AbstractSession, workflowKey: string, zOSMFVersion = WorkflowConstants.ZOSMF_VERSION,
                                              steps?: boolean, variables?: boolean): Promise<IWorkflowInfo>{
        WorkflowValidator.validateSession(session);
        WorkflowValidator.validateNotEmptyString(zOSMFVersion, nozOSMFVersion.message);
        let wfKey: string;

        WorkflowValidator.validateNotEmptyString(workflowKey, noWorkflowKey.message);
        wfKey = workflowKey;

        let resourcesQuery: string = `${WorkflowConstants.RESOURCE}/${zOSMFVersion}/`;
        resourcesQuery += `${WorkflowConstants.WORKFLOW_RESOURCE}/${wfKey}`;

        if (steps && variables){
            resourcesQuery += `?${WorkflowConstants.returnData}=${WorkflowConstants.steps},${WorkflowConstants.variables}`;

        } else if (steps)   {
            resourcesQuery += `?${WorkflowConstants.returnData}=${WorkflowConstants.steps}`;

        } else if (variables)   {
            resourcesQuery += `?${WorkflowConstants.returnData}=${WorkflowConstants.variables}`;

        }

        return ZosmfRestClient.getExpectJSON<IWorkflowInfo>(session, resourcesQuery, [Headers.APPLICATION_JSON]);
    }

    /**
     * Processes the z/OSMF workflow step info
     * in a recursive manner.
     *
     * @protected
     * @static
     * @param {IStepInfo[]} steps z/OSMF steps to be processed
     * @returns {Promise<IStepSummary[]>} Array of z/OSMF step summary objects
     * @memberof PropertiesWorkflow
     */
    public static async processStepSummaries(steps: IStepInfo[]): Promise<IStepSummary[]> {
        let stepSummaries: IStepSummary[] = [];

        for(const step of steps) {
            let miscValue: string = "N/A";
            if(step.submitAs && step.submitAs.match(/.*JCL/)) {
                if(step.jobInfo && step.jobInfo.jobstatus) {
                    miscValue = step.jobInfo.jobstatus.jobid;
                }
            } else if(step.template) {
                miscValue = "TSO";
            } else if(step.isRestStep) {
                miscValue = `HTTP ${step.actualStatusCode}`;
            }
            const stepSummary: IStepSummary = {
                stepNumber: step.stepNumber,
                name: step.name,
                state: step.state,
                misc: miscValue,
                autoEnable: step.autoEnable,
                description: step.description,
                isRestStep: step.isRestStep,
                optional: step.optional,
                runAsUser: step.runAsUser,
                title: step.title,
                userDefined: step.userDefined
            };

            stepSummaries.push(stepSummary);
            if(step.steps) {
                const subSteps = await PropertiesWorkflow.processStepSummaries(step.steps);
                stepSummaries = stepSummaries.concat(subSteps);
            }
        }

        return stepSummaries;
    }
}
