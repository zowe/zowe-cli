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

function getImperative() {
    try {
        return require("@zowe/imperative");
    } catch (err) {
        if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "MODULE_NOT_FOUND") {
            require("ts-node/register");
            return require(require("path").resolve(__dirname, "../../imperative/src/utilities/src/TextUtils"));
        } else {
            throw err;
        }
    }
}

function printSuccessMessage() {
    const imperative = getImperative();

    const installSuccessMessage = "Zowe CLI has been successfully installed. " +
    "You can safely ignore all non-plug-in related errors and warnings. " +
    "Please check above for any plug-in related issues.";

    const table = imperative.TextUtils.getTable([[installSuccessMessage]], "yellow", undefined, false, true, true);
    console.log("\n" + table + "\n");
}

printSuccessMessage();
