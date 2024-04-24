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

import * as T from "../../../TestUtil";
import { IImperativeConfig } from "../../../../../src/imperative";

describe("We should provide the ability to create, manage, and use profiles, " +
    "tested through an example CLI", function () {
    const cliBin = __dirname + "/../ProfileExampleCLI.ts";
    const config: IImperativeConfig = require(__dirname + "/../ProfileExampleConfiguration");
    const logFile = config.defaultHome + "/logs/" + config.name + ".log";

    afterEach(function () {
        T.rimraf(logFile);
    });
    it("If we try to issue a 'log messages' command without the --level option, the command should fail", function () {
        T.findExpectedOutputInCommand(cliBin, ["log", "messages"],
            ["level", "syntax"], "stderr", false,
            this, undefined, {ignoreCase: true});
    });

    it("If we issue a 'log messages' command with --level info, we should not see any trace" +
        " or debug messages in the log file ", function () {
        T.findExpectedOutputInCommand(cliBin, ["log", "messages", "--level", "info"],
            ["written"], "stdout", true,
            this, undefined, {ignoreCase: true});
        expect(T.existsSync(logFile)).toEqual(true);
        const logContents = T.readFileSync(logFile).toString();
        expect(logContents.toLowerCase().indexOf("trace")).toEqual(-1); // no trace messages
        expect(logContents.toLowerCase().indexOf("debug")).toEqual(-1); // no debug messages
        expect(logContents).toContain("info");
        expect(logContents).toContain("error");
    });


    it("If we issue a 'log messages' command with --level trace, we should see all" +
        " messages in the log file ", function () {
        T.findExpectedOutputInCommand(cliBin, ["log", "messages", "--level", "trace"],
            ["written"], "stdout", true,
            this, undefined, {ignoreCase: true});
        expect(T.existsSync(logFile)).toEqual(true);
        const logContents = T.readFileSync(logFile).toString();
        expect(logContents).toContain("trace");
        expect(logContents).toContain("debug");
        expect(logContents).toContain("info");
        expect(logContents).toContain("error");
    });

});
