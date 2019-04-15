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

import { ITestZosmfSchema } from "./ITestZosmfSchema";
import { ITestConsoleSchema } from "./ITestConsoleSchema";
import { ITestTsoSchema } from "./ITestTsoSchema";

/**
 * Interface representing the values in the custom_properties.yaml file
 * see example_properties.yaml for descriptions and more details
 */
export interface ITestPropertiesSchema {

    zosmf: ITestZosmfSchema;

    zosjobs: {
        iefbr14Member: string,
        iefbr14PSDataSet: string,
        jobclass: string;
        sysaff: string;
    };

    provisioning: {
        templateName: string,
        instanceName: string
    };

    tso: ITestTsoSchema;
    
    console: ITestConsoleSchema;

    workflows: {
        system: string
    };
}
