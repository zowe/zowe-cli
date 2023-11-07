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
        T.rimraf(home);
    });
    beforeEach(() => {
        T.rimraf(home); // delete profiles
    });
    afterAll(() => {
        T.rimraf(home);
    });
    it("If we accept the default of auto-generating profile commands, " +
        "commands should be generated for each profile type, " +
        "and able to be invoked with --help", () => {

        T.findExpectedOutputInCommand(cliBin, ["profiles", "--help"], ["create", "set"],
            "stdout", true, this);
        // validate commands have been generated for each type of profile
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", "--help"], [profileTypeA, profileTypeB],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", profileTypeA, "--help"], [profileTypeA],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin, ["profiles", "set", "--help"], [profileTypeA, profileTypeB],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin, ["profiles", "list", "--help"], [profileTypeA, profileTypeB],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin, ["profiles", "delete", "--help"], [profileTypeA, profileTypeB],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin, ["profiles", "update", "--help"], [profileTypeA, profileTypeB],
            "stdout", true, this);
        T.findExpectedOutputInCommand(cliBin, ["profiles", "validate", "--help"], [manyFieldProfile],
            "stdout", true, this);
    });

    it("If we specify updateProfileExamples on our profile configuration, " +
        "our examples should appear in the help text", () => {
        T.findExpectedOutputInCommand(cliBin, ["profiles", "update", "profile-a", "--help"], ["froggy"],
            "stdout", true, this);

    });

    it("If we turn off  auto-generating profile commands, " +
        "commands should NOT be generated for each profile type", () => {
        const cliBinNoCommands = __dirname + "/../ProfileExampleCLINoAutoGen.ts";
        T.findExpectedOutputInCommand(cliBinNoCommands, ["profiles", "--help"],
            ["Command failed due to improper syntax", "Unknown group: profiles"],
            "stderr", false, this);
        // validate commands have been generated for each type of profile
        T.findExpectedOutputInCommand(cliBinNoCommands, ["profiles", "create"],
            ["Command failed due to improper syntax", "Unknown group: profiles"],
            "stderr", false, this);
        T.findExpectedOutputInCommand(cliBinNoCommands, ["profiles", "create", profileTypeA],
            ["Command failed due to improper syntax", "Unknown group: profiles"],
            "stderr", false, this);
        T.findExpectedOutputInCommand(cliBinNoCommands, ["profiles", "set"],
            ["Command failed due to improper syntax", "Unknown group: profiles"],
            "stderr", false, this);
        T.findExpectedOutputInCommand(cliBinNoCommands, ["profiles", "list"],
            ["Command failed due to improper syntax", "Unknown group: profiles"],
            "stderr", false, this);
        T.findExpectedOutputInCommand(cliBinNoCommands, ["profiles", "delete"],
            ["Command failed due to improper syntax", "Unknown group: profiles"],
            "stderr", false, this);
        T.findExpectedOutputInCommand(cliBinNoCommands, ["profiles", "update"],
            ["Command failed due to improper syntax", "Unknown group: profiles"],
            "stderr", false, this);
    });

    it("If we have a profile type defined with a dependent profile, if we specify a non-existent " +
        "profile-a profile, the command should fail", () => {
        T.findExpectedOutputInCommand(cliBin,
            ["profiles", "create", "profile-with-dependency",
                "bad",
                "--profile-a-profile", "fake",
                "--ghost", "lenore"],
            ["fake", "depend"],
            "stderr", false, this, T.CMD_TYPE.ALL, {ignoreCase: true});
    });

    it("If we have a profile type defined with a dependent profile, if we specify a valid " +
        "dependent profile, the command should succeed and we should be able to " +
        "use the profile on a command", () => {
        // basically the simple positive test case for dependent profile creation
        const goodDependency = "good";
        const mainProfileName = "big_profile";
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", profileTypeA, goodDependency, "--animal", "doggy",
        ],
        ["doggy", "success", "numberWithDefault", "8080"], // expect default number value to be filled in
        "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        T.findExpectedOutputInCommand(cliBin,
            ["profiles", "create", "profile-with-dependency",
                mainProfileName,
                "--profile-a-profile", goodDependency,
                "--ghost", "lenore"],
            ["success"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // issue a command that uses the new profile with dependency
        T.findExpectedOutputInCommand(cliBin,
            ["use-dependent-profile"], [], "stdout",
            true, this);
    });

    it("If we create a profile-with-dependencies, and the profile-a dependency is different than the default " +
        "profile-a profile, the default profile-a profile should not be" +
        " loaded when the profile-with-dependencies is used on a command", () => {
        const defaultProfileA = "the_default_a_profile";
        const goodDependency = "good";
        const mainProfileName = "big_profile";
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", profileTypeA, defaultProfileA, "--animal", "emu"],
            ["emu", "success"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", profileTypeA, goodDependency, "--animal", "doggy",
        ],
        ["doggy", "success"],
        "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        T.findExpectedOutputInCommand(cliBin,
            ["profiles", "create", "profile-with-dependency",
                mainProfileName,
                "--profile-a-profile", goodDependency,
                "--ghost", "lenore"],
            ["success"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // issue a command that uses the new profile with dependency
        const useProfileOutput = T.findExpectedOutputInCommand(cliBin,
            ["use-dependent-profile"], [], "stdout",
            true, this);
        // default profile shouldn't show up in output
        expect(useProfileOutput.stdout.toString().indexOf(defaultProfileA)).toEqual(-1);
    });

    it("If we omit a required option definition on a generate create profile command," +
        "defined in the profile schema, " +
        "we should get a syntax error", () => {
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", profileTypeA, "bad"],
            ["animal"],
            "stderr", false, this, T.CMD_TYPE.JSON, {ignoreCase: true});
    });

    it("We should be able to run through all auto-generated profile commands for two types of profiles", () => {
        const firstProfile = "first";
        const secondProfile = "second";

        // create two A profiles
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", profileTypeA, firstProfile, "--animal", "doggy"],
            ["doggy", "success"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create",
            profileTypeA, secondProfile, "--animal", "sloth"],
        ["sloth", "success"],
        "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // Create two B profiles
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", profileTypeB, firstProfile, "--bumblebee", "dumbledore"],
            ["dumbledore", "success"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", profileTypeB, secondProfile, "--bumblebee", "jerry"],
            ["jerry", "success"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // update second B profile
        T.findExpectedOutputInCommand(cliBin, ["profiles", "update", profileTypeB, secondProfile, "--bumblebee", "seinfeld"],
            ["seinfeld", "success"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // list A type profiles
        T.findExpectedOutputInCommand(cliBin, ["profiles", "list", profileTypeA],
            [firstProfile, secondProfile],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // list B type profiles
        T.findExpectedOutputInCommand(cliBin, ["profiles", "list", profileTypeB],
            [firstProfile, secondProfile],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // use both A profiles
        T.findExpectedOutputInCommand(cliBin, ["use-profile-a"],
            [], // default A profile
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        T.findExpectedOutputInCommand(cliBin, ["use-profile-a", "--profile-a-profile", secondProfile],
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // use both B profiles
        T.findExpectedOutputInCommand(cliBin, ["use-profile-b"], // default B profile
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        T.findExpectedOutputInCommand(cliBin, ["use-profile-b", "--profile-b-profile", secondProfile],
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // set the default A profile to the second and make sure it is used
        T.findExpectedOutputInCommand(cliBin, ["profiles", "set", profileTypeA, secondProfile], // default B profile
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        T.findExpectedOutputInCommand(cliBin, ["use-profile-a"], // second profile should be used
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // set the default B profile to the second and make sure it is used
        T.findExpectedOutputInCommand(cliBin, ["profiles", "set", profileTypeB, secondProfile], // default B profile
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        T.findExpectedOutputInCommand(cliBin, ["use-profile-b"], // second profile should be used
            [],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        // delete the profiles
        T.findExpectedOutputInCommand(cliBin, ["profiles", "delete", profileTypeA, firstProfile, "--force"],
            ["success", "delete", firstProfile], "stdout",
            true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        T.findExpectedOutputInCommand(cliBin, ["profiles", "delete", profileTypeB, secondProfile, "--force"],
            ["success", "delete", secondProfile], "stdout",
            true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
    });

    it("should not fail a command where the profile is listed as optional and not specified", () => {
        // Optional profiles shouldn't cause a handler or other failure
        const output = T.findExpectedOutputInCommand(cliBin, ["optional-profile-c"], // second profile should be used
            ["Profile Cs loaded: undefined"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
        expect(output.stderr).toEqual("");
    });

    it("If we update an existing profile, the contents of the old profile should be merged with teh", () => {
        const profileName = "merge_me";
        const oldTea = "earl_grey";
        const oldSoda = "diet_coke";
        const oldWater = "dirty";

        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", manyFieldProfile, profileName,
            "--tea", oldTea, "--soda", oldSoda, "--water", oldWater],
        [oldSoda, oldWater, oldTea],
        "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        const newWater = "clean";
        T.findExpectedOutputInCommand(cliBin, ["profiles", "update", manyFieldProfile, profileName,
            "--water", newWater],
        [oldSoda, newWater, oldTea],
        "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        T.findExpectedOutputInCommand(cliBin, ["profiles", "list", manyFieldProfile, "--show-contents"],
            [oldSoda, newWater, oldTea],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
    });

    it("should contain examples specified on profile config in the help text", () => {
        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", profileTypeA, "--help"],
            ["Examples", "--animal doggy"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});
    });

    it("should be able to validate a many-field-profile with an auto generated validate command", () => {
        const profileName = "validate_me";
        const tea = "earl_grey";
        const soda = "diet_coke";
        const water = "dirty";

        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", manyFieldProfile, profileName,
            "--tea", tea, "--soda", soda, "--water", water],
        [soda, water, tea],
        "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        T.findExpectedOutputInCommand(cliBin, ["profiles", "validate", manyFieldProfile, profileName],
            ["perfect", profileName, "many-field-profile"],
            "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

    });

    it("should not print output more than once if a progress bar is used in a profiles validate command", () => {
        const profileName = "validate_me";
        const tea = "earl_grey";
        const soda = "diet_coke";
        const water = "dirty";

        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", manyFieldProfile, profileName,
            "--tea", tea, "--soda", soda, "--water", water],
        [soda, water, tea],
        "stdout", true, this, T.CMD_TYPE.INTERACTIVE, {ignoreCase: true});

        const output = T.executeTestCLICommand(cliBin, this, ["profiles", "validate", manyFieldProfile, profileName]);
        expect(output.status).toEqual(0);
        const stdout = output.stdout.toString();
        // profile summary should only appear once
        expect(stdout.match(/PROFILE SUMMARY/gi).length).toEqual(1);
        //
    });

    it("should be fail to validate an invalid many-fields-profile", () => {
        const profileName = "validate_me";
        const tea = "not_earl_grey";
        const soda = "diet_coke";
        const water = "dirty";

        T.findExpectedOutputInCommand(cliBin, ["profiles", "create", manyFieldProfile, profileName,
            "--tea", tea, "--soda", soda, "--water", water],
        [soda, water, tea],
        "stdout", true, this, T.CMD_TYPE.JSON, {ignoreCase: true});

        T.findExpectedOutputInCommand(cliBin, ["profiles", "validate", manyFieldProfile, profileName],
            ["failed"],
            "stdout", false, this, T.CMD_TYPE.JSON, {ignoreCase: true});

    });
});
