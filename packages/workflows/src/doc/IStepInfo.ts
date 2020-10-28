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

import { IVariable } from "./IVariable";
import { IJobInfo } from "./IJobInfo";
// step-info object (table 4)
/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IStepInfo
 */
export interface IStepInfo{

    /**
     * Name of the step.
     * @type {string}
     * @memberof IStepInfo
     */
    name: string;

    /**
     * HTTP status code.
     * @type {string}
     * @memberof IStepInfo
     */
    actualStatusCode?: string;

    /**
     * Step assignees.
     * @type {string}
     * @memberof IStepInfo
     */
    assignees?: string;

    /**
     * Indicates whether the step can be performed automatically.
     * @type {boolean}
     * @memberof IStepInfo
     */
    autoEnable: boolean;

    /**
     * Key of the called workflow instance.
     * @type {string}
     * @memberof IStepInfo
     */
    calledInstanceKey?: string;

    /**
     * Scope of the called workflow instance.
     * @type {string}
     * @memberof IStepInfo
     */
    calledInstanceScope?: string;

    /**
     * URI path of the called workflow instance.
     * @type {string}
     * @memberof IStepInfo
     */
    calledInstanceURI?: string;

    /**
     * Workflow ID of a workflow definition file.
     * @type {string}
     * @memberof IStepInfo
     */
    calledWorkflowID?: string;

    /**
     * Version of a workflow definition file.
     * @type {string}
     * @memberof IStepInfo
     */
    calledWorkflowVersion?: string;

    /**
     * 128-bit hash value of a workflow definition file.
     * @type {string}
     * @memberof IStepInfo
     */
    calledWorkflowMD5?: string;

    /**
     * Describes the workflow to be called.
     * @type {string}
     * @memberof IStepInfo
     */
    calledWorkflowDescription?: string;

    /**
     * Workflow definition file that is used to create a new workflow.
     * @type {string}
     * @memberof IStepInfo
     */
    calledWorkflowDefinitionFile?: string;

    /**
     * Step description.
     * @type {string}
     * @memberof IStepInfo
     */
    description: string;

    /**
     * HTTP status code from the REST API request.
     * @type {string}
     * @memberof IStepInfo
     */
    expectedStatusCode?: string;

    /**
     * Optional regular expression for program execution failures.
     * @type {string[]}
     * @memberof IStepInfo
     */
    failedPattern?: string[];

    /**
     * Indicates whether this step calls another workflow.
     * @type {boolean}
     * @memberof IStepInfo
     */
    hasCalledWorkflow?: boolean;

    /**
     * Indicates the hostname or IP address.
     * @type {string}
     * @memberof IStepInfo
     */
    hostname?: string;

    /**
     * HTTP method that is used for issuing the REST API request.
     * @type {string}
     * @memberof IStepInfo
     */
    httpMethod?: string;

    /**
     * Instructions on what the user must do to perform the step.
     * @type {string}
     * @memberof IStepInfo
     */
    instructions?: string;

    /**
     * Indicates whether the step instructions contain variables.
     * @type {boolean}
     * @memberof IStepInfo
     */
    instructionsSub?: boolean;

    /**
     * Indicates whether this step is a conditional step.
     * @type {boolean}
     * @memberof IStepInfo
     */
    isConditionStep?: boolean;

    /**
     * Indicates whether this step is a REST API step.
     * @type {boolean}
     * @memberof IStepInfo
     */
    isRestStep: boolean;

    /**
     * Contains the jobInfo object, which contains details about the job.
     * @type {IJobInfo}
     * @memberof IStepInfo
     */
    jobInfo?: IJobInfo;

    /**
     * Specifies the maximum record length for a job.
     * @type {number}
     * @memberof IStepInfo
     */
    maxLrecl?: number;

    /**
     * Indicates whether the step is optional.
     * @type {boolean}
     * @memberof IStepInfo
     */
    optional: boolean;

    /**
     * Name of the output file that is produced by the step.
     * @type {string}
     * @memberof IStepInfo
     */
    output?: string;

    /**
     * Indicates whether the output file name contains variable substitution.
     * @type {boolean}
     * @memberof IStepInfo
     */
    outputSub?: boolean;

    /**
     * Contains a prefix that identifies a string as a variable.
     * @type {string}
     * @memberof IStepInfo
     */
    outputVariablesPrefix?: string;

    /**
     * User ID of the step owner.
     * @type {string}
     * @memberof IStepInfo
     */
    owner?: string;

    /**
     * Port number that is associated with the REST request.
     * @type {string}
     * @memberof IStepInfo
     */
    port?: string;

    /**
     * Indicates whether the port number contains variable substitution.
     * @type {boolean}
     * @memberof IStepInfo
     */
    portSub?: boolean;

