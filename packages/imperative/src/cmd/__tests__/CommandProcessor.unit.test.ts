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

import { IInvokeCommandParms } from "../src/doc/parms/IInvokeCommandParms";
import { ICommandDefinition } from "../src/doc/ICommandDefinition";
import { CommandProcessor } from "../src/CommandProcessor";
import { ICommandResponse } from "../src/doc/response/response/ICommandResponse";
import { CommandResponse } from "../src/response/CommandResponse";
import { IHelpGenerator } from "../src/help/doc/IHelpGenerator";
import { BasicProfileManager, IProfileManagerFactory, IProfileTypeConfiguration } from "../../profiles";
import { ImperativeError } from "../../error";
import { ICommandValidatorResponse } from "../src/doc/response/response/ICommandValidatorResponse";
import { SharedOptions } from "../src/utils/SharedOptions";
import { CommandProfileLoader } from "../src/profiles/CommandProfileLoader";
import { CliUtils } from "../../utilities/src/CliUtils";
import { WebHelpManager } from "../src/help/WebHelpManager";

jest.mock("../src/syntax/SyntaxValidator");
jest.mock("../src/utils/SharedOptions");

// Persist the original definitions of process.write
const ORIGINAL_STDOUT_WRITE = process.stdout.write;
const ORIGINAL_STDERR_WRITE = process.stderr.write;

// Sample root command name
const SAMPLE_ROOT_COMMAND: string = "fruit";

// Sample command definition without a handler
const SAMPLE_COMMAND_DEFINITION: ICommandDefinition = {
    name: "banana",
    description: "The banana command",
    type: "command",
    handler: "not_a_real_handler"
};

/**
 * A sample command with some examples attached to it
 */
const SAMPLE_COMMAND_DEFINITION_WITH_EXAMPLES: ICommandDefinition = {
    name: "banana",
    description: "The banana command",
    type: "command",
    handler: "not_a_real_handler",
    examples: [
        {
            description: "Unripe Banana",
            options: "--banana-color green --is-spoiled false"
        },
        {
            description: "Ripe Banana",
            options: "--banana-color yellow --is-spoiled false"
        },
        {
            description: "Spoiled Banana",
            options: "--banana-color black --is-spoiled true"
        }
    ]
};

// No handler
const SAMPLE_COMMAND_WIH_NO_HANDLER: ICommandDefinition = {
    name: "banana",
    description: "The banana command",
    type: "command"
};

// Fake/Test handler
const SAMPLE_COMMAND_REAL_HANDLER: ICommandDefinition = {
    name: "banana",
    description: "The banana command",
    type: "command",
    handler: __dirname + "/__model__/TestCmdHandler"
};

const SAMPLE_COMMAND_REAL_HANDLER_WITH_OPT: ICommandDefinition = {
    name: "banana",
    description: "The banana command",
    type: "command",
    handler: __dirname + "/__model__/TestArgHandler",
    options: [
        {
            name: "boolean-opt",
            type: "boolean",
            description: "A boolean option.",
        },
        {
            name: "color",
            type: "string",
            description: "The banana color.",
            required: true
        }
    ],
    profile: {
        optional: ["banana"]
    }
};

const SAMPLE_COMMAND_REAL_HANDLER_WITH_POS_OPT: ICommandDefinition = {
    name: "banana",
    description: "The banana command",
    type: "command",
    handler: __dirname + "/__model__/TestArgHandler",
    positionals: [
        {
            name: "color",
            type: "string",
            description: "The banana color.",
            required: true
        }
    ],
    profile: {
        optional: ["banana"]
    }
};

// More complex command
const SAMPLE_COMPLEX_COMMAND: ICommandDefinition = {
    name: "check",
    description: "The check group",
    type: "group",
    children: [
        {
            name: "the",
            description: "The the group",
            type: "group",
            children: [SAMPLE_COMMAND_DEFINITION]
        },
        {
            name: "for",
            description: "The for group",
            type: "group",
            children: [SAMPLE_COMMAND_DEFINITION]
        }
    ]
};

// More complex command
const SAMPLE_CMD_WITH_OPTS_AND_PROF: ICommandDefinition = {
    name: "sample",
    description: "The sample group",
    type: "group",
    children: [
        {
            name: "cmd",
            description: "The cmd group",
            type: "group",
            children: [SAMPLE_COMMAND_REAL_HANDLER_WITH_OPT]
        }
    ]
};

