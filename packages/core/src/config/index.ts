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

export * from "./api";
export * from "./doc";

export * from "./Config";
export * from "./ConfigAutoStore";
export * from "./ConfigBuilder";
export * from "./ConfigConstants";
export * from "./ConfigSchema";
export * from "./ProfileCredentials";
export * from "./ProfileInfo";
export * from "./ProfInfoErr";

// TODO(zFernand0): convert this to a class and deprecate old methods
// TODO(zFernand0): do a search/replace for import * as ConfigUtils
export * as ConfigUtils from "./ConfigUtils";