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

import { Constants } from "../../constants";
import { join } from "path";
import { IImperativeConfig } from "../../imperative/src/doc/IImperativeConfig";
import { ImperativeError } from "../../error";
import { EnvironmentalVariableSettings } from "../../imperative/src/env/EnvironmentalVariableSettings";
import { IDaemonContext } from "../../imperative/src/doc/IDaemonContext";
import { ICommandProfileSchema } from "../../cmd";
import { Config } from "../../config";

/**
 * This class is used to contain all configuration being set by Imperative.
 * It is a singleton and should be accessed via ImperativeConfig.instance.
 */
export class ImperativeConfig {

    /**
     * This is the variable that stores the specific instance of Imperative Config.
     * Defined as static so that it can be accessed from anywhere.
     */
    private static mInstance: ImperativeConfig = null;

    /**
     * This is the daemon context needed to pass to `yargs.fail()` in the event that we cannot extract
     * context through a `yargs.parse()` call.
     * @private
     * @type {IDaemonContext}
     * @memberof ImperativeConfig
     */
    private mDaemonContext: IDaemonContext;

    /**
     * This parameter is used as the container of all loaded configuration for
     * Imperative.
     */
    private mLoadedConfig: IImperativeConfig = null;

    /**
     * Current command needed for processing
     */
    private mCommandLine: string;

    /**
     * This parameter is used to contain the caller location of imperative configuration file.
     */
    private mCallerLocation: string = null;

    /**
     * This is the package name of the host application. It will only be set once accessed to
     * lessen loads to the host package.json.
     */
    private mHostPackageName: string;

    /**
     * This is the name of our imperative package. It will only be set once accessed to
     * lessen loads to the imperative package.json.
     *
     * It isn't hardcoded so that the name of our package can change without affecting
     * modules dependent on it.
     */
    private mImperativePackageName: string;

    /**
     * This is our calling CLI's command name (taken from package.json: bin).
     */
    private mRootCommandName: string;

    /**
     * The config object
     */
    private mConfig: Config;

    /**
     * Gets a single instance of the PluginIssues. On the first call of
     * ImperativeConfig.instance, a new Plugin Issues object is initialized and returned.
     * Every subsequent call will use the one that was first created.
     *
     * @returns {ImperativeConfig} The newly initialized PMF object.
     */
    public static get instance(): ImperativeConfig {
        if (this.mInstance == null) {
            this.mInstance = new ImperativeConfig();
        }

        return this.mInstance;
    }

    /**
     * Get the configured environmental variable prefix for the user's CLI
     * @returns {string} - the configured or default prefix for environmental variables for use in the environmental variable service
     */
    public get envVariablePrefix(): string {
        return this.loadedConfig.envVariablePrefix == null ? this.loadedConfig.name : this.loadedConfig.envVariablePrefix;
    }

    /**
     * Set the caller location.
     * @param {string} location new location to be updated with
     */
    public set callerLocation(location: string) {
        this.mCallerLocation = location;
    }

    /**
     * Return file location of imperative configuration file.
     * @returns {streturnsring} - location of configuration file
     */
    public get callerLocation(): string {
        return this.mCallerLocation;
    }

    /**
     * Set the loaded config data.
     * @param {IImperativeConfig} config to be set.
     */
    public set loadedConfig(config: IImperativeConfig) {
        this.mLoadedConfig = config;
    }

    /**
     * Retrieve the loaded config (if init has
     * @returns {IImperativeConfig} - the config that has been loaded, if any
     */
    public get loadedConfig(): IImperativeConfig {
        return this.mLoadedConfig;
    }

    /**
     * Set our root command name.
     * @param rootCommandName - The name of our calling CLI's command.
     */
    public set rootCommandName(rootCommandName: string) {
        this.mRootCommandName = rootCommandName;
    }

    /**
     * Get our root command name.
     * @returns The name of our calling CLI's command.
     */
    public get rootCommandName(): string {
        return this.mRootCommandName;
    }