const SAMPLE_COMMAND_REAL_HANDLER_WITH_DEFAULT_OPT: ICommandDefinition = {
    name: "banana",
    description: "The banana command",
    type: "command",
    handler: __dirname + "/__model__/TestArgHandler",
    options: [
        {
            name: "color",
            type: "string",
            aliases: ["c"],
            description: "The banana color.",
            required: true,
            defaultValue: "green"
        }
    ],
    profile: {
        optional: ["banana"]
    }
};

// A fake instance of the profile manager factory
const FAKE_PROFILE_MANAGER_FACTORY: IProfileManagerFactory<IProfileTypeConfiguration> = {
    getManager: () => {
        return new BasicProfileManager({
            profileRootDirectory: "FAKE_ROOT",
            type: "banana",
            typeConfigurations: [
                {
                    type: "banana",
                    schema: {
                        title: "fake banana schema",
                        type: "object",
                        description: "",
                        properties: {}
                    }
                }
            ]
        });
    }
};

// A fake instance of the profile manager factory with props
const FAKE_PROFILE_MANAGER_FACTORY_WITH_PROPS: IProfileManagerFactory<IProfileTypeConfiguration> = {
    getManager: () => {
        return new BasicProfileManager({
            profileRootDirectory: "FAKE_ROOT",
            type: "banana",
            typeConfigurations: [
                {
                    type: "banana",
                    schema: {
                        title: "fake banana schema",
                        type: "object",
                        description: "",
                        properties: {
                            color: {
                                type: "string",
                                optionDefinition: {
                                    name: "color",
                                    aliases: ["c"],
                                    description: "The color of the banana.",
                                    type: "string",
                                    required: true,
                                },
                            }
                        }
                    }
                }
            ]
        });
    }
};

// A fake instance of the help generator
const FAKE_HELP_GENERATOR: IHelpGenerator = {
    buildHelp: function buildHelp(): string {
        return "Build help invoked!";
    }
};

const ENV_VAR_PREFIX: string = "UNIT_TEST";

