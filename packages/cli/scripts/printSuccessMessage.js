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

const installSuccessMessage =
    "Zowe CLI has been successfully installed. " +
    "You can safely ignore all non-plug-in related errors and warnings. " +
    "Please check above for any plug-in related issues.";

const Table = require("cli-table3");
const table = new Table({
    chars: {
        top: "═",
        "top-left": "╔",
        "top-right": "╗",
        bottom: "═",
        "bottom-left": "╚",
        "bottom-right": "╝",
        left: "║",
        right: "║",
    },
    colWidths: [require("yargs").terminalWidth() - 8],
    style: { "padding-left": 0, "padding-right": 0, head: [], border: [] },
    wordWrap: true,
});
table.push([installSuccessMessage]);
console.log("\n" + table.toString() + "\n");
