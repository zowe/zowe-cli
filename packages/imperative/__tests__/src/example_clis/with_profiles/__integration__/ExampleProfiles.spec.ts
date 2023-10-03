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

    const config: IImperativeConfig = require(__dirname + "/../ProfileExampleConfiguration");
    it("We should be able to get --help for our example CLI", function () {
        T.findExpectedOutputInCommand(__dirname + "/../ProfileExampleCLI", ["--help"],
            [config.productDisplayName, "log"], "stdout", true,
            this, T.CMD_TYPE.INTERACTIVE);
    });
});
