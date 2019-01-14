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
//import { Session, ImperativeError, Imperative, Headers } from "@brightside/imperative";
import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import { ListWorkflows } from "../../../workflows";
import { WorkflowConstants, noSession, noFilter } from "../../src/api/WorkflowConstants";
//import { inspect } from "util";
import { IListWorkflows, ListRegistryInstances, noSessionProvisioning, nozOSMFVersion, ProvisioningConstants } from "../../src/api/doc/zosmf/IListWorkflows";

const category = "Provisioning";
const system = "CA11";
const statusName = "complete";
const owner = "zosmfad";
const vendor = "IBM";
const NO_FILTERS: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows`;
const FILTER_BY_OWNER: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?owner=${owner}`;
const FILTER_BY_CATEGORY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?category=${category}`;
const FILTER_BY_VENDOR: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?vendor=${vendor}`;
const FILTER_BY_OWNER_AND_VENDOR: string =
    `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?owner=${owner}&vendor=${vendor}`;
const FILTER_BY_EXT_NAME_AND_TYPE_CICS: string =
    `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/workflows?owner=zosmfad&external-name=IBM`;


//*let PRETEND_RESOURCES_QUERY: string = `${WorkflowConstants.RESOURCE}/${WorkflowConstants.ZOSMF_VERSION}/`;
//*PRETEND_RESOURCES_QUERY += `${WorkflowConstants.WORKFLOW_RESOURCE}/${wfKey}/${WorkflowConstants.VARIABLES_RESOURCE}`; //Variable????
//PRETEND_RESOURCE_QUERY += `${WorkflowConstants.WORKFLOW_RESOURCE}/${WorkflowConstants.LIST_WORKFLOWS}/?${category}/?${system}/?${statusName}/?${owner}/?${vendor}`;
//START_RESOURCE_QUERY += `${ WorkflowConstants.RESOURCE }/${ WorkflowConstants.LIST_WORKFLOWS }`;

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
                    "workflowName": "AutomationExample|Canceled|1423679433714",
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
                    "workflowName": "AutomationExample|Canceled|14236794337141",
                    "workflowVersion": "1.01"
                }
        ]
};

const ZOSMF_RESPONSE_DB2_TYPE: IListWorkflows = { "workflows": [ZOSMF_RESPONSE["workflows"][0]] };
const ZOSMF_RESPONSE_CICS_TYPE: IListWorkflows = { "workflows": [ZOSMF_RESPONSE["workflows"][1]] };


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
    /**
    it("should return query with 'owner' filter", () => {
        const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION, owner);
        Imperative.console.info(`Generated query: ${resourcesQuery}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(FILTER_BY_OWNER);
    });
/*
/*
    it("should return query with 'vendor' filter", () => {
        const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION, undefined, vendor);
        Imperative.console.info(`Generated query: ${resourcesQuery}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(FILTER_BY_VENDOR);
    });

    it("should return query with 'owner' and 'vendor' filters", () => {
        const resourcesQuery = ListWorkflows.getResourcesQuery(WorkflowConstants.ZOSMF_VERSION, owner, vendor);
        Imperative.console.info(`Generated query: ${resourcesQuery}`);
        expect(resourcesQuery).toBeDefined();
        expect(resourcesQuery).toEqual(FILTER_BY_OWNER_AND_VENDOR);
    }); */
});



/*


function expectZosmfResponseSucceeded(response: any, error: ImperativeError) {
    expect(error).not.toBeDefined();
    expect(response).toBeDefined();
}

function expectZosmfResponseFailed(response: any, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}



describe("ListWorkflows", () => {
    //list all
    it("Successfull call returns 200 - no message. Test list all workflows.", async () => {
        (ZosmfRestClient.putExpectString as any) = jest.fn<string>(() => {
            return "";
        });

        let error: ImperativeError;
        let response: any;
        try {
            response = await ListWorkflows.listWorkflows(PRETEND_SESSION);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledTimes(1);
        expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [Headers.APPLICATION_JSON], { });
        expectZosmfResponseSucceeded(response, error);
        expect(response).toEqual("");
    });   

    //list with filters 
    it("Successfull call returns 200 - no message. Test list workflows with filter.", async () => {
        (ZosmfRestClient.putExpectString as any) = jest.fn<string>(() => {
            return "";
        });

        let error: ImperativeError;
        let response: any;
        try {
            response = await ListWorkflows.listWorkflows(PRETEND_SESSION, category, owner, vendor, statusName, system);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
    //    expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledTimes(1);
    //    expect((ZosmfRestClient.putExpectString as any)).toHaveBeenCalledWith(PRETEND_SESSION, START_RESOURCE_QUERY, [Headers.APPLICATION_JSON], { });
    //    expectZosmfResponseSucceeded(response, error);
   //     expect(response).toEqual("");
    });  
 

    //error session
    it("should throw an error if the session parameter is undefined", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await ListWorkflows.listWorkflows(undefined,category);
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noSession.message);
    });

    //empty filter
    it("Should throw error if filter is empty string.", async () => {
        let error: ImperativeError;
        let response: any;
        try {
            response = await ListWorkflows.listWorkflows(PRETEND_SESSION, "");
            Imperative.console.info(`Response ${response}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expectZosmfResponseFailed(response, error, noFilter.message);
    });
});

*/