    /**
     * Lists the names of the steps that must be completed before this step.
     * @type {string[]}
     * @memberof IStepInfo
     */
    prereqStep?: string[];

    /**
     * Name of the logon procedure that is used to log into the TSO/E.
     * @type {string}
     * @memberof IStepInfo
     */
    procName?: string;

    /**
     * Contains the query parameters.
     * @type {string}
     * @memberof IStepInfo
     */
    queryParameters?: string;

    /**
     * Indicates whether the query parameters contain variable substitution.
     * @type {boolean}
     * @memberof IStepInfo
     */
    queryParametersSub?: boolean;

    /**
     * Contains the region size for the TSO/E address space.
     * @type {string}
     * @memberof IStepInfo
     */
    regionSize?: string;

    /**
     * Contains the request body.
     * @type {string}
     * @memberof IStepInfo
     */
    requestBody?: string;

    /**
     * Indicates whether the request body variable substitution.
     * @type {boolean}
     * @memberof IStepInfo
     */
    requestBodySub?: boolean;

    /**
     * Indicates the return code that was returned when the job was submitted.
     * @type {string}
     * @memberof IStepInfo
     */
    returnCode?: string;

    /**
     * The user ID under which the step is to be performed.
     * @type {string}
     * @memberof IStepInfo
     */
    runAsUser: string;

    /**
     * Indicates whether the runAsUser ID value can change.
     * @type {boolean}
     * @memberof IStepInfo
     */
    runAsUserDynamic?: boolean;

    /**
     * Data set name that contains the saved JCL.
     * @type {string}
     * @memberof IStepInfo
     */
    saveAsDataset?: string;

    /**
     * Indicates whether the data set name contains variable substitution.
     * @type {boolean}
     * @memberof IStepInfo
     */
    saveAsDatasetSub?: boolean;

    /**
     * UNIX file name (absolute name) that contains the saved JCL.
     * @type {string}
     * @memberof IStepInfo
     */
    saveAsUnixFile?: string;

    /**
     * Indicates whether the UNIX file name contains variable substitution.
     * @type {boolean}
     * @memberof IStepInfo
     */
    saveAsUnixFileSub?: boolean;

    /**
     * Name that is used for the REST request.
     * @type {string}
     * @memberof IStepInfo
     */
    schemeName?: string;

    /**
     * Indicates whether the scheme name contains variable substitution.
     * @type {boolean}
     * @memberof IStepInfo
     */
    schemeNameSub?: boolean;

    /**
     * Contains the input parameters that can be set by the step owner.
     * @type {string[]}
     * @memberof IStepInfo
     */
    scriptParameters?: string[];

    /**
     * Type of skills that are required to perform the step.
     * @type {string}
     * @memberof IStepInfo
     */
    skills?: string;

    /**
     * State of the step.
     * @type {string}
     * @memberof IStepInfo
     */
    state: string;

    /**
     * The step number.
     * @type {string}
     * @memberof IStepInfo
     */
    stepNumber: string;

    /**
     * For a parent step, this is a nested array of step-info objects.
     * @type {IStepInfo[]}
     * @memberof IStepInfo
     */
    steps?: IStepInfo[];

    /**
     * Indicates the type of executable program.
     * @type {string}
     * @memberof IStepInfo
     */
    submitAs?: string;

    /**
     * Regular expression that is returned for a successful program execution.
     * @type {string}
     * @memberof IStepInfo
     */
    successPattern?: string;

    /**
     * Indicates the template that is used to run a program or batch job.
     * @type {string}
     * @memberof IStepInfo
     */
    template?: string;

    /**
     * Indicates whether template contains variable substitution.
     * @type {boolean}
     * @memberof IStepInfo
     */
    templateSub?: boolean;

    /**
     * contains the maximum amount of time that the program can run.
     * @type {string}
     * @memberof IStepInfo
     */
    timeout?: string;

    /**
     * Step title.
     * @type {string}
     * @memberof IStepInfo
     */
    title: string;

    /**
     * The URI path to use for the REST request.
     * @type {string}
     * @memberof IStepInfo
     */
    uriPath?: string;

    /**
     * Indicates whether the URI path contains variable substitution.
     * @type {boolean}
     * @memberof IStepInfo
     */
    uriPathSub?: boolean;

    /**
     * Indicates whether the step was added manually to the workflow.
     * @type {boolean}
     * @memberof IStepInfo
     */
    userDefined: boolean;

    /**
     * An array of variable-reference objects.
     * @type {IVariable[]}
     * @memberof IStepInfo
     */
    "variable-references"?: IVariable[];

    /**
     * The relative difficulty of the step compared to other steps.
     * @type {number}
     * @memberof IStepInfo
     */
    weight?: number;

}
