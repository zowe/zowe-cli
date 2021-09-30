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

import { Config } from "@zowe/imperative";
import { IProfileRpt } from "./IProfileRpt";

/**
 * This structure is used to form the auto-init output report.
 */
export interface IAutoInitRpt {
    configFileNm: string;       // the affected config file name
    typeOfChange: string;       // Was the config file created or modified
    startingConfig: Config;     // the configuration that we started with
    endingConfig: Config;       // the configuration that we ended with
    profileRpts: IProfileRpt[]; // report about each profile we touched
}
