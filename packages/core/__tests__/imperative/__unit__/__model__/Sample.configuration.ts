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

import { IImperativeConfig } from "../../../../src/imperative/doc/IImperativeConfig";
import { homedir } from "os";

const config: IImperativeConfig = {
    productDisplayName: "Zowe",
    commandModuleGlobs: [],
    rootCommandDescription: "Sample",
    defaultHome: homedir(),
    envVariablePrefix: "Sample",
    logging: {
        appLogging: {
            logFile: "fake"
        }
    }
};
module.exports = config;
