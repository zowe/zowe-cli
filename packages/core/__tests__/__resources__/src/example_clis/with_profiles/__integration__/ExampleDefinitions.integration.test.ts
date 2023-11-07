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

import { IImperativeConfig } from "../../../../../../src/imperative";
import * as T from "../../../TestUtil";

describe("We should provide the ability to define commands through Javascript objects passed through the config " +
    "or globs that match modules locally, " +
    "tested through an example CLI", function () {
    const cliBin = __dirname + "/../ProfileExampleCLI.ts";
    const config: IImperativeConfig = require(__dirname + "/../ProfileExampleConfiguration");

    it("All commands defined through module globs should be accurately defined, " +
        "and a definition module in the same directory that does not ",
    function () {
        // root level help should contain the correct registered commands
        T.findExpectedOutputInCommand(cliBin,
            ["--help"], ["ape", "bat", "cat", "dog"],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin,
            ["ape"], ["grape"],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin,
            ["bat"], ["rat"],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin,
            ["cat"], ["splat"],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin,
            ["dog"], ["log"],
            "stdout", true, this);
        // make sure the file that doesn't match the glob is not registered
        T.findExpectedOutputInCommand(cliBin,
            ["do-not-include"], ["unknown"],
            "stderr", false, this,
            undefined, {ignoreCase: true});
    });

});
