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
import { ITestTsoSchema } from "./ITestTsoSchema";
import { ITestSshSchema } from "./ITestSshSchema";
import { ITestDatasetSchema } from "./ITestDatasetSchema";
import { ITestUnixSchema } from "./ITestUnixSchema";
import { ITestConsoleSchema } from "./ITestConsoleSchema";

export interface ITestSystemSchema {
    zosmf?: ITestZosmfSchema;
    tso?: ITestTsoSchema;
    ssh?: ITestSshSchema;
    datasets?: ITestDatasetSchema;
    unix?: ITestUnixSchema;
    console?: ITestConsoleSchema;
}
