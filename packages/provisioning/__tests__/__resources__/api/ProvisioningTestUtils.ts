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

import { AbstractSession, Imperative } from "@zowe/imperative";
import {
    DeleteInstance,
    IProvisionedInstance,
    IProvisionTemplateResponse,
    ListInstanceInfo,
    PerformAction,
    ProvisioningConstants,
    ProvisionPublishedTemplate
} from "../../..";

/**
 * System preparation functions before and after running tests
 * @class ProvisioningTestUtils
 */
export class ProvisioningTestUtils {
    public static readonly SLEEP_TIME: number = 2000;

    public static async sleep(time: number) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    /**
     * The functions provisions a template and waits until its state is provisioned
     * @param session
     * @param zOSMFVersion
     * @param templateName
     */
    public static async getProvisionedInstance(session: AbstractSession, zOSMFVersion: string,
                                               templateName: string): Promise<IProvisionedInstance> {
        let instance;
        try {
            instance = await ProvisionPublishedTemplate.provisionTemplate(session, zOSMFVersion, templateName);
            Imperative.console.info(`Provisioned template: ${instance}`);
            const instanceID = instance["registry-info"]["object-id"];
            instance = await ListInstanceInfo.listInstanceCommon(session, zOSMFVersion, instanceID);
            while(instance.state !== "provisioned") {
                instance = await ListInstanceInfo.listInstanceCommon(session, zOSMFVersion, instanceID);
                Imperative.console.info(`Instance state: ${instance.state}`);
                await this.sleep(this.SLEEP_TIME);
            }
            return instance;
        } catch (thrownError) {
            Imperative.console.info(`Error ${thrownError}`);
            throw thrownError;
        }
    }

    public static async removeProvisionedInstance(session: AbstractSession, zOSMFVersion: string,
                                                  instanceID: string) {
        let instance;
        try {
            instance = await PerformAction.doProvisioningActionCommon(session, ProvisioningConstants.ZOSMF_VERSION,
                instanceID, "deprovision");
            Imperative.console.info(`Deprovision of the instance started, action-id: ${instance["action-id"]}`);
            instance = await ListInstanceInfo.listInstanceCommon(session, zOSMFVersion, instanceID);
            Imperative.console.info(`Instance state: ${instance.state}`);
            while(instance.state !== "deprovisioned") {
                instance = await ListInstanceInfo.listInstanceCommon(session, zOSMFVersion, instanceID);
                Imperative.console.info(`Instance state: ${instance.state}`);
                await this.sleep(this.SLEEP_TIME);
            }
            // Delete deprovisioned instance
            await DeleteInstance.deleteDeprovisionedInstance(session, ProvisioningConstants.ZOSMF_VERSION, instanceID);
            Imperative.console.info(`Instance ${instance["external-name"]} was removed`);
        } catch (thrownError) {
            Imperative.console.info(`Error ${thrownError}`);
            throw thrownError;
        }
    }
}
