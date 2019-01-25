/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { IExplanationMap } from "@brightside/imperative";
import { explainProvisionedInstanceFull, explainProvisionedInstanceSummary, IProvisionedInstance } from "./IProvisionedInstance";

/**
 * The list of provisioned instances.
 * @export
 * @interface IProvisionedInstances
 */
export interface IProvisionedInstances {

    /**
     * Provisioned software service instances.
     * @type IProvisionedInstance[], @see {IProvisionedInstance}
     * @memberof IProvisionedInstances
     */
    "scr-list": IProvisionedInstance[];
}

/**
 * Main explanation map object for summary output.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IProvisionedInstances
 */
export const explainProvisionedInstancesSummary: IExplanationMap = {
    "scr-list": explainProvisionedInstanceSummary,
    "explainedParentKey": null,
    "ignoredKeys": null,
};

/**
 * Main explanation map object for full output.
 * @type IExplanationMap, @see {IExplanationMap}
 * @memberof IProvisionedInstances
 */
export const explainProvisionedInstancesFull: IExplanationMap = {
    "scr-list": explainProvisionedInstanceFull,
    "explainedParentKey": null,
    "ignoredKeys": null,
};
