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

import * as stream from "stream";
import { CliUtils } from "../src/CliUtils";
import { CommandProfiles, ICommandOptionDefinition } from "../../cmd";
import { IProfile } from "../../profiles";
import { ImperativeError } from "../../error";
import * as prompt from "readline-sync";

jest.mock("readline-sync");

const TEST_PREFIX = "TEST_CLI_PREFIX";
const boolEnv = TEST_PREFIX + "_OPT_FAKE_BOOL_OPT";
const stringEnv = TEST_PREFIX + "_OPT_FAKE_STRING_OPT";
const stringAliasEnv = TEST_PREFIX + "_OPT_FAKE_STRING_OPT_WITH_ALIASES";
const numberEnv = TEST_PREFIX + "_OPT_FAKE_NUMBER_OPT";
const arrayEnv = TEST_PREFIX + "_OPT_FAKE_ARRAY_OPT";

describe("CliUtils", () => {
    describe("extractEnvForOptions", () => {

        afterEach(() => {
            delete process.env[boolEnv];
            delete process.env[stringEnv];
            delete process.env[numberEnv];
            delete process.env[stringAliasEnv];
            delete process.env[arrayEnv];
        });

        const FAKE_OPTS: ICommandOptionDefinition[] = [{
            name: "fake-array-opt",
            description: "a fake opt",
            type: "array"
        }, {
            name: "fake-string-opt",
            description: "a fake opt",
            type: "string"
        }, {
            name: "fake-string-opt-with-aliases",
            description: "a fake opt",
            type: "string",
            aliases: ["f"]
        }, {
            name: "fake-bool-opt",
            description: "a fake opt",
            type: "boolean"
        }, {
            name: "fake-number-opt",
            description: "a fake opt",
            type: "number"
        }];

        it("should accept the env prefix and options array and return an args object", () => {
            process.env[stringEnv] = "a test string set via env var";
            const args = CliUtils.extractEnvForOptions(TEST_PREFIX, FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should accept the env prefix and options array and return an args object with aliases set", () => {
            process.env[stringAliasEnv] = "a test string set via env var";
            const args = CliUtils.extractEnvForOptions(TEST_PREFIX, FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should transform the env var value to an array if the type is array", () => {
            process.env[arrayEnv] = "'value 1' 'value \\' 2' test1 test2";
            const args = CliUtils.extractEnvForOptions(TEST_PREFIX, FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should transform the env var string to a boolean if the option type is boolean", () => {
            process.env[boolEnv] = "true";
            const args = CliUtils.extractEnvForOptions(TEST_PREFIX, FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should transform the env var string to a boolean (false) if the option type is boolean", () => {
            process.env[boolEnv] = "false";
            const args = CliUtils.extractEnvForOptions(TEST_PREFIX, FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should not transform the env var string to a boolean if the value is not true/false (results in a syntax error later)", () => {
            process.env[boolEnv] = "not a boolean";
            const args = CliUtils.extractEnvForOptions(TEST_PREFIX, FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should not the env var string to a base 10 number if the option type is number", () => {
            process.env[numberEnv] = "10";
            const args = CliUtils.extractEnvForOptions(TEST_PREFIX, FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should not transform the env var string to a base 10 number if the value isn't a number (results in a syntax error later)", () => {
            process.env[numberEnv] = "not a number";
            const args = CliUtils.extractEnvForOptions(TEST_PREFIX, FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });
    });

    describe("setOptionValue", () => {
        it("should return both the camel and kebab case with the value set", () => {
            const args = CliUtils.setOptionValue("my-opt", [], true);
            expect(args).toMatchSnapshot();
        });

        it("should include aliases in the returned args object", () => {
            const args = CliUtils.setOptionValue("my-opt", ["m", "o"], true);
            expect(args).toMatchSnapshot();
        });

        it("should return just the one property if it cannot be converted to camel/kebab", () => {
            const args = CliUtils.setOptionValue("myopt", [], true);
            expect(args).toMatchSnapshot();
        });
    });

    describe("promptForInput", () => {
        it("should return the mocked value", () => {
            const mockedPromptValue = "My value is here ";
            (prompt as any).question = jest.fn(() => {
                return mockedPromptValue;
            });
            const value = CliUtils.promptForInput("my message goes here:");
            expect(value).toEqual(mockedPromptValue);
        });
    });

    describe("sleep", () => {
        it("should sleep for 1 second", async () => {
            const startTime = Date.now();
            const oneSec = 1000;
            const minElapsedTime = 990; // sometimes the OS returns in slightly less than one second
            await CliUtils.sleep(oneSec);
            const timeDiff = Date.now() - startTime;
            expect(timeDiff).toBeGreaterThanOrEqual(minElapsedTime);
        });
    });

    describe("readPrompt", () => {
        const readline = require("readline");
        const oldCreateInterface = readline.createInterface;
        const mockedAnswer = "User answer";

        beforeEach(() => {
            jest.spyOn(readline, "createInterface").mockImplementationOnce((opts: any) => {
                return oldCreateInterface({
                    ...opts,
                    input: stream.Readable.from(mockedAnswer),
                    output: new stream.PassThrough()
                });
            });
        });

        it("should return the user's answer", async () => {
            const answer = await CliUtils.readPrompt("Question to be asked: ");
            expect(answer).toEqual(mockedAnswer);
        });

        it("should accept a hideText parameter", async () => {
            const answer = await CliUtils.readPrompt("Should we hide your answer: ", { hideText: true });
            expect(answer).toEqual(mockedAnswer);
        });

        it("should accept a secToWait parameter", async () => {
            const secToWait = 15;
            const answer = await CliUtils.readPrompt("Should wait your amount of time: ",
                { hideText: false, secToWait: secToWait }
            );
            expect(answer).toEqual(mockedAnswer);
        });

        it("should limit to a max secToWait", async () => {
            const tooLong = 1000;
            const answer = await CliUtils.readPrompt(
                "Should wait your amount of time: ",
                { hideText: false, secToWait: tooLong }
            );
            expect(answer).toEqual(mockedAnswer);
        });

        it("should accept a maskChar parameter", async () => {
            const answer = await CliUtils.readPrompt("Should we hide your answer: ",
                { hideText: true, maskChar: "*" });
            expect(answer).toEqual(mockedAnswer);
        });
    });

    describe("showMsgWhenDeprecated", () => {
        const notSetYet: string = "not_set_yet";
        let responseErrText: string = notSetYet;

        // create a fake set of command handler parameters
        const handlerParms: any = {
            definition: {
                deprecatedReplacement: "Something must be better"
            },
            positionals: [
                "positional_one",
                "positional_two"
            ],
            response: {
                console: {
                    // any error response is just stored in a variable
                    error: jest.fn((msgText) => {
                        responseErrText = msgText;
                    })
                }
            }
        };

        it("should produce a deprecated message when deprecated", () => {
            responseErrText = notSetYet;
            CliUtils.showMsgWhenDeprecated(handlerParms);
            expect(responseErrText).toEqual("Recommended replacement: " +
                handlerParms.definition.deprecatedReplacement);
        });

        it("should produce a deprecated message with only one positional", () => {
            responseErrText = notSetYet;
            handlerParms.positionals = ["positional_one"];
            CliUtils.showMsgWhenDeprecated(handlerParms);
            expect(responseErrText).toEqual("Recommended replacement: " +
                handlerParms.definition.deprecatedReplacement);
        });

        it("should produce a deprecated message with no positionals", () => {
            responseErrText = notSetYet;
            handlerParms.positionals = [];
            CliUtils.showMsgWhenDeprecated(handlerParms);
            expect(responseErrText).toEqual("Recommended replacement: " +
                handlerParms.definition.deprecatedReplacement);
        });

        it("should not produce a deprecated message when not deprecated", () => {
            responseErrText = notSetYet;
            delete handlerParms.definition.deprecatedReplacement;
            CliUtils.showMsgWhenDeprecated(handlerParms);
            expect(responseErrText).toEqual(notSetYet);
        });
    });

    describe("buildBaseArgs", () => {
        it("should preserve the _ and $0 properties", () => {
            const args = CliUtils.buildBaseArgs({ _: ["cmd1", "cmd2"], $0: "test exe" });
            expect(args).toMatchSnapshot();
        });

        it("should remove properties that are set to undefined", () => {
            const args = CliUtils.buildBaseArgs({ _: ["cmd1", "cmd2"], $0: "test exe", test: undefined });
            expect(args).toMatchSnapshot();
        });

        it("should preserve already set properties (that are not undefined)", () => {
            const args = CliUtils.buildBaseArgs({ _: ["cmd1", "cmd2"], $0: "test exe", test: true });
            expect(args).toMatchSnapshot();
        });
    });

    describe("getOptValueFromProfiles", () => {

        const FAKE_OPTS: ICommandOptionDefinition[] = [{
            name: "fake-string-opt",
            description: "a fake opt",
            type: "string"
        }, {
            name: "nohyphen",
            description: "a fake opt",
            type: "string"
        }, {
            name: "couldBeEither",
            description: "a fake opt",
            type: "string"
        },
        {
            name: "with-alias",
            description: "a fake opt",
            type: "string",
            aliases: ["w"]
        },
        {
            name: "user",
            description: "a fake opt",
            type: "string",
            aliases: ["username"]
        }];

        it("should throw an imperative error if a required profile is not present", () => {
            let error;
            try {
                const args = CliUtils.getOptValueFromProfiles(
                    new CommandProfiles(new Map<string, IProfile[]>()),
                    { required: ["banana"] },
                    FAKE_OPTS);
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error instanceof ImperativeError).toBe(true);
            expect(error.message).toMatchSnapshot();
        });

        it("should return nothing if a profile was optional and not loaded", () => {
            const args = CliUtils.getOptValueFromProfiles(
                new CommandProfiles(new Map<string, IProfile[]>()),
                { optional: ["banana"] },
                FAKE_OPTS);
            expect(Object.keys(args).length).toBe(0);
        });

        it("should return args (from definitions with no hyphen in name) extracted from loaded profile", () => {
            const map = new Map<string, IProfile[]>();
            map.set("banana", [{ type: "banana", name: "fakebanana", nohyphen: "specified in profile" }]);
            const args = CliUtils.getOptValueFromProfiles(
                new CommandProfiles(map),
                { optional: ["banana"] },
                FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should return args (with both cases) extracted from loaded profile, preferring the camel case", () => {
            const map = new Map<string, IProfile[]>();
            map.set("banana", [{
                "type": "banana",
                "name": "fakebanana",
                "couldBeEither": "should be me",
                "could-be-either": "should not be me"
            }]);
            const args = CliUtils.getOptValueFromProfiles(
                new CommandProfiles(map),
                { optional: ["banana"] },
                FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should return args (with both cases) extracted from loaded profile, preferring the kebab case", () => {
            const map = new Map<string, IProfile[]>();
            map.set("banana", [{
                "type": "banana",
                "name": "fakebanana",
                "fakeStringOpt": "should not be me",
                "fake-string-opt": "should be me"
            }]);
            const args = CliUtils.getOptValueFromProfiles(
                new CommandProfiles(map),
                { optional: ["banana"] },
                FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should return args with both cases, if the option is camel and the profile is kebab", () => {
            const map = new Map<string, IProfile[]>();
            map.set("banana", [{
                "type": "banana",
                "name": "fakebanana",
                "could-be-either": "should be me"
            }]);
            const args = CliUtils.getOptValueFromProfiles(
                new CommandProfiles(map),
                { optional: ["banana"] },
                FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should return args with both cases, if the option is kebab and the profile is camel", () => {
            const map = new Map<string, IProfile[]>();
            map.set("banana", [{
                type: "banana",
                name: "fakebanana",
                fakeStringOpt: "should be me"
            }]);
            const args = CliUtils.getOptValueFromProfiles(
                new CommandProfiles(map),
                { optional: ["banana"] },
                FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should return args with aliases if extracted option from a profile", () => {
            const map = new Map<string, IProfile[]>();
            map.set("banana", [{
                type: "banana",
                name: "fakebanana",
                withAlias: "should have 'w' on args object too"
            }]);
            const args = CliUtils.getOptValueFromProfiles(
                new CommandProfiles(map),
                { optional: ["banana"] },
                FAKE_OPTS);
            expect(args).toMatchSnapshot();
        });

        it("should return args if extracted option from a profile is only available as an alias", () => {
            const map = new Map<string, IProfile[]>();
            map.set("banana", [{
                type: "banana",
                name: "fakebanana",
                username: "fake"
            }]);
            const args = CliUtils.getOptValueFromProfiles(
                new CommandProfiles(map),
                { optional: ["banana"] },
                FAKE_OPTS);
            expect(args).toEqual({ user: "fake", username: "fake" });
        });
    });

    it("should be able to produce the --dash-form of any options", () => {
        // correct uses
        expect(CliUtils.getDashFormOfOption("some-option")).toMatchSnapshot();
        expect(CliUtils.getDashFormOfOption("s")).toMatchSnapshot();

        // edge cases (nothing breaks, no error, just tons of dashes)
        expect(CliUtils.getDashFormOfOption("-some-option")).toMatchSnapshot();
        expect(CliUtils.getDashFormOfOption("--some-option")).toMatchSnapshot();
        expect(CliUtils.getDashFormOfOption("-s")).toMatchSnapshot();
        expect(CliUtils.getDashFormOfOption("--s")).toMatchSnapshot();

        // empty cases
        expect(() => {
            CliUtils.getDashFormOfOption("");
        }).toThrowErrorMatchingSnapshot();

    });

    it("should return the proper option format", () => {
        expect(CliUtils.getOptionFormat("hello-world")).toEqual({
            key: "hello-world",
            camelCase: "helloWorld",
            kebabCase: "hello-world"
        });

        expect(CliUtils.getOptionFormat("helloWorld")).toEqual({
            key: "helloWorld",
            camelCase: "helloWorld",
            kebabCase: "hello-world"
        });

        expect(CliUtils.getOptionFormat("hello--------world")).toEqual({
            key: "hello--------world",
            camelCase: "helloWorld",
            kebabCase: "hello-world"
        });

        expect(CliUtils.getOptionFormat("hello-World-")).toEqual({
            key: "hello-World-",
            camelCase: "helloWorld",
            kebabCase: "hello-world"
        });

        expect(CliUtils.getOptionFormat("hello-World-----------")).toEqual({
            key: "hello-World-----------",
            camelCase: "helloWorld",
            kebabCase: "hello-world"
        });
    });

    it("should return environment value for kabab-style option", () => {
        const expectedEnvVarValue = "The value for kabab-style option";
        process.env.MYENVPREFIX_OPT_MY_OPTION = expectedEnvVarValue;

        const recvEnvValue = CliUtils.getEnvValForOption("MYENVPREFIX",
            "my-option"
        );
        expect(recvEnvValue).toEqual(expectedEnvVarValue);
    });

    it("should return environment value for camelCase option", () => {
        const expectedEnvVarValue = "The value for camelCase option";
        process.env.MYENVPREFIX_OPT_MY_OPTION = expectedEnvVarValue;

        const recvEnvValue = CliUtils.getEnvValForOption("MYENVPREFIX",
            "myOption"
        );
        expect(recvEnvValue).toEqual(expectedEnvVarValue);
    });

    it("should not alter the environment prefix", () => {
        const expectedEnvVarValue = "The value for camelCase-kabab prefix";
        process.env["camelCase-kabab-Prefix_OPT_MY_OPTION"] = expectedEnvVarValue;

        const recvEnvValue = CliUtils.getEnvValForOption("camelCase-kabab-Prefix",
            "my-option"
        );
        expect(recvEnvValue).toEqual(expectedEnvVarValue);
    });

    it("should return NULL when environment variable does not exist", () => {
        const recvEnvValue = CliUtils.getEnvValForOption("MYENVPREFIX",
            "not-set-in-env"
        );
        expect(recvEnvValue).toEqual(null);
    });
});
