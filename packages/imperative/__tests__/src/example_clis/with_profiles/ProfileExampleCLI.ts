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

import { Imperative } from "../../../../src/imperative";

// Reuse "with_bin_package" configuration without bin script
Imperative.init({configurationModule: __dirname + "/../with_bin_package/ProfileBinExampleConfiguration.ts"}).then(() => {
    Imperative.parse();
}).catch((error) => {
    process.stderr.write(`An error occurred parsing or initing: ${error.message}`);
});
