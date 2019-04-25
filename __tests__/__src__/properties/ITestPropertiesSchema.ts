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
import { ITestZosJobsSchema } from "./ITestZosJobsSchema";
import { ITestProvisioningSchema } from "./ITestProvisioningSchema";
import { ITestWorkflowsSchema } from "./ITestWorkflowsSchema";
import { ITestUnixSchema } from "./ITestUnixSchema";
import { ITestDatasetSchema } from "./ITestDatasetSchema";
import { ITestSshSchema } from "./ITestSshSchema";

/**
 * Interface representing the values in the custom_properties.yaml file
 * see example_properties.yaml for descriptions and more details
 */
export interface ITestPropertiesSchema {

    zosmf: ITestZosmfSchema;
    datasets: ITestDatasetSchema;
    zosjobs: ITestZosJobsSchema;
    provisioning: ITestProvisioningSchema;
    tso: ITestTsoSchema;
    console: ITestConsoleSchema;
    workflows: ITestWorkflowsSchema;
    unix: ITestUnixSchema;
    ssh: ITestSshSchema;
}
