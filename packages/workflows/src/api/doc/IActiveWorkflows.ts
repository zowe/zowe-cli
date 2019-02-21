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
import { IWorkflowsInfo } from "./IWorkflowsInfo";

/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IActiveWorkflows
 */

export interface IActiveWorkflows {
 workflows?: IWorkflowsInfo[];
}

