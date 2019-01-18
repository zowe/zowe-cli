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

import { ZosmfRestClient } from "../../../rest";
import { Session, ImperativeError, Imperative, Headers } from "@brightside/imperative";
import { ListWorkflows } from "../../../workflows";
import { IListWorkflows, ListRegistryInstances, noSessionProvisioning, ProvisioningConstants} from "../../src/api/doc/IWorkflowInfo";
import {
    WorkflowConstants,
    noVendor,
    noCategory,
    noStatusName,
    noSystem,
    noOwner,
    nozOSMFVersion,
    noSession
} from "../../src/api/WorkflowConstants";
import { ICreatedWorkflow } from "../../src/api/doc/ICreatedWorkflow";
import { ICreateWorkflow } from "../../src/api/doc/ICreateWorkflow";
import { IVariable } from "../../src/api/doc/IVariables";

const category = "Provisioning";
const system = "CA11";
const statusName = "complete";
const owner = "zosmfad";
const vendor = "IBM";
const wfName = "Test-Workflow";
const NO_FILTERS: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows`;
const FILTER_BY_OWNER: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?owner=${owner}`;
const FILTER_BY_CATEGORY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?category=${category}`;
const FILTER_BY_VENDOR: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?vendor=${vendor}`;
const FILTER_BY_SYSTEM: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?vendor=${system}`;
const FILTER_BY_STATUSNAME: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?vendor=${statusName}`;
const FILTER_BY_OWNER_AND_VENDOR: string =
    `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?owner=${owner}&vendor=${vendor}`;
const START_RESOURCE_QUERY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/${WorkflowConstants.WORKFLOW_RESOURCE}`;


const PRETEND_ZOSMF_RESPONSE: IListWorkflows = {
    workflowKey: "73c81ef4-eccc-47ce-8f08-8a5c97e753f1",
    workflowDescription: "Create workflow test",
    workflowName: "Workflow test",
    system: "Sytem1",
    category: "Provisioning"
};
const PRETEND_INPUT: IListWorkflows = {
    workflowName: wfName,
    system: system,
    owner: owner,
    category: category,
    vendor: vendor,
    stausName:statusName
};
const PRETEND_SESSION = new Session({
    user: "usr",
    password: "pasword",
    hostname: "host.com",
    port: 443,
    type: "basic",
    rejectUnauthorized: false
});

const ZOSMF_RESPONSE: IListWorkflows = {
       "workflows": [
                {
                    "instanceURI": "/zosmf/workflow/rest/1.0/workflows/d043b5f1-adab-48e7-b7c3-d41cd95fa4b0",
                    "owner": "zosmfad",
                    "vendor": "IBM",
                    "category" : "Provisioning",
                    "workflowDefinitionFileMD5Value": "a8825b7497793bc620b0edffa8b97cd9",
                    "workflowDescription": "Sample demonstrating the use of automated steps in workflow.",
                    "workflowID": "automationSample",
                    "workflowKey": "d043b5f1-adab-48e7-b7c3-d41cd95fa4b0",
                    "workflowVersion": "1.0"
                },
                {
                    "instanceURI": "/zosmf/workflow/rest/1.0/workflows/d043b5f1-adab-48e7-b7c3-d41cd95fa4b01",
                    "owner": "zosmfa1",
                    "vendor": "IBM1",
                    "category": "Provisioning",
                    "workflowDefinitionFileMD5Value": "a8825b7497793bc620b0edffa8b97cd91",
                    "workflowDescription": "Sample demonstrating the use of automated steps in workflow.1",
                    "workflowID": "automationSample1",
                    "workflowKey": "d043b5f1-adab-48e7-b7c3-d41cd95fa4b01",
                    "workflowVersion": "1.01"
                }
        ]
};


function expectZosmfResponseSucceeded(response: any, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: any, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}

    
describe("ListWorkflows getResourcesQuery", () => {

        it("should return query without filters", () => {
            const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION);
            Imperative.console.info(`Generated query: ${resourcesQuery}`);
            expect(resourcesQuery).toBeDefined();
            expect(resourcesQuery).toEqual(NO_FILTERS);
        });

        it("should return query with 'category' filter", () => {
            const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION, category);
            Imperative.console.info(`Generated query: ${resourcesQuery}`);
            expect(resourcesQuery).toBeDefined();
            expect(resourcesQuery).toEqual(FILTER_BY_CATEGORY);
        });

        it("should return query with 'category' filter", () => {
            const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION, system);
            Imperative.console.info(`Generated query: ${resourcesQuery}`);
            expect(resourcesQuery).toBeDefined();
            expect(resourcesQuery).toEqual(FILTER_BY_SYSTEM);
        });

        it("should return query with 'category' filter", () => {
            const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION, statusName);
            Imperative.console.info(`Generated query: ${resourcesQuery}`);
            expect(resourcesQuery).toBeDefined();
            expect(resourcesQuery).toEqual(FILTER_BY_STATUSNAME);
         });

        it("should return query with 'owner' filter", () => {
            const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION, owner);
            Imperative.console.info(`Generated query: ${resourcesQuery}`);
            expect(resourcesQuery).toBeDefined();
            expect(resourcesQuery).toEqual(FILTER_BY_OWNER);
        });
        
        it("should return query with 'vendor' filter", () => {
            const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION, undefined, vendor);
            Imperative.console.info(`Generated query: ${resourcesQuery}`);
            expect(resourcesQuery).toBeDefined();
            expect(resourcesQuery).toEqual(FILTER_BY_VENDOR);
    });
        it("should return query with 'owner' and 'vendor' filters", () => {
            const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION, owner, vendor, system, statusName, category);
            Imperative.console.info(`Generated query: ${resourcesQuery}`);
            expect(resourcesQuery).toBeDefined();
            expect(resourcesQuery).toEqual(FILTER_BY_OWNER_AND_VENDOR);
        }); 
});
 
/*
    //error handling
    let error: ImperativeError;
    let response: any;
    try {
        response = await ListWorkflows.ListWorkflow(PRETEND_SESSION, vendor, null, undefined);
        Imperative.console.info(`Response ${response}`);
    } catch (thrownError) {
        error = thrownError;
        Imperative.console.info(`Error ${error}`);
    }
    expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledTimes(1);
    expect((ZosmfRestClient.postExpectJSON as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY);
    expectZosmfResponseSucceeded(response, error);
    expect(response).toEqual(PRETEND_ZOSMF_RESPONSE);

*/
    // error session
    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await ListWorkflows.listWorkflows(undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noSession.message);
    });
    // z/OSMF error
    it("should throw an error if the z/OSMF version parameter is an empty string", async () => {
        let error: ImperativeError;
        let response: ListWorkflows;
        try {
            response = await ListWorkflows.Workflows(PRETEND_SESSION, undefined);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, nozOSMFVersion.message);
    });
    // empty filter parametr
    it("Should throw error if filter is empty string.", async () => {
            let error: ImperativeError;
            let response: any;
            try {
                response = await ListWorkflows.listWorkflows(PRETEND_SESSION, vendor, "");
                Imperative.console.info(`Response ${response}`);
            } catch (thrownError) {
                error = thrownError;
                Imperative.console.info(`Error ${error}`);
            }
        expectZosmfResponseFailed(response, error, noVendor.message);
     }); 

