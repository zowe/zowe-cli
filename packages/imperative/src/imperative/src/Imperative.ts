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

/**
 * Main class of the Imperative framework, returned when you
 * require("@zowe/imperative") e.g. const imperative =  require("@zowe/imperative");
 */
import { PerfTiming } from "@zowe/perf-timing";
import { Logger} from "../../logger/src/Logger";
import { LoggerConfigBuilder } from "../../logger/src/LoggerConfigBuilder";
import { IImperativeConfig } from "./doc/IImperativeConfig";
import * as yargs from "yargs";
import { ConfigurationLoader } from "./ConfigurationLoader";
import { ConfigurationValidator } from "./ConfigurationValidator";
import { ImperativeApi } from "./api/ImperativeApi";
import { IImperativeApi } from "./api/doc/IImperativeApi";
import { Constants } from "../../constants/src/Constants";
import { TextUtils } from "../../utilities/src/TextUtils";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { ImperativeReject } from "../../interfaces/src/types/ImperativeReject";
import { LoggingConfigurer } from "./LoggingConfigurer";
import { ImperativeError } from "../../error";
import { PluginManagementFacility } from "./plugins/PluginManagementFacility";
// import { ConfigManagementFacility } from "./config/ConfigManagementFacility";

import { AbstractCommandYargs } from "../../cmd/src/yargs/AbstractCommandYargs";
import { CliProfileManager } from "../../cmd/src/profiles/CliProfileManager";
import { CommandPreparer } from "../../cmd/src/CommandPreparer";
import { CommandYargs } from "../../cmd/src/yargs/CommandYargs";
import { ICommandDefinition } from "../../cmd/src/doc/ICommandDefinition";
import { ICommandProfileTypeConfiguration } from "../../cmd/src/doc/profiles/definition/ICommandProfileTypeConfiguration";
import { ICommandResponseParms } from "../../cmd/src/doc/response/parms/ICommandResponseParms";
import { IHelpGenerator } from "../../cmd/src/help/doc/IHelpGenerator";
import { IHelpGeneratorFactory } from "../../cmd/src/help/doc/IHelpGeneratorFactory";
import { IHelpGeneratorParms } from "../../cmd/src/help/doc/IHelpGeneratorParms";
import { IYargsResponse } from "../../cmd/src/yargs/doc/IYargsResponse";
import { WebHelpManager } from "../../cmd/src/help/WebHelpManager";
import { YargsConfigurer } from "../../cmd/src/yargs/YargsConfigurer";
import { YargsDefiner } from "../../cmd/src/yargs/YargsDefiner";

import { ProfileUtils } from "../../profiles/src/utils/ProfileUtils";
import { IProfileTypeConfiguration } from "../../profiles/src/doc/config/IProfileTypeConfiguration";
import { CompleteProfilesGroupBuilder } from "./profiles/builders/CompleteProfilesGroupBuilder";
import { ImperativeHelpGeneratorFactory } from "./help/ImperativeHelpGeneratorFactory";
import { OverridesLoader } from "./OverridesLoader";
import { ImperativeProfileManagerFactory } from "./profiles/ImperativeProfileManagerFactory";
import { DefinitionTreeResolver } from "./DefinitionTreeResolver";
import { EnvironmentalVariableSettings } from "./env/EnvironmentalVariableSettings";
import { AppSettings } from "../../settings/src/AppSettings";
import { dirname, join } from "path";

import { Console } from "../../console/src/Console";
import { ISettingsFile } from "../../settings/src/doc/ISettingsFile";
import { IDaemonContext } from "./doc/IDaemonContext";
import { ICommandProfileAuthConfig } from "../../cmd/src/doc/profiles/definition/ICommandProfileAuthConfig";
import { ImperativeExpect } from "../../expect/src/ImperativeExpect";
import { CompleteAuthGroupBuilder } from "./auth/builders/CompleteAuthGroupBuilder";
import { Config } from "../../config/src/Config";
import { CompleteAutoInitCommandBuilder } from "./config/cmd/auto-init/builders/CompleteAutoInitCommandBuilder";
import { ICommandProfileAutoInitConfig } from "../../cmd/src/doc/profiles/definition/ICommandProfileAutoInitConfig";
import { EnvFileUtils } from "../../utilities/src/EnvFileUtils";

