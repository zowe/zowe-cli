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

describe("We should provide auto-generated profile commands for convenience, " +
    "so that Imperative-based CLIs can let users manage configuration profiles", () => {
    const cliBin = __dirname + "/../ProfileExampleCLI.ts";

    it("should fail to load a V1 dependent profile", () => {
        const result = T.executeTestCLICommand(cliBin, this, ["use-dependent-profile"]);

        /* Since we no longer read V1 profiles from disk, such an operation will always return an error.
           Note that Zowe client code no longer attempts to do such an operation.
         */
        expect(result.stderr).toContain(
            'Profile of type "profile-with-dependency" does not exist ' +
            'within the loaded profiles for the command and it is marked as required'
        );
        expect(result.status).toBe(1);
    });

    it("should not fail a command where the profile is listed as optional and not specified", () => {
        // Optional profiles shouldn't cause a handler or other failure
        const output = T.findExpectedOutputInCommand(cliBin, ["optional-profile-c"], // second profile should be used
            ["Profile Cs loaded: undefined"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        expect(output.stderr).toEqual("");
    });
});