describe("Command Processor", () => {
    // Restore everything after each test
    afterEach(() => {
        process.stdout.write = ORIGINAL_STDOUT_WRITE;
        process.stderr.write = ORIGINAL_STDERR_WRITE;
    });

    it("should allow us to create an instance", () => {
        let caughtError;

        try {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                definition: SAMPLE_COMMAND_DEFINITION,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: SAMPLE_ROOT_COMMAND,
                commandLine: "",
                promptPhrase: "dummydummy"
            });
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
    });

    it("should detect that no parameters have been supplied", () => {
        let error;
        try {
            const processor: CommandProcessor = new CommandProcessor(undefined);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect no command definition supplied", () => {
        let error;
        try {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                definition: undefined,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: SAMPLE_ROOT_COMMAND,
                commandLine: "",
                promptPhrase: "dummydummy"
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect no help generator supplied", () => {
        let error;
        try {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                definition: SAMPLE_COMMAND_DEFINITION,
                helpGenerator: undefined,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: SAMPLE_ROOT_COMMAND,
                commandLine: "",
                promptPhrase: "dummydummy"
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect no profile manager factory supplied", () => {
        let error;
        try {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                definition: SAMPLE_COMMAND_DEFINITION,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: undefined,
                rootCommandName: SAMPLE_ROOT_COMMAND,
                commandLine: "",
                promptPhrase: "dummydummy"
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect no root command supplied", () => {
        let error;
        try {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                definition: SAMPLE_COMMAND_DEFINITION,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: undefined,
                commandLine: "",
                promptPhrase: "dummydummy"
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect blank root command supplied", () => {
        let error;
        try {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                definition: SAMPLE_COMMAND_DEFINITION,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: "",
                commandLine: "",
                promptPhrase: "dummydummy"
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing ENV var prefix", () => {
        let error;
        try {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: undefined,
                definition: SAMPLE_COMMAND_DEFINITION,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: SAMPLE_ROOT_COMMAND,
                commandLine: "",
                promptPhrase: "dummydummy"
            });
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should allow us to get the definition", () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });
        expect(processor.definition).toEqual(SAMPLE_COMMAND_DEFINITION);
    });

    it("should allow us to get the ENV prefix", () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });
        expect(processor.envVariablePrefix).toEqual(ENV_VAR_PREFIX);
    });

    it("should allow us to get the root command name", () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });
        expect(processor.rootCommand).toEqual(SAMPLE_ROOT_COMMAND);
    });

    it("should return the definition if no full definition was supplied", () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });
        expect(processor.fullDefinition).toEqual(SAMPLE_COMMAND_DEFINITION);
    });

    it("should allow us to get the help generator", () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });
        expect(processor.helpGenerator).toEqual(FAKE_HELP_GENERATOR);
    });

    it("should allow us to get the profile factory", () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });
        expect(processor.profileFactory).toEqual(FAKE_PROFILE_MANAGER_FACTORY);
    });

    it("should build the help if requested", () => {
        let stdoutMessages: string = "";
        let stderrMessages: string = "";

        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock the process write
        (process.stdout.write as any) = jest.fn((data) => {
            stdoutMessages += data;
        });
        (process.stderr.write as any) = jest.fn((data) => {
            stderrMessages += data;
        });

        const helpResponse: ICommandResponse = processor.help(new CommandResponse());
        expect(helpResponse.stdout.toString()).toMatchSnapshot();
        expect(helpResponse).toMatchSnapshot();
    });

    it("should detect missing parameters to help", () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        let error;
        try {
            const helpResponse: ICommandResponse = processor.help(undefined);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should build the web help if requested", () => {
        let stdoutMessages: string = "";
        let stderrMessages: string = "";

        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock the process write
        (process.stdout.write as any) = jest.fn((data) => {
            stdoutMessages += data;
        });
        (process.stderr.write as any) = jest.fn((data) => {
            stderrMessages += data;
        });
        WebHelpManager.instance.openHelp = jest.fn();

        const helpResponse: ICommandResponse = processor.webHelp(null, new CommandResponse());
        expect(helpResponse.stdout.toString()).toMatchSnapshot();
        expect(helpResponse).toMatchSnapshot();
    });

    it("should log errors thrown by web help", () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        WebHelpManager.instance.openHelp = jest.fn(() => {
            throw new Error("openHelp failed");
        });

        const helpResponse: ICommandResponse = processor.webHelp(null, new CommandResponse());
        expect(helpResponse.success).toEqual(false);
        expect(helpResponse.error).toBeDefined();
        expect(helpResponse.error.msg).toBe("openHelp failed");
    });

    it("should validate the syntax if requested", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        const validateResponse: ICommandValidatorResponse = await processor.validate({
            _: [],
            $0: "",
            valid: true
        }, new CommandResponse());
        expect(validateResponse).toMatchSnapshot();
    });

    it("should detect missing command arguments to validate", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        let error;
        try {
            const validateResponse: ICommandValidatorResponse = await processor.validate(undefined, new CommandResponse());
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing command response to validate", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        let error;
        try {
            const validateResponse: ICommandValidatorResponse = await processor.validate({
                _: [],
                $0: "",
                valid: true
            }, undefined);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing parameters on invoke", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        let error;
        try {
            const validateResponse: ICommandResponse = await processor.invoke(undefined);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect missing arguments on invoke", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        let error;
        try {
            const validateResponse: ICommandResponse = await processor.invoke({arguments: undefined});
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect invalid response format on invoke", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        let error;
        try {
            const parms: any = {arguments: {_: [], $0: ""}, responseFormat: "blah", silent: true};
            const validateResponse: ICommandResponse = await processor.invoke(parms);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should detect cli args passed on the arguments object to invoke", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        let error;
        try {
            const parms: any = {arguments: {_: undefined, $0: ""}, responseFormat: "json", silent: true};
            const validateResponse: ICommandResponse = await processor.invoke(parms);
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should fail the command if syntax validation fails", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        const parms: any = {arguments: {_: ["banana"], $0: "", valid: false}, responseFormat: "json", silent: true};
        const commandResponse: ICommandResponse = await processor.invoke(parms);

        expect(commandResponse).toBeDefined();
        expect(commandResponse.stderr.toString()).toMatchSnapshot();
        expect(commandResponse.stdout.toString()).toMatchSnapshot();
        delete commandResponse.stderr;
        delete commandResponse.stdout;
        expect(commandResponse).toMatchSnapshot();
    });

    it("should formulate the full help command for a more complex command on syntax failure", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        const parms: any = {
            arguments: {_: ["check", "for", "banana"], $0: "", valid: false},
            responseFormat: "json", silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);

        expect(commandResponse).toBeDefined();
        expect(commandResponse.stderr.toString()).toMatchSnapshot();
        expect(commandResponse.stdout.toString()).toMatchSnapshot();
        delete commandResponse.stderr;
        delete commandResponse.stdout;
        expect(commandResponse).toMatchSnapshot();
    });

    it("should handle an unexpected syntax validation exception", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        const parms: any = {
            arguments: {_: ["check", "for", "banana"], $0: "", syntaxThrow: true},
            responseFormat: "json", silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);

        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should just use the primary command (if it cannot infer the rest of the command) in the syntax help message", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        const parms: any = {arguments: {_: [], $0: "", syntaxThrow: true}, responseFormat: "json", silent: true};
        const commandResponse: ICommandResponse = await processor.invoke(parms);

        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should mask sensitive CLI options like user and password in log output", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "--user fakeUser --password fakePass --token-value fakeToken " +
                "--cert-file-passphrase fakePassphrase --cert-key-file /fake/path",
            promptPhrase: "dummydummy"
        });

        // Mock log.info call
        let logOutput: string = "";
        const mockLogInfo = jest.fn((line) => {
            logOutput += line + "\n";
        });
        Object.defineProperty(processor, "log", {
            get: () => ({
                debug: jest.fn(),
                error: jest.fn(),
                info: mockLogInfo,
                trace: jest.fn()
            })
        });

        const parms: any = {arguments: {_: [], $0: "", syntaxThrow: true}, responseFormat: "json", silent: true};
        const commandResponse: ICommandResponse = await processor.invoke(parms);

        expect(mockLogInfo).toHaveBeenCalled();
        expect(logOutput).toContain("--user **** --password **** --token-value **** --cert-file-passphrase **** --cert-key-file ****");
    });

    it("should handle an error thrown from the profile loader", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_REAL_HANDLER,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        CommandProfileLoader.loader = jest.fn((args) => {
            throw new ImperativeError({msg: "Profile loading failed!"});
        });

        const parms: any = {
            arguments: {_: ["check", "for", "banana"], $0: "", valid: true},
            responseFormat: "json", silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);

        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should handle not being able to instantiate the handler", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_DEFINITION,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
            },
            responseFormat: "json",
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should handle not being able to instantiate a chained handler", async () => {
        // Allocate the command processor
        const commandDef: ICommandDefinition = JSON.parse(JSON.stringify(SAMPLE_COMMAND_DEFINITION));
        delete commandDef.handler;
        commandDef.chainedHandlers = [{
            handler: "not_a_real_chained_handler"
        }];
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: commandDef,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
            },
            responseFormat: "json",
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse).toBeDefined();
        expect(commandResponse.stderr.toString()).toContain(commandDef.chainedHandlers[0].handler);
    });

    it("should invoke two chained handlers without errors", async () => {
        const commandDef: ICommandDefinition = JSON.parse(JSON.stringify(SAMPLE_COMMAND_REAL_HANDLER));
        const handler = commandDef.handler;
        delete commandDef.handler;
        commandDef.chainedHandlers = [
            {
                handler,
            },
            {
                handler,
            }
        ];
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: commandDef,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
                throwImperative: false
            },
            responseFormat: "json",
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse.success).toBe(true);
    });

    it("should handle an imperative error thrown from a chained handler", async () => {
        const commandDef: ICommandDefinition = JSON.parse(JSON.stringify(SAMPLE_COMMAND_REAL_HANDLER));
        const handlerWithError = commandDef.handler;
        delete commandDef.handler;
        commandDef.chainedHandlers = [{
            handler: handlerWithError,
            mapping: [
                {
                    from: "throwImperative",
                    mapFromArguments: true,
                    to: "throwImperative",
                    applyToHandlers: [0]
                },
                {
                    from: "valid",
                    mapFromArguments: true,
                    to: "valid",
                    applyToHandlers: [0]
                }
            ]
        }];
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: commandDef,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
                throwImperative: true
            },
            responseFormat: "json",
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);
        const stringifiedError: string = JSON.stringify(commandResponse.error).toLowerCase();
        expect(stringifiedError).toContain("error");
        expect(stringifiedError).toContain("handler");
    });

    it("should not strip tabs from the imperative error message", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_REAL_HANDLER,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
                throwErrorWithTab: true
            },
            responseFormat: "json",
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse).toBeDefined();
        expect(commandResponse.stderr.toString()).toMatchSnapshot();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should handle an imperative error thrown from the handler", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_REAL_HANDLER,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
                throwImperative: true
            },
            responseFormat: "json",
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should handle an error thrown from the handler", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_REAL_HANDLER,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
                throwError: true
            },
            responseFormat: "json",
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);

        expect(commandResponse).toBeDefined();
        expect(commandResponse.success).toBe(false);
        expect(commandResponse.message).toMatch(
            /Unexpected Command Error: Cannot read (property 'doesnt' of undefined|properties of undefined \(reading 'doesnt'\))/
        );
        expect(commandResponse.error.msg).toMatch(/Cannot read (property 'doesnt' of undefined|properties of undefined \(reading 'doesnt'\))/);
        expect(commandResponse.stdout.toString().length).toBe(0);
        expect(commandResponse.stderr.toString()).toContain("Unexpected Command Error:");
        expect(commandResponse.stderr.toString()).toContain("Message:");
        expect(commandResponse.stderr.toString()).toContain("Stack:");
        expect(commandResponse.error.stack).toMatch(
            /TypeError: Cannot read (property 'doesnt' of undefined|properties of undefined \(reading 'doesnt'\))/
        );
    });

    it("should handle the handler rejecting with a message", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_REAL_HANDLER,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
                rejectWithMessage: true
            },
            responseFormat: "json",
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should handle the handler rejecting with no messages", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_REAL_HANDLER,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
                rejectWithNothing: true
            },
            responseFormat: "json",
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should invoke the handler and return success=true if the handler was successful", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_REAL_HANDLER,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: ["check", "for", "banana"],
                $0: "",
                valid: true,
            },
            silent: true
        };
        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should extract arguments not specified on invoke from a profile and merge with args", async () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_CMD_WITH_OPTS_AND_PROF,
            definition: SAMPLE_COMMAND_REAL_HANDLER_WITH_OPT,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY_WITH_PROPS,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    return;
                }
            };
        });

        // return the "fake" args object with values from profile
        CliUtils.getOptValueFromProfiles = jest.fn((cmdProfiles, profileDef, allOpts) => {
            return {
                color: "yellow"
            };
        });

        const parms: any = {
            arguments: {
                _: ["sample", "cmd", "banana"],
                $0: "",
                valid: true
            },
            silent: true
        };

        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(CliUtils.getOptValueFromProfiles).toHaveBeenCalledTimes(1);
        expect(commandResponse.stdout.toString()).toMatchSnapshot();
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should add default values if no CLI argument is specified", async () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_CMD_WITH_OPTS_AND_PROF,
            definition: SAMPLE_COMMAND_REAL_HANDLER_WITH_DEFAULT_OPT,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY_WITH_PROPS,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    return;
                }
            };
        });

        // return the "fake" args object with values from profile
        CliUtils.getOptValueFromProfiles = jest.fn((cmdProfiles, profileDef, allOpts) => {
            return {};
        });

        const parms: any = {
            arguments: {
                _: ["sample", "cmd", "banana"],
                $0: "",
                valid: true
            },
            silent: true
        };

        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse.stderr.toString()).toEqual("");
        expect(commandResponse.stdout.toString()).toContain("green"); // expect the handler to output the default value
        expect(commandResponse).toBeDefined();
    });

    it("should extract arguments not specified on invoke from a profile and merge with positional args", async () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_CMD_WITH_OPTS_AND_PROF,
            definition: SAMPLE_COMMAND_REAL_HANDLER_WITH_POS_OPT,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY_WITH_PROPS,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    return;
                }
            };
        });

        // return the "fake" args object with values from profile
        CliUtils.getOptValueFromProfiles = jest.fn((cmdProfiles, profileDef, allOpts) => {
            return {
                color: "yellow"
            };
        });

        const parms: any = {
            arguments: {
                _: ["sample", "cmd", "banana"],
                $0: "",
                valid: true
            },
            silent: true
        };

        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(CliUtils.getOptValueFromProfiles).toHaveBeenCalledTimes(1);
        expect(commandResponse.stdout.toString()).toMatchSnapshot();
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should use the value specified on the CLI positional option, if the argument is supplied in both CLI and profile", async () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_CMD_WITH_OPTS_AND_PROF,
            definition: SAMPLE_COMMAND_REAL_HANDLER_WITH_POS_OPT,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY_WITH_PROPS,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    return;
                }
            };
        });

        // return the "fake" args object with values from profile
        CliUtils.getOptValueFromProfiles = jest.fn((cmdProfiles, profileDef, allOpts) => {
            return {
                color: "yellow"
            };
        });

        const parms: any = {
            arguments: {
                _: ["sample", "cmd", "banana"],
                $0: "",
                valid: true,
                color: "green"
            },
            silent: true
        };

        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(CliUtils.getOptValueFromProfiles).toHaveBeenCalledTimes(1);
        expect(commandResponse.stdout.toString()).toMatchSnapshot();
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should use the value specified on the CLI option, if the argument is supplied in both CLI and profile", async () => {
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_CMD_WITH_OPTS_AND_PROF,
            definition: SAMPLE_COMMAND_REAL_HANDLER_WITH_OPT,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY_WITH_PROPS,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    return;
                }
            };
        });

        // return the "fake" args object with values from profile
        CliUtils.getOptValueFromProfiles = jest.fn((cmdProfiles, profileDef, allOpts) => {
            return {
                color: "yellow"
            };
        });

        const parms: any = {
            arguments: {
                _: ["sample", "cmd", "banana"],
                $0: "",
                valid: true,
                color: "green"
            },
            silent: true
        };

        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(CliUtils.getOptValueFromProfiles).toHaveBeenCalledTimes(1);
        expect(commandResponse.stdout.toString()).toMatchSnapshot();
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should allow us to formulate the help for a group", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMPLEX_COMMAND,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });
        const commandResponse: ICommandResponse = await processor.help(new CommandResponse({silent: true}));
        expect(commandResponse).toBeDefined();
        expect(commandResponse).toMatchSnapshot();
    });

    it("should fail the creation of the command processor if a definition of type command has no handler", async () => {
        let error;
        try {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                fullDefinition: SAMPLE_COMPLEX_COMMAND,
                definition: SAMPLE_COMMAND_WIH_NO_HANDLER,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: SAMPLE_ROOT_COMMAND,
                commandLine: "",
                promptPhrase: "dummydummy"
            });
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should just include the command name if no args are present in the help when a syntax error occurs", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_REAL_HANDLER,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: [],
                $0: "",
                valid: false,
            },
            silent: true
        };

        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse).toBeDefined();
        expect(commandResponse.stderr.toString()).toMatchSnapshot();
        expect(commandResponse.stdout.toString()).toMatchSnapshot();
        delete commandResponse.stderr;
        delete commandResponse.stdout;
        expect(commandResponse).toMatchSnapshot();
    });

    it("should handle a strange error type being thrown", async () => {
        // Allocate the command processor
        const processor: CommandProcessor = new CommandProcessor({
            envVariablePrefix: ENV_VAR_PREFIX,
            fullDefinition: SAMPLE_COMPLEX_COMMAND,
            definition: SAMPLE_COMMAND_REAL_HANDLER,
            helpGenerator: FAKE_HELP_GENERATOR,
            profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
            rootCommandName: SAMPLE_ROOT_COMMAND,
            commandLine: "",
            promptPhrase: "dummydummy"
        });

        // Mock read stdin
        (SharedOptions.readStdinIfRequested as any) = jest.fn((args, response, type) => {
            // Nothing to do
        });

        // Mock the profile loader
        (CommandProfileLoader.loader as any) = jest.fn((args) => {
            return {
                loadProfiles: (profArgs: any) => {
                    // Nothing to do
                }
            };
        });

        const parms: any = {
            arguments: {
                _: [],
                $0: "",
                valid: true,
                throwObject: true
            },
            silent: true
        };

        const commandResponse: ICommandResponse = await processor.invoke(parms);
        expect(commandResponse.success).toBe(false);
        expect(commandResponse.stderr.toString()).toContain("Unexpected Command Error:");
        expect(commandResponse.stderr.toString()).toContain("The command indicated failure through an unexpected means.");
        expect(commandResponse.stderr.toString()).toContain("TestCmdHandler");
        expect(commandResponse.data).toMatchSnapshot();
    });

    describe("invalidSyntaxNotification", () => {
        /**
         * Gets a dummy response object for testing.
         */
        const getDummyResponseObject = (): CommandResponse => {
            return {
                data: {
                    setMessage: jest.fn(),
                    setExitCode: jest.fn()
                },
                console: {
                    error: jest.fn(),
                },
                failed: jest.fn()
            } as any;
        };

        /**
         * Gets the params for testing.
         *
         * @param doesGenerateArgs Indicate if the arguments._ array is generated.
         */
        const getParamsForTesting = (doesGenerateArgs = true): IInvokeCommandParms => {
            return {
                arguments: {
                    _: doesGenerateArgs ? ["bad", "syntax", "here"] : [],
                    $0: "banana"
                }
            };
        };

        /**
         * Shorthand for getting the string parameter sent into the response.console.error mock function
         *
         * @param mockObject The mock object to extract parameters from.
         */
        const getConsoleErrorFromMock = (mockObject: CommandResponse): string => {
            return (mockObject.console.error as jest.Mock).mock.calls[0][0];
        };

        it("should log an invalid syntax notification with no examples", () => {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                definition: SAMPLE_COMMAND_DEFINITION,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: SAMPLE_ROOT_COMMAND,
                commandLine: "",
                promptPhrase: "dummydummy"
            });

            const dummyResponseObject = getDummyResponseObject();

            (processor as any).invalidSyntaxNotification(getParamsForTesting(), dummyResponseObject);

            expect(dummyResponseObject.data.setMessage).toHaveBeenCalledTimes(1);
            expect(dummyResponseObject.data.setMessage).toHaveBeenCalledWith("Command syntax invalid");

            expect(dummyResponseObject.failed).toHaveBeenCalled();

            expect(dummyResponseObject.console.error).toHaveBeenCalledTimes(1);

            expect(getConsoleErrorFromMock(dummyResponseObject)).toEqual(
                `\nUse "${SAMPLE_ROOT_COMMAND} bad syntax here --help" to view command description, usage, and options.`
            );
        });

        it("should log an invalid syntax notification with no arguments and no examples", () => {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                definition: SAMPLE_COMMAND_DEFINITION,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: SAMPLE_ROOT_COMMAND,
                commandLine: "",
                promptPhrase: "dummydummy"
            });

            const dummyResponseObject = getDummyResponseObject();

            (processor as any).invalidSyntaxNotification(getParamsForTesting(false), dummyResponseObject);

            expect(dummyResponseObject.data.setMessage).toHaveBeenCalledTimes(1);
            expect(dummyResponseObject.data.setMessage).toHaveBeenCalledWith("Command syntax invalid");

            expect(dummyResponseObject.failed).toHaveBeenCalled();

            expect(dummyResponseObject.console.error).toHaveBeenCalledTimes(1);

            expect(getConsoleErrorFromMock(dummyResponseObject)).toEqual(
                `\nUse "${SAMPLE_COMMAND_DEFINITION.name} --help" to view command description, usage, and options.`
            );
        });

        it("should log an invalid syntax notification with examples", () => {
            const processor: CommandProcessor = new CommandProcessor({
                envVariablePrefix: ENV_VAR_PREFIX,
                definition: SAMPLE_COMMAND_DEFINITION_WITH_EXAMPLES,
                helpGenerator: FAKE_HELP_GENERATOR,
                profileManagerFactory: FAKE_PROFILE_MANAGER_FACTORY,
                rootCommandName: SAMPLE_ROOT_COMMAND,
                commandLine: "",
                promptPhrase: "dummydummy"
            });

            const dummyResponseObject = getDummyResponseObject();

            (processor as any).invalidSyntaxNotification(getParamsForTesting(), dummyResponseObject);

            expect(dummyResponseObject.data.setMessage).toHaveBeenCalledTimes(1);
            expect(dummyResponseObject.data.setMessage).toHaveBeenCalledWith("Command syntax invalid");

            expect(dummyResponseObject.failed).toHaveBeenCalled();

            expect(dummyResponseObject.console.error).toHaveBeenCalledTimes(1);

            expect(getConsoleErrorFromMock(dummyResponseObject)).toEqual(
                expect.stringContaining(
                    `Use "${SAMPLE_ROOT_COMMAND} bad syntax here --help" to view command description, usage, and options.`
                )
            );

            expect(getConsoleErrorFromMock(dummyResponseObject)).toEqual(
                expect.stringContaining(`\nExample:\n\n`)
            );

            expect(getConsoleErrorFromMock(dummyResponseObject)).toEqual(
                expect.stringContaining("$ fruit banana --banana-color green --is-spoiled false")
            );

            // If we've gotten here then all the important checks have passed, this
            // will just check that the syntax generated hasn't changed.
            expect(getConsoleErrorFromMock(dummyResponseObject)).toMatchSnapshot();
        });
    });
});
