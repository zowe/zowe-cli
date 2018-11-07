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

import { IExplanationMap } from "@brightside/imperative";

/**
 * z/OSMF response when to perform an action on a provisioned instance.
 * @export
 * @interface IPerformActionResponse
 */
export interface IPerformActionResponse {
    /**
     * The ID of the action object that was created by running the action.
     * @type string
     * @memberof IPerformActionResponse
     */
    "action-id": string;

    /**
     * The URI of the new action object.
     * @type string
     * @memberof IPerformActionResponse
     */
    "action-uri": string;
}

export const explainActionResponse: IExplanationMap = {
    "action-id": "Action Id",
    "action-uri": "Action URI",
    "explainedParentKey": "Actions",
    "ignoredKeys": null
};
