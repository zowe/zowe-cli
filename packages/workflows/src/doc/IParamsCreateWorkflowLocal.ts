import { AbstractSession } from "@zowe/imperative";
import { accessT } from "./ICreateWorkflow";

/**
 * Parameters for the createWorkflowLocal method.
 *
 * @export
 * @interface IParamsCreateWorkflowLocal
 */
export interface IParamsCreateWorkflowLocal {
    /**
     * z/OSMF session for the workflow creation.
     *
     * @type {AbstractSession}
     * @memberof IParamsCreateWorkflowLocal
     */
    session: AbstractSession;

    /**
     * Workflow title.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflowLocal
     */
    WorkflowName: string;

    /**
     * Workflow definition file on the local computer.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflowLocal
     */
    WorkflowDefinitionFile: string;

    /**
     * Name of the LPAR where the workflow will be executed.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflowLocal
     */
    systemName: string;

    /**
     * Owner that will be associated with the workflow.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflowLocal
     */
    Owner: string;

    /**
     * Variable input file to supply the workflow with parameters.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflowLocal
     */
    VariableInputFile?: string;

    /**
     * Additional variables you wish to supply to the workflow.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflowLocal
     */
    Variables?: string;

    /**
     * Choose whether the steps of the workflow should be assigned to the owner of the workflow.
     *
     * @type {boolean}
     * @memberof IParamsCreateWorkflowLocal
     */
    AssignToOwner?: boolean;

    /**
     * Access type for the workflow
     *
     * @type {accessT}
     * @memberof IParamsCreateWorkflowLocal
     */
    AccessType?: accessT;

    /**
     * Choose whether the jobs submitted by the workflow should be deleted upon completion.
     *
     * @type {boolean}
     * @memberof IParamsCreateWorkflowLocal
     */
    DeleteCompletedJobs?: boolean;

    /**
     * Specify whether the temp files uploaded to the mainframe should be kept or deleted.
     *
     * @type {boolean}
     * @memberof IParamsCreateWorkflowLocal
     */
    keepFiles?: boolean;

    /**
     * Custom USS directory where workflow, etc will be uploaded before registration.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflowLocal
     */
    customDir?: string;

    /**
     * Custom JOB statement to be used by the workflow instead of the default one.
     *
     * @type {Array<string>}
     * @memberof IParamsCreateWorkflowLocal
     */
    JobStatement?: Array<string>;

    /**
     * Version of the z/OSMF REST API.
     *
     * @type {string}
     * @memberof IParamsCreateWorkflowLocal
     */
    zOSMFVersion: string;
}