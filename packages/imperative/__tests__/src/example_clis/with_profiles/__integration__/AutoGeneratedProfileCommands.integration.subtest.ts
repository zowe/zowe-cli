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

import { IImperativeConfig } from "../../../../../src/imperative";
import * as T from "../../../TestUtil";
import * as path from "path";
import * as fs from "fs";

describe("We should provide auto-generated profile commands for convenience, " +
    "so that Imperative-based CLIs can let users manage configuration profiles", () => {
    const cliBin = __dirname + "/../ProfileExampleCLI.ts";
    const config: IImperativeConfig = require(__dirname + "/../ProfileExampleConfiguration");

    const profileTypeA = "profile-a";
    const profileTypeB = "profile-b";

    const manyFieldProfile = "many-field-profile";
    const env = JSON.parse(JSON.stringify(process.env));
    const home = config.defaultHome;

    beforeAll(() => {
        // ensure a clean CLI home directory exists before running our copy_profile script
        T.rimraf(home);
        fs.mkdirSync(home);

        // copy existing profiles into test directory
        const result = T.runCliScript(path.join(__dirname, "__scripts__/copy_auto_gen_profiles.sh"), home);
        expect(result.stderr.toString()).toBe("");
        expect(result.status).toBe(0);
    });

    afterAll(() => {
        T.rimraf(home);
    });

    it("should use a profile with a valid dependent profile", () => {
        const result = T.executeTestCLICommand(cliBin, this, ["use-dependent-profile"]);
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("Loaded profile dependency of type profile-a");
        expect(result.stdout).toContain("Loaded main profile of type profile-with-dependency");
        expect(result.status).toBe(0);
    });

    it("should use a profile with a dependent profile that is not the default for its type", () => {
        // set the default profile for type profile-a
        let result: any = T.runCliScript(path.join(__dirname, "__scripts__/set_default_profile.sh"), home,
            [profileTypeA, "non_existent_default_a_profile"]
        );
        expect(result.stderr.toString()).toBe("");
        expect(result.status).toBe(0);

        // use a profile that has a dependency which is now NOT the default profile for that dependency
        result = T.executeTestCLICommand(cliBin, this, ["use-dependent-profile"]);
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain(`Loaded profile dependency of type ${profileTypeA}`);
        expect(result.stdout).toContain("Loaded main profile of type profile-with-dependency");
        expect(result.status).toBe(0);
    });

    it("should be able to use two types of profiles", () => {
        const firstProfile = "first";
        const secondProfile = "second";

        // set the default profile for type profile-a
        let result: any = T.runCliScript(path.join(__dirname, "__scripts__/set_default_profile.sh"), home,
            [profileTypeA, firstProfile]
        );
        expect(result.stderr.toString()).toBe("");
        expect(result.status).toBe(0);

        // set the default profile for type profile-b
        result = T.runCliScript(path.join(__dirname, "__scripts__/set_default_profile.sh"), home,
            [profileTypeB, firstProfile]
        );
        expect(result.stderr.toString()).toBe("");
        expect(result.status).toBe(0);

        // use both A profiles
        T.findExpectedOutputInCommand(cliBin, ["use-profile-a"],
            [], // default A profile
            "stdout", true, this, T.CMD_TYPE.JSON, { ignoreCase: true }
        );
        T.findExpectedOutputInCommand(cliBin, ["use-profile-a", "--profile-a-profile", secondProfile],
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, { ignoreCase: true }
        );

        // use both B profiles
        T.findExpectedOutputInCommand(cliBin, ["use-profile-b"], // default B profile
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, { ignoreCase: true }
        );
        T.findExpectedOutputInCommand(cliBin, ["use-profile-b", "--profile-b-profile", secondProfile],
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, { ignoreCase: true }
        );
    });

    it("should not fail a command where the profile is listed as optional and not specified", () => {
        // Optional profiles shouldn't cause a handler or other failure
        const output = T.findExpectedOutputInCommand(cliBin, ["optional-profile-c"], // second profile should be used
            ["Profile Cs loaded: undefined"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        expect(output.stderr).toEqual("");
    });
});
