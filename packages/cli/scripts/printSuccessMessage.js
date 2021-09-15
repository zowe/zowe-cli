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

function printSuccessMessage() {
    const imperative = require("@zowe/imperative");

    const installSuccessMessage = "Zowe CLI has been successfully installed. \
    You can safely ignore all non-plug-in related errors and warnings. \
    Please check above for any plug-in related issues.";

    const table = imperative.TextUtils.getTable([[installSuccessMessage]], "yellow", undefined, false, true, true);
    console.log("\n" + table);
};

printSuccessMessage();