// Bootstrap the performance tools
if (PerfTiming.isEnabled) {
    // These are expensive operations so imperative should
    // only do it when performance is enabled.
    const Module = require("module");

    // Store the reference to the original require.
    const originalRequire = Module.prototype.require;

    // Timerify a wrapper named function so we can be sure that not just
    // any anonymous function gets checked.
    Module.prototype.require = PerfTiming.api.watch(function NodeModuleLoader(...args: any[]) {
        return originalRequire.apply(this, args);
    });
}

export class Imperative {

    public static readonly DEFAULT_DEBUG_FILE = join(process.cwd(), "imperative_debug.log");

    /**
     *  Retrieve the root command name.
     *  @example
     *  For example, in "banana a b --c", "banana" is the root command name.
     *  @returns {string} - root command name
     */
    public static get rootCommandName(): string {
        return this.mRootCommandName;
    }

    /**
     *  Retrieve the command line.
     *  @example
     *  For example, in "banana a b --c", "a b --c" is the command line.
     *  @returns {string} - command line
     */
    public static get commandLine(): string {
        return this.mCommandLine;
    }

    /**
     * Set the command line (needed for daemon where command changes and is not static)
     * @static
     * @memberof Imperative
     */
    public static set commandLine(args: string) {
        this.mCommandLine = args;
        ImperativeConfig.instance.commandLine = args;
    }

    /**
     * Get the complete full command tree
     * @returns {ICommandDefinition}
     */
    public static get fullCommandTree(): ICommandDefinition {
        return this.mFullCommandTree;
    }

