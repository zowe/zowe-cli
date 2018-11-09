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

import { IProvisionTemplateResponse } from "../../../index";

/**
 * Mocked data for provision commands
 * @class ProvisionTemplateData
 */
export class ProvisionTemplateData {
    /**
     * Mocked provision template response
     * @type {IProvisionTemplateResponse}
     */
    public static readonly PROVISION_TEMPLATE_RESPONSE: IProvisionTemplateResponse = {
        "registry-info": {
            "object-name": "obj_name1",
            "object-id": "objidunique1",
            "object-uri": "/zosmf/provisioning/rest/1.0/scr/objidunique1",
            "external-name": "some_name1",
            "system-nickname": "DUMBNODE"
        },
        "workflow-info": {
            workflowKey: "workflowkey1234",
            workflowDescription: "Procedure to provision a MQ for zOS Queue Manager",
            workflowID: "ProvisionQueueManager",
            workflowVersion: "1.0.1",
            vendor: "IBM"
        },
        "system-nickname": "DUMBNODE"
    };
}
