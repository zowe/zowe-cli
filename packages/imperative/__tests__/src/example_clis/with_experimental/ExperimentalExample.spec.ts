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
import * as T from "../../TestUtil";
import { ExperimentalExampleConstants } from "./ExperimentalExampleConstants";
import { Constants } from "../../../../src/constants";

describe("We should provide the ability to set commands as experimental", function () {
    const cliBin = __dirname + "/ExperimentalExampleCLI.ts";
    const cliBinNoCustomHelp = __dirname + "/ExperimentalExampleCLINoCustomHelpText.ts";
    const config: IImperativeConfig = require(__dirname + "/ExperimentalExampleConfiguration");

    it("should show the text 'experimental' when listing experimental commands",
        function () {
            T.findExpectedOutputInCommand(cliBin,
                ["--help"], ["(experimental) this command is experimental"],
                "stdout", true, this);
        });

    it("should mark parent commands with all experimental children as experimental",
        function () {
            T.findExpectedOutputInCommand(cliBin,
                ["--help"], ["(experimental) has experimental children"],
                "stdout", true, this);
        });

    it("should show the configured experimental command help text under an experimental command",
        function () {
            T.findExpectedOutputInCommand(cliBin,
                ["is-experimental", "--help"],
                [ExperimentalExampleConstants.EXPERIMENTAL_DESCRIPTION],
                "stdout", true, this,
                undefined, {ignoreSpaces: true});
        });

    it("should inherit experimental setting from parent commands to child commands",
        function () {
            T.findExpectedOutputInCommand(cliBin,
                ["experimental-parent", "child", "--help"],
                [ExperimentalExampleConstants.EXPERIMENTAL_DESCRIPTION],
                "stdout", true, this,
                undefined, {ignoreSpaces: true});
        });


    it("should show the default experimental command help text under an experimental command " +
        "if no custom text is configured",
    function () {
        T.findExpectedOutputInCommand(cliBinNoCustomHelp,
            ["is-experimental", "--help"],
            [Constants.DEFAULT_EXPERIMENTAL_COMMAND_EXPLANATION],
            "stdout", true, this,
            undefined, {ignoreSpaces: true});
    });

});
