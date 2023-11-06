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

/* eslint-disable jest/expect-expect */
import { isNullOrUndefined } from "util";
import { CommandProcessor, ICommandDefinition, ICommandResponse } from "../../../../../src/cmd/index";
import { ValidationTestCommand } from "../ValidationTestCommand";
import { Constants } from "../../../../../src/constants/index";
import { Imperative } from "../../../../../src/imperative/src/Imperative";
import { TestLogger } from "../../../../src/TestLogger";
import { createUniqueTestDataDir, rimraf } from "../../../TestUtil";
import { AbstractHelpGenerator } from "../../../../../src/cmd/src/help/abstract/AbstractHelpGenerator";
import { DefaultHelpGenerator } from "../../../../../src/cmd/src/help/DefaultHelpGenerator";
import { BasicProfileManagerFactory, IProfileTypeConfiguration } from "../../../../../src/index";

const ENV_PREFIX = "INTEGRATION_TEST";
const TEST_HOME = createUniqueTestDataDir();
const logger = TestLogger.getTestLogger();
const DUMMY_PROFILE_TYPE_CONFIG: IProfileTypeConfiguration[] = [
    {
        type: "banana",
        schema: {
            title: "The simple banana configuration",
            description: "The simple banana configuration",
            type: "object",
            properties: {
                description: {
                    type: "string"
                },
                bundle: {
                    type: "boolean"
                }
            }
        }
    }
];
describe("Imperative should provide advanced syntax validation rules", function () {
    const home = __dirname + "/validationtests";
    const mainModule = process.mainModule;

    beforeAll(function () {
        (process.mainModule as any) = {
            filename: __filename
        };
        return Imperative.init({
            productDisplayName: "Validation tests",
            definitions: [{
                name: "banana",
                type: "command",
                description: "oooohh banana"
            }],
            defaultHome: home,
        });
    });
    afterAll(() => {
        process.mainModule = mainModule;
        rimraf(home);
    });
    describe("Advanced syntax validation for commands using a test command", function () {
        const yargs = require("yargs");
        const alwaysRequired = "--always-required-boolean --always-required-string blah ";
        const minValidOptions = "--option-to-specify-1 --implied-by-absence " +
            alwaysRequired;

        function tryOptions(optionString: string, shouldSucceed: boolean, expectedText?: string[]) {
            const options = require("yargs-parser")(optionString);
            options._ = ["test", "validation-test"].concat(options._); // fake out command structure
            options[Constants.JSON_OPTION] = true;
            const fakeParent: ICommandDefinition = {
                name: undefined,
                description: "", type: "group",
                children: [ValidationTestCommand]
            };
            const helpGenerator: AbstractHelpGenerator = new DefaultHelpGenerator({
                primaryHighlightColor: "yellow",
                produceMarkdown: false,
                rootCommandName: "dummy"
            }, {
                fullCommandTree: fakeParent,
                commandDefinition: ValidationTestCommand
            });
            return new CommandProcessor(
                {
                    envVariablePrefix: ENV_PREFIX,
                    definition: ValidationTestCommand,
                    fullDefinition: fakeParent,
                    helpGenerator,
                    profileManagerFactory: new BasicProfileManagerFactory(TEST_HOME, DUMMY_PROFILE_TYPE_CONFIG),
                    rootCommandName: "fakeroot",
                    commandLine: "fakecommand",
                    promptPhrase: "fakefakefake"
                })
                .invoke({arguments: options, responseFormat: "json", silent: true}).then(
                    (completedResponse: ICommandResponse) => {
                        logger.debug(JSON.stringify(completedResponse));
                        if (shouldSucceed) {
                            expect(completedResponse.success).toEqual(true);
                        } else {
                            expect(completedResponse.success).toEqual(false);
                        }
                        if (!isNullOrUndefined(expectedText) && expectedText.length > 0) {
                            (completedResponse.stderr as any) = completedResponse.stderr.toString();
                            (completedResponse.stdout as any) = completedResponse.stdout.toString();
                            for (const text of expectedText) {
                                expect(JSON.stringify(completedResponse).toLowerCase()).toContain(text.toLowerCase());
                            }
                        }
                        // done();
                    });
        }

        it("We should be able to correctly specify the options for our test command without an error",
            function () {
                return tryOptions.bind(this, minValidOptions, true, ["passed"])();
            });
        it("If we specify an unknown positional, the command should fail",
            function () {
                return tryOptions.bind(this, minValidOptions + "blah1", false, ["blah1"])();
            });
        it("If we specify multiple unknown positionals, the command should fail",
            function () {
                return tryOptions.bind(this, minValidOptions + "blah1 blah2 blah3", false,
                    ["blah1", "blah2", "blah3"])();
            });
        it("If we omit a required boolean option, the command should fail",
            function () {
                return tryOptions.bind(this, "--option-to-specify-1 --implied-by-absence --always-required-string blah",
                    false, undefined, ["--always-required-boolean", "must specify"])();
            });
        it("If we omit a required string option, the command should fail",
            function () {
                return tryOptions.bind(this, "--option-to-specify-1 --implied-by-absence --always-required-boolean",
                    false, ["--always-required-string", "missing required option"])();
            });
        it("If we specify the --name of a required string option, but no value, the command should fail",
            function () {
                return tryOptions.bind(this, "--option-to-specify-1 --always-required-string --implied-by-absence --always-required-boolean ",
                    false, ["--always-required-string", "no value specified for option"])();
            });
        it("If we specify a conflicting option, the command should fail.",
            function () {
                return tryOptions.bind(this, "--option-to-specify-1 --conflicts-with-1 --absence-implies "
                    + alwaysRequired, false, ["--conflicts-with-1", "mutually exclusive"])();
            });
        it("If we specify an option that implies another option, but omit the implied option," +
            " the command should fail. ",
        function () {
            return tryOptions.bind(this, "--option-to-specify-2 --absence-implies " + alwaysRequired,
                false, ["must also specify", "--implied-by-2"])();
        });
        it("If we specify an option that implies another option, and include the implied option," +
            " the command should succeed. ",
        function () {
            return tryOptions.bind(this, "--option-to-specify-2 --implied-by-2 --absence-implies " + alwaysRequired,
                true, ["passed"])();
        });
        it("If we specify an option that has a set of allowable string values," +
            " but specify a value that doesn't match any of the values, the command should fail ",
        function () {
            return tryOptions.bind(this, "--option-to-specify-3 badvalue --absence-implies " +
                    alwaysRequired, false, ["must match"])();
        });
        it("If we specify an option that has a set of allowable string values," +
            " but specify a value that partially match one of the values, the command should fail ",
        function () {
            return Promise.all([
                tryOptions.bind(this, "--option-to-specify-3 aallowableAA --absence-implies " +
                        alwaysRequired, false, ["must match"])(),
                tryOptions.bind(this, "--option-to-specify-3 allowableC$C --absence-implies " +
                        alwaysRequired, false, ["must match"])()
            ]);
        });
        it("If we specify an option that has a set of allowable string values," +
            " but specify a value that is the regular expression itself, the command should fail ",
        function () {
            return Promise.all([
                tryOptions.bind(this, "--option-to-specify-3 ^allowableA$ --absence-implies " +
                        alwaysRequired, false, ["must match"])(),
                tryOptions.bind(this, "--option-to-specify-3 ^allowbaleC\\$ --absence-implies " +
                        alwaysRequired, false, ["must match"])()
            ]);
        });
        it("If we specify an option that has a set of allowable string values," +
            " and specify a value that matches one of the allowable values, the command should succeed ",
        function () {
            return Promise.all([
                tryOptions.bind(this, "--option-to-specify-3 allowableA --absence-implies " +
                        alwaysRequired, true, [])(),
                tryOptions.bind(this, "--option-to-specify-3 allowableC$ --absence-implies " +
                        alwaysRequired, true, [])()
            ]);
        });
        it("If we specify an option whose type is array and which has a set of allowable string values," +
            " and specify multiple values each of which matches one of the allowable values," +
            " the command should succeed ",
        function() {
            return tryOptions.bind(this, "--option-to-specify-4 allowableA --option-to-specify-4 allowableB " +
                    "--absence-implies " + alwaysRequired, true, [])();
        });
        it("If we specify an option whose type is array and which has a set of allowable string values," +
            " and specify multiple values one of which doesn't match one of the allowable values," +
            " the command should fail ",
        function() {
            return tryOptions.bind(this, "--option-to-specify-4 allowableA --option-to-specify-4 notAllowable " +
                    "--absence-implies " + alwaysRequired, false, ["must match"])();
        });
        it("If we don't specify an option, and the absence of that option implies " +
            "the presence of another option, and we omit that option as well, the command should fail ",
        function () {
            return tryOptions.bind(this, "--option-to-specify-1 " + alwaysRequired, false,
                ["--implied-by-absence"])();
        });
        it("If we don't specify an option, and the absence of that option implies " +
            "the presence of another option, but we specify that implied option, the command should succeed ",
        function () {
            return tryOptions.bind(this, "--option-to-specify-1 --implied-by-absence " + alwaysRequired,
                true, ["passed"])();
        });
        it("If there is an option that should be numerical, but a non-numeric option is specified, " +
            "the command should fail  ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--should-be-number banana", false,
                ["banana", "numeric"])();
        });
        it("If there is an option that should be numerical, and we specify a number, " +
            "the command should succeed  ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--should-be-number 123", true, ["pass"])();
        });
        it("If there is an option for which specifying a certain value implies another option, " +
            "if we omit the implied option, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--dog-type \"great pyrenees\"", false, ["--fluffy", "great"])();
        });
        it("If there is an option for which specifying a certain value implies another option, " +
            "if we specify the implied option, the command should succeed ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--fluffy very --dog-type \"great pyrenees\" ",
                true, ["passed"])();
        });

        it("If there is an option with a max length of eight characters and a minimum of two, " +
            " and we specify a value that's one character long, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--length-range j",
                false, ["the length must be between"])();
        });

        it("If there is an option with a max length of eight characters and a minimum of two, " +
            " and we specify a value that's exactly two characters long, the command should succeed ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--length-range ju ",
                true, ["passed"])();
        });

        it("If there is an option with a max length of eight characters and a minimum of two, " +
            " and we specify a value that's exactly eight characters long, the command should succeed ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--length-range justcool ",
                true, ["passed"])();
        });

        it("If there is an option with a max length of eight characters and a minimum of two, " +
            " and we specify a value that's nine characters long, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--length-range justcooly ",
                false, ["the length must be between"])();
        });

        it("If there is an option with a max value of 12 and a minimum of 1, " +
            " and we specify 0, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--eggs-to-eat 0",
                false, ["between"])();
        });

        it("If there is an option with a max value of 12 and a minimum of 1, " +
            " and we specify 1, the command should succeed ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--eggs-to-eat 1",
                true, ["passed"])();
        });

        it("If there is an option with a max value of 12 and a minimum of 1, " +
            " and we specify 1 long, the command should succeed ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--eggs-to-eat 12",
                true, ["passed"])();
        });

        it("If there is an option with a max value of 12 and a minimum of 1, " +
            " and we specify 15, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--eggs-to-eat 15 ",
                false, ["between"])();
        });

        it("If we specify an option whose type is array and do not specify arrayAllowDuplicate," +
            " and specify an array containing duplicate values," +
            " the command should succeed ",
        function () {
            return tryOptions.bind(this,"--option-to-specify-4 allowableA --option-to-specify-4 allowableA " +
                     "--absence-implies " + alwaysRequired, true, [])();
        });

        it("If we specify an option whose type is array and arrayAllowDuplicate is true," +
            " and specify an array containing duplicate values," +
            " the command should succeed ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--array-allow-duplicate value1 --array-allow-duplicate value1 ",
                true, [])();
        });

        it("If we specify an option whose type is array and arrayAllowDuplicate is false," +
            " and specify an array containing duplicate values," +
            " the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--array-not-allow-duplicate value1 --array-not-allow-duplicate value1 " +
                     "--array-not-allow-duplicate value2", false, ["Duplicate value", "value1"])();
        });

        it("If we specify an option whose type is array and arrayAllowDuplicate is false," +
            " and specify an array containing multiple duplicate values," +
            " the command should fail and the error message contains all duplicate values ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--array-not-allow-duplicate value1 --array-not-allow-duplicate value1 " +
                     "--array-not-allow-duplicate value2 --array-not-allow-duplicate value2",
                false, ["Duplicate value", "value1", "value2"])();
        });

        it("If we specify an option whose type is array and arrayAllowDuplicate is false," +
            " and specify an array containing no duplicate values," +
            " the command should succeed ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--array-not-allow-duplicate value1 --array-not-allow-duplicate value2",
                true, [])();
        });

        it("If there is an option that implies at least one of a set of other options, " +
            "if we specify that option but omit all of the implications, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--implies-one-of",
                false, ["at least one"])();
        });

        it("If there is an option that implies at least one of a set of other options, " +
            "if we specify that option and satisfy the implication, the command should succeed ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--implies-one-of --fluffy very",
                true, ["passed"])();
        });

        it("If there is an option with multiple conflicts, " +
            "if we specify the first of the conflicting options, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--conflicts-with-multiple --conflicted-1",
                false, ["mutually"])();
        });

        it("If there is an option with multiple conflicts, " +
            "if we specify two of the conflicting options, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--conflicts-with-multiple --conflicted-1 --conflicted-2",
                false, ["mutually"])();
        });

        it("If there is an option with multiple conflicts, " +
            "if we specify all of the conflicting options, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--conflicts-with-multiple --conflicted-1 --conflicted-2 --conflicted-3",
                false, ["mutually"])();
        });

        it("If there is an option with multiple conflicts, " +
            "if we specify the last of the conflicting options, the command should fail ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--conflicts-with-multiple --conflicted-3",
                false, ["mutually"])();
        });

        it("If we specify a string type option multiple times,  but  " +
            "otherwise have a correct command ",
        function () {
            return tryOptions.bind(this,
                minValidOptions + "--always-required-string hello",
                false, ["multiple", "--always-required-string"])();
        });
        describe("We should be able to validate array positional arguments", function () {
            const numberCommand: ICommandDefinition = {
                name: "gimme-array", aliases: [],
                description: "specify an array",
                positionals: [
                    {
                        name: "my-array...",
                        required: true,
                        type: "string",
                        description: "gimme those strings"
                    }
                ],
                type: "command",
                handler: __dirname + "/../ValidationTestCommandHandler"
            };
            const fakeParent: ICommandDefinition = {
                name: undefined,
                description: "", type: "group",
                children: [ValidationTestCommand]
            };
            it("If we have a command with a required string array type argument, we should" +
                " successfully validate when we specify a value for the array", function () {
                const helpGenerator: AbstractHelpGenerator = new DefaultHelpGenerator({
                    primaryHighlightColor: "yellow",
                    produceMarkdown: false,
                    rootCommandName: "dummy"
                }, {
                    fullCommandTree: fakeParent,
                    commandDefinition: numberCommand
                });
                return new CommandProcessor({
                    envVariablePrefix: ENV_PREFIX,
                    definition: numberCommand,
                    fullDefinition: fakeParent,
                    helpGenerator,
                    profileManagerFactory: new BasicProfileManagerFactory(TEST_HOME,
                        DUMMY_PROFILE_TYPE_CONFIG),
                    rootCommandName: "fake",
                    commandLine: "fake",
                    promptPhrase: "fakefakefake"
                }).invoke({
                    arguments: {"_": ["banana"], "$0": "", "my-array": ["banana"]},
                    silent: true,
                    responseFormat: "json"
                }).then(
                    (completedResponse: ICommandResponse) => {
                        logger.debug(JSON.stringify(completedResponse));
                        expect(completedResponse.success).toEqual(true);
                    });
            });

            it("If we have a command with a required string array type argument, we should" +
                " fail to validate when we specify no value for the array", function () {
                const helpGenerator: AbstractHelpGenerator = new DefaultHelpGenerator({
                    primaryHighlightColor: "yellow",
                    produceMarkdown: false,
                    rootCommandName: "dummy"
                }, {
                    fullCommandTree: fakeParent,
                    commandDefinition: numberCommand
                });
                return new CommandProcessor({
                    envVariablePrefix: ENV_PREFIX,
                    definition: numberCommand,
                    fullDefinition: fakeParent,
                    helpGenerator,
                    profileManagerFactory: new BasicProfileManagerFactory(TEST_HOME,
                        DUMMY_PROFILE_TYPE_CONFIG),
                    rootCommandName: "fake",
                    commandLine: "fake",
                    promptPhrase: "fakefakefake"
                }).invoke({
                    arguments: {_: [], $0: ""},
                    silent: true,
                    responseFormat: "json"
                }).then(
                    (completedResponse: ICommandResponse) => {
                        // Command should have failed
                        expect(completedResponse.success).toEqual(false);
                        logger.debug(JSON.stringify(completedResponse));
                        expect(completedResponse.stderr.toString()).toContain("my-array");
                    });
            });
        });

        describe("We should be able to validate positional arguments of type 'number'", function () {
            const numberCommand: ICommandDefinition = {
                name: "gimme-number", aliases: [],
                description: "specify a number",
                positionals: [
                    {
                        name: "my-number",
                        required: true,
                        type: "number",
                        description: "please give me a number i love numbers"
                    }
                ],
                type: "command",
                handler: __dirname + "/../ValidationTestCommandHandler"
            };
            const fakeParent: ICommandDefinition = {
                name: undefined,
                description: "", type: "group",
                children: [ValidationTestCommand]
            };
            it("If we have a command with a number-type positional, and we try " +
                "to specify a non-numeric argument, the command should fail", function () {
                const helpGenerator: AbstractHelpGenerator = new DefaultHelpGenerator({
                    primaryHighlightColor: "yellow",
                    produceMarkdown: false,
                    rootCommandName: "dummy"
                }, {
                    fullCommandTree: fakeParent,
                    commandDefinition: numberCommand
                });
                return new CommandProcessor({
                    envVariablePrefix: ENV_PREFIX,
                    definition: numberCommand,
                    fullDefinition: fakeParent,
                    helpGenerator,
                    profileManagerFactory: new BasicProfileManagerFactory(TEST_HOME,
                        DUMMY_PROFILE_TYPE_CONFIG),
                    rootCommandName: "fake",
                    commandLine: "fake",
                    promptPhrase: "dummydummy"
                }).invoke({
                    arguments: {"_": ["banana"], "$0": "", "my-number": "banana"},
                    silent: true,
                    responseFormat: "json"
                }).then(
                    (completedResponse: ICommandResponse) => {
                        // Command should have failed
                        expect(completedResponse.success).toEqual(false);
                        logger.debug(JSON.stringify(completedResponse));
                        expect(JSON.stringify(completedResponse)).toContain("The value must be a number");
                        expect(JSON.stringify(completedResponse)).toContain("banana");
                    });
            });
            it("If we have a command with a number-type positional, and we try " +
                "to specify a numeric argument, the command should succeed", function () {

                const helpGenerator: AbstractHelpGenerator = new DefaultHelpGenerator({
                    primaryHighlightColor: "yellow",
                    produceMarkdown: false,
                    rootCommandName: "dummy"
                }, {
                    fullCommandTree: fakeParent,
                    commandDefinition: numberCommand
                });
                return new CommandProcessor({
                    envVariablePrefix: ENV_PREFIX,
                    definition: numberCommand,
                    fullDefinition: fakeParent,
                    helpGenerator,
                    profileManagerFactory: new BasicProfileManagerFactory(TEST_HOME,
                        DUMMY_PROFILE_TYPE_CONFIG),
                    rootCommandName: "fake",
                    commandLine: "fake",
                    promptPhrase: "fakefakefake"
                }).invoke({
                    arguments: {"_": ["banana"], "$0": "", "my-number": "123546"},
                    silent: true,
                    responseFormat: "json"
                }).then(
                    (completedResponse: ICommandResponse) => {
                        expect(completedResponse.success).toEqual(true);
                        logger.debug(JSON.stringify(completedResponse));
                    });
            });
            it("If we have a command with a number-type positional, and we try " +
                "to specify 0, the command should succeed", function () {

                const helpGenerator: AbstractHelpGenerator = new DefaultHelpGenerator({
                    primaryHighlightColor: "yellow",
                    produceMarkdown: false,
                    rootCommandName: "dummy"
                }, {
                    fullCommandTree: fakeParent,
                    commandDefinition: numberCommand
                });
                return new CommandProcessor({
                    envVariablePrefix: ENV_PREFIX,
                    definition: numberCommand,
                    fullDefinition: fakeParent,
                    helpGenerator,
                    profileManagerFactory: new BasicProfileManagerFactory(TEST_HOME,
                        DUMMY_PROFILE_TYPE_CONFIG),
                    rootCommandName: "fake",
                    commandLine: "fake",
                    promptPhrase: "dummydummy"
                }).invoke({
                    arguments: {"_": ["banana"], "$0": "", "my-number": "0"},
                    silent: true,
                    responseFormat: "json"
                }).then(
                    (completedResponse: ICommandResponse) => {
                        expect(completedResponse.success).toEqual(true);
                        logger.debug(JSON.stringify(completedResponse));
                    });
            });
        });
    });
});
