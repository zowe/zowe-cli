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

const { join } = require("path");

try {
    require(join("..", "lib", "index.js"));   
} catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "MODULE_NOT_FOUND") {
        throw new Error(`Unable to find prebuilds for Secrets SDK keyring module: ${err.message}`);
    } else {
        console.error(err.message);
    }
}