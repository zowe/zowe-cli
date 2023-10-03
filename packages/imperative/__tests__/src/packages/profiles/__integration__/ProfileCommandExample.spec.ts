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
import * as yargs from "yargs";
import { Constants } from "../../../../../src/constants";
import { CommandProcessor, ICommandDefinition, ICommandProfileTypeConfiguration, ICommandResponse } from "../../../../../src/cmd";
import { isNullOrUndefined } from "util";
import { TestLogger } from "../../../../src/TestLogger";
import { AbstractHelpGenerator } from "../../../../../src/cmd/src/help/abstract/AbstractHelpGenerator";
import { DefaultHelpGenerator } from "../../../../../src/cmd/src/help/DefaultHelpGenerator";
import { BasicProfileManagerFactory } from "../../../../../src/index";

const logger = TestLogger.getTestLogger();
const PROFILE_CONFIGURATIONS: ICommandProfileTypeConfiguration[] = [{
    type: "banana",
    schema: {
        type: "object",
        title: "The Banana command profile schema",
        description: "The Banana command profile schema",
        properties: {
            age: {
                optionDefinition: {
                    description: "The age of the Banana",
                    type: "number",
                    name: "age", aliases: ["a"],
                    required: true
                },
                type: "number",
            },
        },
        required: ["age"]
    }
}];
const SAMPLE_CONFIG: IImperativeConfig = {
    definitions: [
        {
            name: "profile",
            type: "command",
            options: [],
            profile: {
                required: ["banana"]
            },
            description: "my command",
            handler: __dirname + "/handler/SampleHandler"
        }
    ],
    productDisplayName: "My product (packagejson)",
    defaultHome: T.TEST_HOME,
    rootCommandDescription: "My Product CLI",
    profiles: PROFILE_CONFIGURATIONS
};

describe("Imperative should allow CLI implementations to configure their own profiles and types", function () {

    /**
     * Clean up the home directory before and after each test.
     */
    beforeAll(function () {
        T.rimraf(T.TEST_HOME);
        // return Imperative.init(SAMPLE_CONFIG).then(() => {
        //     Imperative.api.profileManager("banana").createProfile({name: "legit", age: BANANA_AGE},
        //         true, true,
        //         (error: Error, filePath: string, overwritten: boolean) => {
        //             expect(error, "Should not get error for valid profile:" + T.inspect(error)).to.not.exist;
        //         });
        // });
    });
    afterAll(function () {
        T.rimraf(T.TEST_HOME);
    });

    function issueCommand(optionString: string, shouldSucceed: boolean, expectedText?: string[]) {
        const options = yargs.parse(optionString);
        // options._ = ["test", "validation-test"].concat(options._); // fake out command structure
        options[Constants.JSON_OPTION] = true;
        const fakeParent: ICommandDefinition = {
            name: undefined,
            description: "", type: "group",
            children: [SAMPLE_CONFIG.definitions[0]]
        };
        const helpGenerator: AbstractHelpGenerator = new DefaultHelpGenerator({
            primaryHighlightColor: "yellow",
            produceMarkdown: false,
            rootCommandName: "dummy"
        }, {
            fullCommandTree: fakeParent,
            commandDefinition: SAMPLE_CONFIG.definitions[0]
        });
        return new CommandProcessor(SAMPLE_CONFIG.definitions[0], fakeParent,
            helpGenerator, new BasicProfileManagerFactory(T.createUniqueTestDataDir(),
                PROFILE_CONFIGURATIONS)).invoke({arguments: options, responseFormat: "json"}).then(
            (completedResponse: ICommandResponse) => {
                logger.debug(JSON.stringify(completedResponse));
                if (shouldSucceed) {
                    // Command should have succeeded
                    expect(completedResponse.success).toEqual(true);
                } else {
                    // "Command should have failed"
                    expect(completedResponse.success).toEqual(false);
                }
                if (!isNullOrUndefined(expectedText) && expectedText.length > 0) {
                    const fullText = completedResponse.stdout.toString() +
                        completedResponse.stderr.toString();
                    for (const text of expectedText) {
                        expect(fullText).toContain(text);
                    }
                }
                // done();
            });
    }

    // eslint-disable-next-line jest/expect-expect, jest/no-disabled-tests
    it.skip("We should be able to issue a command and have a profile be automatically loaded", function () {
        // return issueCommand.bind(this, ["profile"], true)();
    });
});
