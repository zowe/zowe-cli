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

import { IImperativeConfig } from "@zowe/imperative";
import { join } from "path";
import { TestProfileConfig1 } from "./TestProfileConfig1";
import { TestProfileConfig2 } from "./TestProfileConfig2";

const config: IImperativeConfig = {
    definitions: [],
    rootCommandDescription: "Sample command line interface",
    defaultHome: join(__dirname, "../../../../../__results__/.pluginstest"),
    envVariablePrefix: "PLUGINS_TEST",
    // defaultHome: createUniqueTestDataDir(),
    productDisplayName: "Test CLI for Plugins",
    name: "plugins_test",
    profiles: [TestProfileConfig1, TestProfileConfig2]
};

export = config;
