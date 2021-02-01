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

import { IVariableSpecification } from "./IVariableSpecification";
import { IStepApprovers } from "./IStepApprovers";
import { IPropertyMapping } from "./IPropertyMapping";
// step-definition object (table 3,4,5)
/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IStepDefinition
 */
export interface IStepDefinition{

    // Table 3
    /**
     * Name of the step.
     * @type {string}
     * @memberof IStepDefinition
     */
    name: string;

    /**
     * Step title.
     * @type {string}
     * @memberof IStepDefinition
     */
    title: string;

    /**
     * Step description.
     * @type {string}
     * @memberof IStepDefinition
     */
    description: string;

    /**
     * Lists the names of the steps that must be completed before this step.
     * @type {string[]}
     * @memberof IStepDefinition
     */
    prereqStep?: string[];

    /**
     * Indicates whether the step is optional.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    optional: boolean;

    /**
     * For a parent step, this is a nested array of step-definition objects.
     * @type {IStepDefinition[]}
     * @memberof IStepDefinition
     */
    steps?: IStepDefinition[];

    // Table 4
    /**
     * Describes the workflow to be called.
     * @type {string}
     * @memberof IStepDefinition
     */
    calledWorkflowDescription?: string;

    /**
     * Workflow ID of a workflow definition file.
     * @type {string}
     * @memberof IStepDefinition
     */
    calledWorkflowID?: string;

    /**
     * 128-bit hash value of a workflow definition file.
     * @type {string}
     * @memberof IStepDefinition
     */
    calledWorkflowMD5?: string;

    /**
     * Workflow definition file that is used to create a new workflow.
     * @type {string}
     * @memberof IStepDefinition
     */
    calledWorkflowDefinitionFile?: string;

    /**
     * Version of a workflow definition file.
     * @type {string}
     * @memberof IStepDefinition
     */
    calledWorkflowVersion?: string;

    /**
     * Indicates whether step can be performed auto.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    callingStepAutoEnable?: boolean;

    /**
     * Indicates relative dificulty of the step.
     * @type {number}
     * @memberof IStepDefinition
     */
    callingStepWeight?: number;

    /**
     * Indicates type of skill to execute the step.
     * @type {string}
     * @memberof IStepDefinition
     */
    callingStepSkills?: string;

    // table 5
    /**
     * HTTP status code.
     * @type {string}
     * @memberof IStepDefinition
     */
    actualStatusCode?: string;

    /**
     * Step approvers.
     * @type {IStepApprovers[]}
     * @memberof IStepDefinition
     */
    approvers?: IStepApprovers[];

    /**
     * Indicates whether the step can be performed automatically.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    autoEnable?: boolean;

    /**
     * HTTP status code from the REST API request.
     * @type {string}
     * @memberof IStepDefinition
     */
    expectedStatusCode?: string;

    /**
     * Optional regular expression for program execution failures.
     * @type {string[]}
     * @memberof IStepDefinition
     */
    failedPattern?: string[];

    /**
     * Indicates the hostname or IP address.
     * @type {string}
     * @memberof IStepDefinition
     */
    hostname?: string;

    /**
     * HTTP method that is used for issuing the REST API request.
     * @type {string}
     * @memberof IStepDefinition
     */
    httpMethod?: string;

    /**
     * Instructions on what the user must do to perform the step.
     * @type {string}
     * @memberof IStepDefinition
     */
    instructions?: string;

    /**
     * Indicates whether the step instructions contain variables.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    instructionsSub?: boolean;

    /**
     * Indicates whether this step is a conditional step.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    isConditionStep?: boolean;

    /**
     * Indicates whether this step is a REST API step.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    isRestStep?: boolean;

    /**
     * Specifies the maximum record length for a job.
     * @type {number}
     * @memberof IStepDefinition
     */
    maxLrecl?: number;

    /**
     * Name of the output file that is produced by the step.
     * @type {string}
     * @memberof IStepDefinition
     */
    output?: string;

    /**
     * Indicates whether the output file name contains variable substitution.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    outputSub?: boolean;

    /**
     * Contains a prefix that identifies a string as a variable.
     * @type {string}
     * @memberof IStepDefinition
     */
    outputVariablesPrefix?: string;

    /**
     * Port number that is associated with the REST request.
     * @type {string}
     * @memberof IStepDefinition
     */
    port?: string;

    /**
     * Indicates whether the port number contains variable substitution.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    portSub?: boolean;

    /**
     * Name of the logon procedure that is used to log into the TSO/E.
     * @type {string}
     * @memberof IStepDefinition
     */
    procName?: string;

    /**
     * Array of property mapping.
     * @type {IPropertyMapping[]}
     * @memberof IStepDefinition
     */
    propertyMappings?: IPropertyMapping[];

    /**
     * Contains the query parameters.
     * @type {string}
     * @memberof IStepDefinition
     */
    queryParameters?: string;

    /**
     * Indicates whether the query parameters contain variable substitution.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    queryParametersSub?: boolean;

    /**
     * Contains the region size for the TSO/E address space.
     * @type {string}
     * @memberof IStepDefinition
     */
    regionSize?: string;

    /**
     * Contains the request body.
     * @type {string}
     * @memberof IStepDefinition
     */
    requestBody?: string;

    /**
     * Indicates whether the request body variable substitution.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    requestBodySub?: boolean;

    /**
     * Data set name that contains the saved JCL.
     * @type {string}
     * @memberof IStepDefinition
     */
    saveAsDataset?: string;

    /**
     * Indicates whether the data set name contains variable substitution.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    saveAsDatasetSub?: boolean;

    /**
     * UNIX file name (absolute name) that contains the saved JCL.
     * @type {string}
     * @memberof IStepDefinition
     */
    saveAsUnixFile?: string;

    /**
     * Indicates whether the UNIX file name contains variable substitution.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    saveAsUnixFileSub?: boolean;

    /**
     * Name that is used for the REST request.
     * @type {string}
     * @memberof IStepDefinition
     */
    schemeName?: string;

    /**
     * Indicates whether the scheme name contains variable substitution.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    schemeNameSub?: boolean;

    /**
     * Contains the input parameters that can be set by the step owner.
     * @type {string[]}
     * @memberof IStepDefinition
     */
    scriptParameters?: string[];

    /**
     * Type of skills that are required to perform the step.
     * @type {string}
     * @memberof IStepDefinition
     */
    skills?: string;

    /**
     * Indicates the type of executable program.
     * @type {string}
     * @memberof IStepDefinition
     */
    submitAs?: string;

    /**
     * Regular expression that is returned for a successful program execution.
     * @type {string}
     * @memberof IStepDefinition
     */
    successPattern?: string;

    /**
     * Indicates the template that is used to run a program or batch job.
     * @type {string}
     * @memberof IStepDefinition
     */
    template?: string;

    /**
     * Indicates whether template contains variable substitution.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    templateSub?: boolean;

    /**
     * contains the maximum amount of time that the program can run.
     * @type {string}
     * @memberof IStepDefinition
     */
    timeout?: string;

    /**
     * The URI path to use for the REST request.
     * @type {string}
     * @memberof IStepDefinition
     */
    uriPath?: string;

    /**
     * Indicates whether the URI path contains variable substitution.
     * @type {boolean}
     * @memberof IStepDefinition
     */
    uriPathSub?: boolean;

    /**
     * An array of variable-reference objects.
     * @type {IVariableSpecification[]}
     * @memberof IStepDefinition
     */
    "variable-specifications"?: IVariableSpecification[];

    /**
     * The relative difficulty of the step compared to other steps.
     * @type {number}
     * @memberof IStepDefinition
     */
    weight?: number;

}
