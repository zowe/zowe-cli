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
import {IApimlSvcAttrs } from "@zowe/imperative";

/* Once getPluginApimlConfigs() has processed the loaded ImperativeConfig,
 * the connProfType will be a required property in the resulting object.
 */
export interface IApimlSvcAttrsLoaded extends IApimlSvcAttrs {
    connProfType: string;
    pluginName: string;
}
