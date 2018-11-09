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

import { IProvisionedInstances, IPublishedTemplates } from "../../../index";
/**
 * Mocked data for provision list commands
 * @class ProvisioningListMocks
 */
export class ProvisioningListMocks {

    /**
     * Mocked list template catalog response
     * @type {IPublishedTemplates}
     */
    public static readonly LIST_CATALOG_TEMPLATES_RESPONSE: IPublishedTemplates =
        {
            "psc-list": [
                {
                    "name": "cics_empty_wait",
                    "version": "3",
                    "owner": "nurra01",
                    "state": "published",
                    "description": "Provision a CICS TS V5.3 MOCKUP",
                    "generated-name": "cics_empty_wait.3.TeaCoffeeDomain",
                    "object-id": "cd4ad08e-3d40-4ed8-87f1-f77aae2dfef7",
                    "domain-name": "TeaCoffeeDomain",
                    "software-name": "CICS Transaction Server for z/OS",
                }
            ]
        };
    /**
     * Mocked list registry instances response
     * @type {IProvisionedInstances}
     */
    public static readonly LIST_REGISTRY_INSTANCES_RESPONSE: IProvisionedInstances =
        {
            "scr-list": [
                {
                    "system": "CA32",
                    "sysplex": "PLEXC1",
                    "type": "SYSVIEW",
                    "vendor": "CA Technologies",
                    "version": "15.0",
                    "owner": "muzma01",
                    "provider": "muzma01",
                    "description": null,
                    "state": "deprovisioned",
                    "object-id": "138e58a2-8b19-4a47-8ca4-1fedd6731598",
                    "object-name": "SYSVIEW_14",
                    "external-name": "SYSVIEW_SYSV007_14",
                    "registry-type": "catalog",
                    "catalog-object-id": "43b25917-ca0e-4802-a274-e05f9a70a04b",
                    "catalog-object-name": "Sysview_test3",
                    "created-time": "2018-03-06T14:04:36.114Z",
                    "last-modified-time": "2018-03-06T14:22:09.380Z",
                    "created-by-user": "muzma01",
                    "last-modified-by-user": "muzma01",
                    "last-action-name": "deprovision",
                    "last-action-object-id": "ffab2714-93a3-40f6-b0d4-16db9017445a",
                    "last-action-state": "complete",
                    "user-data-id": null,
                    "tenant-id": "IYU300",
                    "tenant-name": "ProvisionTenant",
                    "domain-id": "IYU3",
                    "domain-name": "ProvisionDomain",
                    "system-nickname": "CA32",
                }]
        };


}