    /**
     * Retrieve the host package name from which imperative was called.
     */
    public get hostPackageName(): string {
        if (!this.mHostPackageName) {
            this.mHostPackageName = this.callerPackageJson.name;
        }

        return this.mHostPackageName;
    }

    /**
     * Retrieve the package name of the imperative application.
     */
    public get imperativePackageName(): string {
        if (!this.mImperativePackageName) {
            this.mImperativePackageName = require(join(__dirname, "../../../package.json")).name;
        }

        return this.mImperativePackageName;
    }

    /**
     * Parses the package.json file and searches for the symlink name used under "bin".
     * @returns {string} - return bin symlink name if present, otherwise null
     */
    public findPackageBinName(): string {
        const pkg = this.callerPackageJson;
        if (typeof pkg.bin === "string") {
            return pkg.name;
        } else if (typeof pkg.bin === "object") {
            return Object.keys(pkg.bin).pop();
        }
        return null;
    }

    /**
     * Return the cli Home path.
     * @return {string} path to cli Home.
     */
    public get cliHome(): string {
        const settings = EnvironmentalVariableSettings.read(this.envVariablePrefix);
        if (settings.cliHome.value != null) {
            return settings.cliHome.value;
        }
        return this.loadedConfig.defaultHome;
    }

    /**
     * Return profile Directory.
     * @return {string} profile directory.
     */
    public get profileDir(): string {
        return this.loadedConfig.defaultHome + Constants.PROFILES_DIR + "/";
    }

    /**
     * Return package.json of the imperative user
     * @returns {any} - package.json file of caller
     */
    public get callerPackageJson(): any {
        return this.getCallerFile("package.json");
    }

    /**
     *  Retrieve the command line.
     *  @example
     *  For example, in "banana a b --c", "a b --c" is the command line.
     *  @returns {string} - command line
     */
    public get commandLine(): string {
        return this.mCommandLine;
    }

    /**
     * Set the command line (needed for daemon where command changes and is not static)
     * @memberof Imperative
     */
    public set commandLine(args: string) {
        this.mCommandLine = args;
    }

    /**
     * Set context for daemon to retrieve if no handler is called.
     * @type {IDaemonContext}
     * @memberof ImperativeConfig
     */
    public get daemonContext(): IDaemonContext {
        return this.mDaemonContext;
    }

    /**
     * Context for daemon when no handler is invoked.
     * @memberof ImperativeConfig
     */
    public set daemonContext(context: IDaemonContext) {
        this.mDaemonContext = context;
    }

    /**
     * Set the config
     */
    public set config(c: Config) {
        this.mConfig = c;
    }

    /**
     * Get the config properties
     */
    public get config(): Config {
        return this.mConfig;
    }

    /**
     * Require a file from a project using imperative accounting for imperative being contained
     * separately from the current implementers directory.
     * @param {string} file - the file to require from project using imperative
     */
    public getCallerFile(file: string): any {
        // try to locate the file using find-up first
        let findupErr: Error;
        try {
            const filePath = require("find-up").sync(file, {cwd: ImperativeConfig.instance.callerLocation});
            return require(filePath);
        } catch (e) {
            // couldn't locate using find-up, try to require directly
            findupErr = e;
        }
        // if we couldn't find the file path through find-up, try requiring the string directly
        try {
            return require(file);
        } catch (e) {
            const message = "Could not locate the specified module through requiring directly, nor through " +
                "searching the directories above " + ImperativeConfig.instance.callerLocation +
                ". 'require()' error message: " + e.message +
                " \n 'find-up' (directory search) error message:" + findupErr.message;
            throw new ImperativeError({msg: message, causeErrors: [e, findupErr]});
        }
    }

    /**
     * @returns a key/value object where the key is the profile type and the
     *          value is the profile type schema
     */
    public get profileSchemas(): { [key: string]: ICommandProfileSchema } {
        const schemas: any = {};
        if (ImperativeConfig.instance.loadedConfig.profiles != null)
            ImperativeConfig.instance.loadedConfig.profiles.forEach(profile => schemas[profile.type] = profile.schema);
        return schemas;
    }
}
