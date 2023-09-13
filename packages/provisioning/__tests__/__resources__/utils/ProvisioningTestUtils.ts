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

import { AbstractSession, ImperativeError } from "@zowe/imperative";
import {
    DeleteInstance,
    IProvisionedInstance,
    ListInstanceInfo,
    PerformAction,
    ProvisioningConstants,
    ProvisionPublishedTemplate
} from "../../../src";

/**
 * Class for provisioning test utils.
 * @class ProvisioningTestUtils
 */
export class ProvisioningTestUtils {
    public static readonly SLEEP_TIME: number = 2000;

    // Max timeout time for Jest
    public static MAX_TIMEOUT_TIME: number = 240000;
    public static MAX_CLI_TIMEOUT: number = 60000;

    public static readonly STATE_DEPROV = "deprovisioned";
    public static readonly STATE_BEING_DEPROV = "being-deprovisioned";
    public static readonly STATE_PROV = "provisioned";
    public static readonly STATE_BEING_PROV = "being-provisioned";
    public static readonly STATE_BEING_INIT = "being-initialized";
    public static readonly ACTION_DEPROV = "deprovision";

    /**
     * The function calls timeout and stops execution for specified time.
     * @param time - time to sleep in ms.
     */
    public static async sleep(time: number) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    /**
     * The function tests if response passed from REST call is successful.
     * @param response - response from REST call.
     * @param error - z/OSMF error.
     */
    public static expectZosmfResponseSucceeded(response: any, error: ImperativeError) {
        expect(error).not.toBeDefined();
        expect(response).toBeDefined();
    }

    /**
     * The function tests if REST call is failed.
     * @param response - response from REST call.
     * @param error - z/OSMF error.
     * @param msg - error message to compare with z/OSMF error.
     */
    public static expectZosmfResponseFailed(response: any, error: ImperativeError, msg: string) {
        expect(response).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.details.msg).toContain(msg);
    }

    /**
     * The functions provisions a template and waits until its state is provisioned.
     * @param session - z/OSMF connection info.
     * @param zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     * @param templateName - name of the published template.
     */
    public static async getProvisionedInstance(session: AbstractSession, zOSMFVersion: string,
        templateName: string): Promise<IProvisionedInstance> {
        let instance: any = await ProvisionPublishedTemplate.provisionTemplate(session, zOSMFVersion, templateName);
        // Imperative.console.info(`Provisioned template: ${instance}`);
        const instanceID = instance["registry-info"]["object-id"];
        instance = await ListInstanceInfo.listInstanceCommon(session, zOSMFVersion, instanceID);
        while(instance.state !== this.STATE_PROV) {
            instance = await ListInstanceInfo.listInstanceCommon(session, zOSMFVersion, instanceID);
            // Imperative.console.info(`Instance state: ${instance.state}`);
            await this.sleep(this.SLEEP_TIME);
        }
        return instance;
    }

    /**
     * The function removes an instance despite of its state.
     * @param session - z/OSMF connection info.
     * @param zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     * @param instanceID - ID of the provisioned instance.
     */
    public static async removeRegistryInstance(session: AbstractSession, zOSMFVersion: string,
        instanceID: string) {
        let instance;
        const instanceState = (await ListInstanceInfo.listInstanceCommon(session, zOSMFVersion, instanceID)).state;

        if (instanceState === this.STATE_BEING_DEPROV) {
            // Wait until instance state is 'deprovisioned'
            instance = await this.waitInstanceState(session, zOSMFVersion, instanceID, this.STATE_DEPROV);

        } else if (instanceState === this.STATE_PROV) {
            // Deprovision an instance in 'provisioned' state
            instance = await PerformAction.doProvisioningActionCommon(session, ProvisioningConstants.ZOSMF_VERSION,
                instanceID, this.ACTION_DEPROV);

            // Imperative.console.info(`Deprovision of the instance started, action-id: ${instance["action-id"]}`);
            // Wait until instance state is 'deprovisioned'
            instance = await this.waitInstanceState(session, zOSMFVersion, instanceID, this.STATE_DEPROV);

        } else if (instanceState === this.STATE_BEING_INIT || instanceState === this.STATE_BEING_PROV) {
            // Wait until instance state is 'provisioned'
            instance = await this.waitInstanceState(session, zOSMFVersion, instanceID, this.STATE_PROV);

            // Deprovision an instance in 'provisioned' state
            instance = await PerformAction.doProvisioningActionCommon(session, ProvisioningConstants.ZOSMF_VERSION,
                instanceID, this.ACTION_DEPROV);
            // Imperative.console.info(`Deprovision of the instance started, action-id: ${instance["action-id"]}`);

            // Wait until instance state is 'deprovisioned'
            instance = await this.waitInstanceState(session, zOSMFVersion, instanceID, this.STATE_DEPROV);
        }

        // Delete deprovisioned instance
        await DeleteInstance.deleteDeprovisionedInstance(session, ProvisioningConstants.ZOSMF_VERSION, instanceID);
        // Imperative.console.info(`Instance ${instance["external-name"]} was removed`);
    }

    /**
     * The function will wait until an instance is not with desired state.
     * @param session - z/OSMF connection info.
     * @param zOSMFVersion - the URI path variable that identifies the version of the z/OSMF software services template service.
     * @param instanceID - ID of the provisioned instance.
     * @param state - desired state value.
     */
    public static async waitInstanceState(session: AbstractSession, zOSMFVersion: string,
        instanceID: string, state: string) {
        // Imperative.console.info(`Waiting instance state to be "${state}"`);
        // Get the instance
        let instance = await ListInstanceInfo.listInstanceCommon(session, zOSMFVersion, instanceID);
        // Check if the instance state is equal to desired state
        while(instance.state !== state) {
            instance = await ListInstanceInfo.listInstanceCommon(session, zOSMFVersion, instanceID);
            await this.sleep(this.SLEEP_TIME);
        }
        // Imperative.console.info(`${state} instance name: ${instance["external-name"]}`);
        return instance;
    }
}