    /**
     * Initialize the configuration for your CLI.
     * Wipes out any existing config that has already been set.
     *
     * @param {IImperativeConfig} [config] Configuration for Imperative provided by your application.
     *                                     If this parameter is not set, we will look in the closest
     *                                     package.json up the directory tree from the main entry
     *                                     point of your cli.
     *
     *                                     package.imperative.configurationModule should point to the
     *                                     compiled module that exports the configuration.
     *
     * @returns {Promise<void>} A promise indicating that we are done here.
     */
    public static init(config?: IImperativeConfig): Promise<void> {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (initializationComplete: () => void, initializationFailed: ImperativeReject) => {
            try {

                const timingApi = PerfTiming.api;

                if (PerfTiming.isEnabled) {
                    // Marks point START
                    timingApi.mark("START_IMP_INIT");
                }

                /**
                 * Config Logger Manager to enable log messages in memory prior to logger init.
                 */
                Logger.setLogInMemory(true);

                /**
                 * Identify caller's location on the system
                 */
                ImperativeConfig.instance.callerLocation = process.mainModule.filename;

                /**
                 * Load callers configuration, validate, and save
                 */
                config = ConfigurationLoader.load(config, ImperativeConfig.instance.callerPackageJson,
                    ImperativeConfig.instance.getCallerFile
                );
                ConfigurationValidator.validate(config);
                ImperativeConfig.instance.loadedConfig = config;

                /**
                 * Get the command name from the package bin.
                 * If no command name exists, we will instead use the file name invoked
                 * and log a debug warning.
                 */
                if (ImperativeConfig.instance.findPackageBinName() != null) {
                    this.mRootCommandName = ImperativeConfig.instance.findPackageBinName();
                } else {
                    this.mRootCommandName = ImperativeConfig.instance.callerLocation;
                    this.log.debug("WARNING: No \"bin\" configuration was found in your package.json," +
                        " or your package.json could not be found. " +
                        "Defaulting command name to filepath instead.");
                }
                ImperativeConfig.instance.rootCommandName = this.mRootCommandName;

                let delayedEnvFileSetupError = undefined;
                try {
                    EnvFileUtils.setEnvironmentForApp(ImperativeConfig.instance.rootCommandName, true, ImperativeConfig.instance.envVariablePrefix);
                } catch (err) {
                    delayedEnvFileSetupError = err;
                }

                // Initialize our settings file
                this.initAppSettings();

                // If config group is enabled add config commands
                if (config.allowConfigGroup) {
                    const ConfigManagementFacility = require("./config/ConfigManagementFacility"); // Delayed load req for init help text to work
                    ConfigManagementFacility.ConfigManagementFacility.instance.init();
                }

                let delayedConfigLoadError = undefined;

                // Load the base config, save any error from config load
                const configAppName = ImperativeConfig.instance.findPackageBinName() ? this.mRootCommandName : config.name;

                try {
                    ImperativeConfig.instance.config = await Config.load(configAppName,
                        { homeDir: ImperativeConfig.instance.cliHome }
                    );
                } catch (err) {
                    delayedConfigLoadError = err;
                }

                // If plugins are allowed, enable core plugins commands
                if (config.allowPlugins) {
                    PluginManagementFacility.instance.init();

                    // load the configuration of every installed plugin for later processing
                    PluginManagementFacility.instance.loadAllPluginCfgProps();

                    // Override the config object with things loaded from plugins
                    Object.assign(
                        ImperativeConfig.instance.loadedConfig.overrides,
                        PluginManagementFacility.instance.pluginOverrides
                    );
                }

                /**
                 * Once we have a complete representation of the config object, we should be able to
                 * use that and populate all required categories and expose them on our API object
                 * so that an app using imperative can write to the imperative log, its own log, or
                 * even a plug-in log.
                 *
                 * Any other initialization added to this routine should occur after logging has been initialized.
                 */
                this.initLogging();

                /**
                 * If there was an error trying to load the user's environment variable configuration, tell them about it now.
                 * Do not stop the process from running.
                 */
                if (delayedEnvFileSetupError) {
                    const appLogger = Logger.getAppLogger();
                    appLogger.logError(delayedEnvFileSetupError);
                    new Console().error(delayedEnvFileSetupError);
                }

                /**
                 * If there was an error trying to load the user's configuration, tell them about it now.
                 */
                if (delayedConfigLoadError) {
                    if (config.daemonMode) {
                        ImperativeConfig.instance.config = await Config.load(configAppName,
                            {
                                homeDir: ImperativeConfig.instance.cliHome,
                                noLoad: true
                            }
                        );
                        const imperativeLogger = Logger.getImperativeLogger();
                        imperativeLogger.logError(delayedConfigLoadError);
                    } else {
                        throw delayedConfigLoadError;
                    }
                }

                /**
                 * Now we should apply any overrides to default Imperative functionality. This is where CLI
                 * developers are able to really start customizing Imperative and how it operates internally.
                 * For the "config convert-profiles" command, we skip loading the CredentialManager override
                 * because we need to be able to uninstall the plugin that provides it.
                 */
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                if (!(process.argv.length > 3 && process.argv[2] === "config" && process.argv[3].startsWith("convert"))) {
                    await OverridesLoader.load(ImperativeConfig.instance.loadedConfig,
                        ImperativeConfig.instance.callerPackageJson);
                }

                /**
                 * Build API object
                 */
                this.mApi = this.constructApiObject();

                /**
                 * Build the help generator factory - requires the root command name and the loaded configuration document
                 */
                this.mHelpGeneratorFactory = new ImperativeHelpGeneratorFactory(this.rootCommandName, ImperativeConfig.instance.loadedConfig);

                // resolve command module globs, forming the root of the CLI command tree
                this.log.info(`Loaded and validated config for '${config.name}'. Config details at trace level of logging.`);
                this.log.trace(`The config object for '${config.name}' is:\n` +
                    JSON.stringify(config, null, 2)
                );
                const resolvedHostCliCmdTree: ICommandDefinition = this.getResolvedCmdTree(config);

                // If plugins are allowed, add plugins' commands and profiles to the CLI command tree
                if (config.allowPlugins) {
                    PluginManagementFacility.instance.addAllPluginsToHostCli(resolvedHostCliCmdTree);
                    this.log.info("Plugins added to the CLI command tree.");
                }

                // final preparation of the command tree
                const preparedHostCliCmdTree = this.getPreparedCmdTree(resolvedHostCliCmdTree, config.baseProfile);

                /**
                 * Only initialize the old-school profile environment
                 * if we are not in team-config mode.
                 */
                if (ImperativeConfig.instance.config.exists === false) {
                    await this.initProfiles(config);
                }

                /**
                 * Define all known commands
                 */
                this.log.info("Inherited traits applied to CLI command tree children. " +
                    "Cmd tree details at trace level of logging."
                );
                this.log.trace("The CLI command tree before being defined to yargs: " +
                    JSON.stringify(preparedHostCliCmdTree, null, 2)
                );
                this.defineCommands(preparedHostCliCmdTree);

                /**
                 * Notify caller initialization is complete
                 */
                initializationComplete();

                if (PerfTiming.isEnabled) {
                    // Marks point END
                    timingApi.mark("END_IMP_INIT");
                    timingApi.measure("Imperative.init()", "START_IMP_INIT", "END_IMP_INIT");
                }

            } catch (error) {
                const imperativeLogger = Logger.getImperativeLogger();
                if (error?.suppressDump) {
                    imperativeLogger.fatal(error.message); // Error generated by a bad config is printed
                } else {
                    imperativeLogger.fatal(require("util").inspect(error));
                    const os = require("os");
                    imperativeLogger.fatal("Diagnostic information:\n" +
                        "Platform: '%s', Architecture: '%s', Process.argv: '%s'\n" +
                        "Node versions: '%s'" +
                        "Environmental variables: '%s'",
                    os.platform(), os.arch(), process.argv.join(" "),
                    JSON.stringify(process.versions, null, 2),
                    JSON.stringify(process.env, null, 2));
                    Logger.writeInMemoryMessages(Imperative.DEFAULT_DEBUG_FILE);
                    if (error.report) {
                        const {writeFileSync} = require("fs");
                        writeFileSync(Imperative.DEFAULT_DEBUG_FILE, error.report);
                    }
                    if (!(error instanceof ImperativeError)) {
                        const oldError = error;
                        error = new ImperativeError({  // eslint-disable-line no-ex-assign
                            msg: "Unexpected Error Encountered",
                            causeErrors: error
                        });
                        error.stack = "\n" + oldError.stack;
                    }
                }
                initializationFailed(error);
            }
        });
    }

    /**
     * Returns the default console object to be used for messaging for
     * imperative fails to initialize or to be used before logging
     * is initialized.
     * @return {Logger}: an instance of the default console object
     */
    public static get console(): Logger {
        return this.constructConsoleApi();
    }


    /**
     * Parse command line arguments and issue the user's specified command
     * @returns {Imperative} this, for chaining syntax
     */
    public static parse(args?: string | string[], context?: IDaemonContext): Imperative {

        const timingApi = PerfTiming.api;

        if (PerfTiming.isEnabled) {
            // Marks point START
            timingApi.mark("START_IMP_PARSE");
        }

        ImperativeConfig.instance.daemonContext = context;
        AbstractCommandYargs.STOP_YARGS = false;

        yargs.parse(args);

        if (PerfTiming.isEnabled) {
            // Marks point END
            timingApi.mark("END_IMP_PARSE");
            timingApi.measure("Imperative.init()", "START_IMP_PARSE", "END_IMP_PARSE");
        }
        return this;
    }

    /**
     *
     * @param {string} type the profile type to search for configuration for
     * @returns {IImperativeProfileConfig | undefined}  The profile configuration if found, otherwise, undefined.
     */
    public static getProfileConfiguration(type: string): ICommandProfileTypeConfiguration | undefined {
        const profileConfigs = ImperativeConfig.instance.loadedConfig.profiles;
        if (profileConfigs == null || profileConfigs.length === 0) {
            return undefined;
        }
        let foundConfig: ICommandProfileTypeConfiguration;
        for (const profile of profileConfigs) {
            if (profile.type === type) {
                foundConfig = profile;
            }
        }
        return foundConfig;
    }

    /**
     * Get the configured help generator for your CLI. If you have not specified a custom generator,
     * the DefaultHelpGenerator will be used.
     * You probably won't need to call this from your CLI, but it is used internally.
     * @returns {IHelpGenerator} - The help generator for the command
     * @param {IHelpGeneratorParms} parms - parameters to the help generator including command definition
     */
    public static getHelpGenerator(parms: IHelpGeneratorParms): IHelpGenerator {
        return this.mHelpGeneratorFactory.getHelpGenerator(parms);
    }

    /**
     * Returns the imperative API object containing various framework API methods for usage in your CLI implemenation.
     * @return {ImperativeApi}: The api object.
     */
    public static get api(): ImperativeApi {
        if (this.mApi == null) {
            throw new ImperativeError(
                {
                    msg: "Imperative API object does not exist.  The Imperative.init() promise " +
                        "must be fullfilled before the API object can be accessed.  For issuing messages " +
                        "without the API object, use Imperative.console.",
                },
                {
                    logger: Imperative.console,
                }
            );
        }
        return this.mApi;
    }

    /**
     * Highlight text with your configured (or default) primary color
     * @param {string} text - the text to highlight
     * @returns {string} - the highlighted text
     */
    public static highlightWithPrimaryColor(text: string): string {
        return TextUtils.chalk[ImperativeConfig.instance.loadedConfig.primaryTextColor](text);
    }

    /**
     * Get the configured environmental variable prefix for the user's CLI
     * @returns {string} - the configured or default prefix for environmental variables for use in the environmental variable service
     * @deprecated Please use ImperativeConfig.instance.envVariablePrefix
     */
    public static get envVariablePrefix(): string {
        return ImperativeConfig.instance.envVariablePrefix;
    }

    /**
     * Highlight text with your configured (or default) secondary color
     * @param {string} text - the text to highlight
     * @returns {string} - the highlighted text
     */
    public static highlightWithSecondaryColor(text: string): string {
        return TextUtils.chalk[ImperativeConfig.instance.loadedConfig.secondaryTextColor](text);
    }

    private static mApi: ImperativeApi;
    private static mConsoleLog: Logger;
    private static mFullCommandTree: ICommandDefinition;
    private static mRootCommandName: string;
    private static mCommandLine: string;
    private static mHelpGeneratorFactory: IHelpGeneratorFactory;

    /**
     * Get log instance
     */
    private static get log(): Logger {
        return Logger.getImperativeLogger();
    }

    /**
     * Load the correct {@link AppSettings} instance from values located in the
     * cli home folder.
     */
    private static initAppSettings() {
        const cliSettingsRoot = join(ImperativeConfig.instance.cliHome, "settings");
        const cliSettingsFile = join(cliSettingsRoot, "imperative.json");

        const defaultSettings: ISettingsFile = {
            overrides: {
                CredentialManager: ImperativeConfig.instance.hostPackageName
            }
        };

        AppSettings.initialize(
            cliSettingsFile,
            defaultSettings,
        );
    }

    /**
     * Init log object such that subsequent calls to the Logger.getImperativeLogger() (or
     * other similar calls), will contain all necessary categories for logging.
     *
     * TODO(Kelosky): handle level setting via global config (trace enabling and such)
     */
    private static initLogging() {
        let message: string;
        /**
         * Build logging config from imperative config
         */
        const loggingConfig = LoggingConfigurer.configureLogger(ImperativeConfig.instance.cliHome, ImperativeConfig.instance.loadedConfig);

        /**
         * Set log levels from environmental variable settings
         */
        const envSettings = EnvironmentalVariableSettings.read(ImperativeConfig.instance.envVariablePrefix);
        if (envSettings.imperativeLogLevel.value != null && envSettings.imperativeLogLevel.value.trim().length > 0) {
            if (Logger.isValidLevel(envSettings.imperativeLogLevel.value.trim())) {
                // set the imperative log level based on the user's environmental variable, if any
                loggingConfig.log4jsConfig.categories[Logger.DEFAULT_IMPERATIVE_NAME].level = envSettings.imperativeLogLevel.value;
                this.log.info("Set imperative log level to %s from environmental variable setting '%s'",
                    envSettings.imperativeLogLevel.value, envSettings.imperativeLogLevel.key);
            } else {
                message = "Imperative log level '" + envSettings.imperativeLogLevel.value +
                    "' from environmental variable setting '" + envSettings.imperativeLogLevel.key + "' is not recognised.  " +
                    "Logger level is set to '" + LoggerConfigBuilder.getDefaultLogLevel() + "'.  " +
                    "Valid levels are " + Logger.DEFAULT_VALID_LOG_LEVELS.toString();
                new Console().warn(message);
                this.log.warn(message);
            }
        } else {
            this.log.warn("Environmental setting for imperative log level ('%s') was blank.", envSettings.imperativeLogLevel.key);
        }

        if (envSettings.appLogLevel.value != null && envSettings.appLogLevel.value.trim().length > 0) {
            if (Logger.isValidLevel(envSettings.appLogLevel.value.trim())) {
                // set the app log level based on the user's environmental variable, if any
                loggingConfig.log4jsConfig.categories[Logger.DEFAULT_APP_NAME].level = envSettings.appLogLevel.value;
                this.log.info("Set app log level to %s from environmental variable setting '%s'",
                    envSettings.appLogLevel.value, envSettings.appLogLevel.key);
            } else {
                message = "Application log level '" + envSettings.appLogLevel.value +
                    "' from environmental variable setting '" + envSettings.appLogLevel.key + "' is not recognised.  " +
                    "Logger level is set to '" + LoggerConfigBuilder.getDefaultLogLevel() + "'.  " +
                    "Valid levels are " + Logger.DEFAULT_VALID_LOG_LEVELS.toString();
                new Console().warn(message);
                this.log.warn(message);
            }
        } else {
            this.log.warn("Environmental setting for app log level ('%s') was blank.", envSettings.appLogLevel.key);
        }

        /**
         * Setup log4js
         */
        Logger.initLogger(loggingConfig);
    }

    /**
     * Initialize the profiles directory with types and meta files. This can be called every startup of the CLI
     * without issue, but if the meta files or configuration changes, we'll have to re-initialize.
     * TODO: Determine the re-initialize strategy.
     * @private
     * @static
     * @param {IImperativeConfig} config - The configuration document passed to init.
     * @memberof Imperative
     */
    private static async initProfiles(config: IImperativeConfig) {
        if (config.profiles != null && config.profiles.length > 0) {
            await CliProfileManager.initialize({
                configuration: config.profiles,
                profileRootDirectory: ProfileUtils.constructProfilesRootDirectory(ImperativeConfig.instance.cliHome),
                reinitialize: false
            });
        }
    }

    /**
     * Define to yargs for main CLI and plugins
     *
     * @param {ICommandDefinition} preparedHostCliCmdTree - The Root of the imperative host CLI
     *        which has already prepared by ImperativeConfig.getPreparedCmdTree.
     */
    private static defineCommands(preparedHostCliCmdTree: ICommandDefinition) {
        const commandResponseParms: ICommandResponseParms = {
            primaryTextColor: ImperativeConfig.instance.loadedConfig.primaryTextColor,
            progressBarSpinner: ImperativeConfig.instance.loadedConfig.progressBarSpinner
        };

        this.commandLine = process.argv.slice(2).join(" ");

        // Configure Yargs to meet the CLI's needs
        new YargsConfigurer(
            preparedHostCliCmdTree,
            yargs,
            commandResponseParms,
            new ImperativeProfileManagerFactory(this.api),
            this.mHelpGeneratorFactory,
            ImperativeConfig.instance.loadedConfig.experimentalCommandDescription,
            Imperative.rootCommandName,
            Imperative.commandLine,
            ImperativeConfig.instance.envVariablePrefix,

            // Default value for PROMPT phrase couls be handled in the EnvironmentalVariableSettings class
            EnvironmentalVariableSettings.read(ImperativeConfig.instance.envVariablePrefix).promptPhrase.value ||
            Constants.DEFAULT_PROMPT_PHRASE // allow environmental variable to override the default prompt phrase
        ).configure();

        // Define the commands to yargs
        CommandYargs.defineOptionsToYargs(yargs, preparedHostCliCmdTree.options);
        const definer = new YargsDefiner(
            yargs,
            ImperativeConfig.instance.loadedConfig.primaryTextColor,
            Imperative.rootCommandName,
            Imperative.commandLine,
            ImperativeConfig.instance.envVariablePrefix,
            new ImperativeProfileManagerFactory(this.api),
            this.mHelpGeneratorFactory,
            ImperativeConfig.instance.loadedConfig.experimentalCommandDescription,

            // Default value for PROMPT phrase couls be handled in the EnvironmentalVariableSettings class
            EnvironmentalVariableSettings.read(ImperativeConfig.instance.envVariablePrefix).promptPhrase.value ||
            Constants.DEFAULT_PROMPT_PHRASE // allow environmental variable to override the default prompt phrase
        );

        for (const child of preparedHostCliCmdTree.children) {
            definer.define(child,
                (args: yargs.Arguments, response: IYargsResponse) => {
                    if (response.success) {
                        if (response.exitCode == null) {
                            response.exitCode = 0;
                        }
                    } else {
                        if (response.exitCode == null) {
                            response.exitCode = Constants.ERROR_EXIT_CODE;
                        }
                    }
                    process.exitCode = response.exitCode;
                }, commandResponseParms
            );
        }
        Imperative.mFullCommandTree = preparedHostCliCmdTree;
        WebHelpManager.instance.fullCommandTree = Imperative.mFullCommandTree;
    }

    /**
     * Construct the API object for return to caller of init()
     * @return {ImperativeApi}: The API object
     */
    private static constructApiObject(): ImperativeApi {
        const apiParms: IImperativeApi = {
            imperativeLogger: this.constructImperativeLoggerApi(),
            appLogger: this.constructAppLoggerApi()
        };
        let api = new ImperativeApi(
            apiParms,
            ImperativeConfig.instance.loadedConfig,
            ImperativeConfig.instance.cliHome
        );

        /**
         * Add dynamic API methods to API object
         */
        api = this.constructDynamicLoggersApi(api);

        return api;
    }


    /**
     * Build the Logger API object for the app using the framework
     * @return {Logger}: returns the app Logger API object
     */
    private static constructAppLoggerApi(): Logger {
        return Logger.getAppLogger();
    }

    /**
     * Build the imperative API object for the app using the framework
     * @return {Logger}: returns the imperative Logger API object
     */
    private static constructImperativeLoggerApi(): Logger {
        return Logger.getImperativeLogger();
    }

    /**
     * Build the default console API object for the framework
     * @return {Logger}: returns the default console Logger API object
     */
    private static constructConsoleApi(): Logger {
        if (Imperative.mConsoleLog == null) {
            Imperative.mConsoleLog = Logger.getConsoleLogger();
            return Imperative.mConsoleLog;
        } else {
            return Imperative.mConsoleLog;
        }
    }

    private static constructDynamicLoggersApi(api: any) {
        const loadedConfig: IImperativeConfig = ImperativeConfig.instance.loadedConfig;
        if (loadedConfig.logging.additionalLogging != null &&
            loadedConfig.logging.additionalLogging.length > 0) {
            for (const logConfig of loadedConfig.logging.additionalLogging) {
                api.addAdditionalLogger(logConfig.apiName, Logger.getLoggerCategory(logConfig.apiName));
            }
        }
        return api;
    }

    /**
     * Get imperative's host CLI command tree with all module globs resolved.
     *
     * @return {ICommandDefinition} The resolved command tree
     */
    private static getResolvedCmdTree(config: IImperativeConfig): ICommandDefinition {
        return DefinitionTreeResolver.resolve(config.rootCommandDescription || "",
            config.productDisplayName,
            dirname(ImperativeConfig.instance.callerLocation),
            this.log,
            config.definitions, config.commandModuleGlobs, config.baseProfile != null
        );
    }

    /**
     * Get imperative's host CLI command tree after final preparation.
     *
     * @param resolvedCmdTree - The imperative command tree
     *        returned by Imperative.getResolvedCmdTree()
     * @param {ICommandProfileTypeConfiguration} baseProfile - An optional base profile to add to command definitions
     */
    private static getPreparedCmdTree(resolvedCmdTree: ICommandDefinition, baseProfile?: ICommandProfileTypeConfiguration): ICommandDefinition {
        let preparedCmdTree = this.addAutoGeneratedCommands(resolvedCmdTree);
        preparedCmdTree = CommandPreparer.prepare(preparedCmdTree, baseProfile);
        return preparedCmdTree;
    }

    /**
     * Append any auto generated commands to the root command document depending on configuration.
     * @param {ICommandDefinition} rootCommand - the root command as built so far
     * @returns {ICommandDefinition} - the root command with any auto generated commands appended
     */
    private static addAutoGeneratedCommands(rootCommand: ICommandDefinition): ICommandDefinition {
        const loadedConfig: IImperativeConfig = ImperativeConfig.instance.loadedConfig;
        if ((loadedConfig.autoGenerateProfileCommands == null || loadedConfig.autoGenerateProfileCommands) &&
            loadedConfig.profiles != null &&
            loadedConfig.profiles.length > 0) {
            // Add base profile to list of profile types if it is defined
            const allProfiles: IProfileTypeConfiguration[] = loadedConfig.profiles;
            if (loadedConfig.baseProfile != null) {
                allProfiles.push(loadedConfig.baseProfile);
            }
            rootCommand.children.push(CompleteProfilesGroupBuilder.getProfileGroup(allProfiles, this.log));
        }
        const authConfigs: {[key: string]: ICommandProfileAuthConfig[]} = {};
        if (loadedConfig.profiles != null) {
            loadedConfig.profiles.forEach((profile) => {
                if (profile.authConfig != null) {
                    for (const requiredOption of ["host", "port", "user", "password", "tokenType", "tokenValue"]) {
                        ImperativeExpect.toNotBeNullOrUndefined(profile.schema.properties[requiredOption],
                            `Profile of type ${profile.type} with authConfig property must have ${requiredOption} option defined`);
                    }
                    authConfigs[profile.type] = profile.authConfig;
                }
            });
        }
        if (Object.keys(authConfigs).length > 0) {
            rootCommand.children.push(CompleteAuthGroupBuilder.getAuthGroup(authConfigs, this.log, loadedConfig.authGroupConfig));
        }

        if (loadedConfig.configAutoInitCommandConfig) {
            const autoInit: ICommandProfileAutoInitConfig = loadedConfig.configAutoInitCommandConfig;
            for (const child of rootCommand.children){
                if (child.name === 'config') {
                    child.children.push(CompleteAutoInitCommandBuilder.getAutoInitCommand(autoInit, this.log));
                }
            }
        }

        return rootCommand;
    }

}
