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

import { IImperativeConfig } from "../../../../src/imperative";

const config: IImperativeConfig = JSON.parse(JSON.stringify(require("./ExperimentalExampleConfiguration")));
// copy the configuration of the other CLI but don't provide a custom experimental command description
delete config.experimentalCommandDescription;
export = config;
