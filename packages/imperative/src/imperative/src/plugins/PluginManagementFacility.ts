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

import { PerfTiming } from "@zowe/perf-timing";
import { IImperativeConfig } from "../../src/doc/IImperativeConfig";
import { UpdateImpConfig } from "../../src/UpdateImpConfig";
import { isAbsolute, join } from "path";
import { ImperativeConfig, JsUtils } from "../../../utilities";
import { Logger } from "../../../logger";
import { existsSync } from "fs";
import { PMFConstants } from "./utilities/PMFConstants";
import { readFileSync, writeFileSync } from "jsonfile";
import { IPluginCfgProps } from "./doc/IPluginCfgProps";
import { ICommandDefinition, ICommandProfileTypeConfiguration } from "../../../cmd";
import { IssueSeverity, PluginIssues } from "./utilities/PluginIssues";
import { ConfigurationValidator } from "../ConfigurationValidator";
import { ConfigurationLoader } from "../ConfigurationLoader";
import { DefinitionTreeResolver } from "../DefinitionTreeResolver";
import { IImperativeOverrides } from "../doc/IImperativeOverrides";
import { AppSettings } from "../../../settings";
import { IO } from "../../../io";
import { CredentialManagerOverride, ICredentialManagerNameMap } from "../../../security";

/**
 * This class is the main engine for the Plugin Management Facility. The
 * underlying class should be treated as a singleton and should be accessed
 * via PluginManagmentFacility.instance.
 */
export class PluginManagementFacility {
    /**
     * This is the variable that stores the specific instance of the PMF. Defined
     * as static so that it can be accessed from anywhere.
     *
     * @private
     * @type {PluginManagementFacility}
     */
    private static mInstance: PluginManagementFacility;

    /**
     * Gets a single instance of the PMF. On the first call of
     * PluginManagementFacility.instance, a new PMF is initialized and returned.
     * Every subsequent call will use the one that was first created.
     *
     * @returns {PluginManagementFacility} - The newly initialized PMF object.
     */
    public static get instance(): PluginManagementFacility {
        if (this.mInstance == null) {
            this.mInstance = new PluginManagementFacility();
        }

        return this.mInstance;
    }

    /**
     * Internal reference to the set of configuration properties for all loaded plugins.
     */
    private mAllPluginCfgProps: IPluginCfgProps[] = [];

    /**
     * Get the set of configuration properties for all loaded plugins.
     */
    public get allPluginCfgProps(): IPluginCfgProps[] {
        return this.mAllPluginCfgProps;
    }

    /**
     * Internal reference to the overrides provided by plugins.
     */
    private mPluginOverrides: IImperativeOverrides = {};

    /**
     * Object that defines what overrides will be provided by all plugins.
     */
    public get pluginOverrides(): IImperativeOverrides {
        return this.mPluginOverrides;
    }

    /**
     * Used as a short-name access to PMF constants.
     */
    private pmfConst: PMFConstants = PMFConstants.instance;

    /**
     * The CLI command tree with module globs already resolved.
     *
     * @private
     * @type {ICommandDefinition}
     */
    private resolvedCliCmdTree: ICommandDefinition = null;

    /**
     * The property name within package.json that holds the
     * Imperative configuration object.
     *
     * @private
     * @type {string}
     */
    private readonly impConfigPropNm = "imperative";

    /**
     * Used for internal imperative logging.
     *
     * @private
     * @type {Logger}
     */
    private impLogger: Logger = Logger.getImperativeLogger();

    /**
     * A class with recorded issues for each plugin for which problems were detected.
     *
     * @private
     * @type {IPluginIssues}
     */
    private pluginIssues = PluginIssues.instance;

    /**
     * A set of bright dependencies used by plugins. Each item in the
     * set contains the dependency's property name, and the the version
     * of that dependency.
     *
     * @type {Object}
     */
    private readonly npmPkgNmProp = "name";
    private readonly noPeerDependency = "-1";

    /**
     * The semantic versioning module (which does not have the
     * typing to do an 'import').
     */
    private readonly semver = require("semver");

    /**
     * Tracker to ensure that [init]{@link PluginManagementFacility#init} was
     * called. Most methods cannot be used unless init was called first.
     *
     * @private
     * @type {boolean}
     */
    private wasInitCalled = false;

    // __________________________________________________________________________
    /**
     * Initialize the PMF. Must be called to enable the various commands provided
     * by the facility.
     */
    public init(): void {
        this.impLogger.debug("PluginManagementFacility.init() - Start");

        // Load lib after the fact to save on speed when plugins not enabled
        const { PluginRequireProvider } = require("./PluginRequireProvider");

        // Create the hook for imperative and the application cli
        PluginRequireProvider.createPluginHooks([
            PMFConstants.instance.IMPERATIVE_PKG_NAME,
            PMFConstants.instance.CLI_CORE_PKG_NAME
        ]);

        // Add the plugin group and related commands.
        UpdateImpConfig.addCmdGrp({
            name: "plugins",
            type: "group",
            description: "Install and manage plug-ins.",
            children: [
                // Done dynamically so that PMFConstants can be initialized
                require("./cmd/install/install.definition").installDefinition,
                require("./cmd/list/list.definition").listDefinition,
                require("./cmd/uninstall/uninstall.definition").uninstallDefinition,
                require("./cmd/update/update.definition").updateDefinition,
                require("./cmd/validate/validate.definition").validateDefinition,
                require("./cmd/showfirststeps/showfirststeps.definition").firststepsDefinition
            ]
        });

        // When everything is done set this variable to true indicating successful
        // initialization.
        this.wasInitCalled = true;
        this.impLogger.debug("PluginManagementFacility.init() - Success");
    }

    // __________________________________________________________________________
    /**
     * Add all installed plugins' commands and profiles into the host CLI's command tree.
     *
     * @param resolvedCliCmdTree - The CLI command tree with
     *        module globs already resolved.
     */
    public addAllPluginsToHostCli(resolvedCliCmdTree: ICommandDefinition): void {
        // Store the host CLI command tree. Later functions will use it.
        this.resolvedCliCmdTree = resolvedCliCmdTree;

        // Loop through each plugin and add it to the CLI command tree
        for (const nextPluginCfgProps of this.mAllPluginCfgProps) {
            this.addPluginToHostCli(nextPluginCfgProps);

            // log the issue list for this plugin
            const issueListForPlugin = this.pluginIssues.getIssueListForPlugin(nextPluginCfgProps.pluginName);
            if (issueListForPlugin.length > 0) {
                this.impLogger.warn("addAllPluginsToHostCli: Issues for plugin = '" +
                    nextPluginCfgProps.pluginName + "':\n" +
                    JSON.stringify(issueListForPlugin, null, 2));
            } else {
                this.impLogger.info("addAllPluginsToHostCli: Plugin = '" +
                    nextPluginCfgProps.pluginName +
                    "' was successfully validated with no issues."
                );
            }
        }
    }

    // __________________________________________________________________________
    /**
     * Loads the configuration properties of each plugin. The configuration
     * information is used when overriding a piece of the imperative
     * infrastructure with a plugin's capability, when validating each plugin,
     * and when adding each plugin's commands to the CLI command tree.
     * Errors are recorded in PluginIssues.
     */
    public loadAllPluginCfgProps(): void {
        // Initialize the plugin.json file if needed
        // TODO Skip creation of PMF_ROOT directory once it is deprecated by team config
        if (!existsSync(this.pmfConst.PLUGIN_JSON)) {
            if (!existsSync(this.pmfConst.PMF_ROOT)) {
                this.impLogger.debug("Creating PMF_ROOT directory");
                IO.mkdirp(this.pmfConst.PMF_ROOT);
            }

            this.impLogger.debug("Creating PLUGIN_JSON file");
            writeFileSync(this.pmfConst.PLUGIN_JSON, {});
        }

        const loadedOverrides: { [key: string]: IImperativeOverrides } = {};

        // iterate through all of our installed plugins
        for (const nextPluginNm of Object.keys(this.pluginIssues.getInstalledPlugins())) {
            const nextPluginCfgProps = this.loadPluginCfgProps(nextPluginNm);
            if (nextPluginCfgProps) {
                this.mAllPluginCfgProps.push(nextPluginCfgProps);

                // Keep the overrides in a temporary object indexed by plugin name
                loadedOverrides[nextPluginNm] = nextPluginCfgProps.impConfig.overrides;

                this.impLogger.trace("Next plugin's configuration properties:\n" +
                    JSON.stringify(nextPluginCfgProps, null, 2)
                );
            } else {
                this.impLogger.error(
                    "loadAllPluginCfgProps: Unable to load the configuration for the plug-in named '" +
                    nextPluginNm + "' The plug-in was not added to the host CLI."
                );
            }
        }

        // Loop through each overrides settings specified by all plugins.
        // This was designed to handle different types of overrides,
        // but we currently only process CredentialManager overrides.
        let overrideDispNm: string;
        let overridePluginNm: string;

        for (const [settingNm, settingVal] of Object.entries(AppSettings.instance.getNamespace("overrides"))) {
            overrideDispNm = settingVal as string;
            overridePluginNm = settingVal as string;
            let credMgrIsUnknown = false;

            if (settingVal !== false && settingVal !== ImperativeConfig.instance.hostPackageName) {
                // A setting has been specified to override a built-in capability
                this.impLogger.debug(
                    `Attempting to replace "${settingNm}" with an override named "${overridePluginNm}"`
                );

                if (settingNm === CredentialManagerOverride.CRED_MGR_SETTING_NAME) {
                    /* For credMgr override, the value of the setting is the override display name.
                     * We must use the display name to find this override within our loadedOverrides.
                     * We must find the plugin name from within our known credMgr overrides.
                     */
                    const credMgrInfo = CredentialManagerOverride.getCredMgrInfoByDisplayName(overrideDispNm);
                    if ( credMgrInfo === null) {
                        credMgrIsUnknown = true;
                    } else {
                        // record the known plugin name that we found for this display name
                        overridePluginNm = credMgrInfo.credMgrPluginName;
                    }
                }

                if (!Object.prototype.hasOwnProperty.call(loadedOverrides, overridePluginNm)) {
                    // The overrideName specified in our settings is not available from any plugin.
                    this.useOverrideThatFails(settingNm, overrideDispNm, overridePluginNm,
                        `No plugin has been installed that overrides '${settingNm}' with '${overrideDispNm}'.` +
                        "\nPlugins that provide overrides are:\n" + JSON.stringify(loadedOverrides, null, 2)
                    );
                    continue;
                }

                if (credMgrIsUnknown) {
                    // We found the plugin specified for a credMgr setting, but the plugin is unknown
                    const unknownCredMgrMsg = `Your configured '${settingNm}' setting specified a ` +
                        `plugin named '${overridePluginNm}' that is not a known credential manager. ` +
                        `You should only use this plugin for testing until it is added to ` +
                        `${ImperativeConfig.instance.rootCommandName}'s list of known credential managers. ` +
                        `If that plugin does not implement a credential manager override class, the built-in ` +
                        `${ImperativeConfig.instance.rootCommandName} credential manager will be used.`;
                    this.impLogger.warn(unknownCredMgrMsg);

                    // We also want the warning displayed to the user
                    Logger.getConsoleLogger().warn(unknownCredMgrMsg);
                }

                // Like the cli the overrides can be the actual class or the string path
                let loadedSetting: string | object = (loadedOverrides[overridePluginNm] as any)[settingNm];

                // If the overrides loaded is a string path, just resolve it here since it would be much
                // to do so in the overrides loader.
                if (typeof loadedSetting === "string") {
                    let pathToPluginOverride = loadedSetting;
                    try {
                        if (!isAbsolute(pathToPluginOverride)) {
                            this.impLogger.trace(`PluginOverride: Resolving ${pathToPluginOverride} in ${overridePluginNm}`);

                            // This is actually kind of disgusting. What is happening is that we are getting the
                            // entry file of the plugin using require.resolve since the modules loaded are different
                            // when using node or ts-node. This require gets us the index.js/index.ts file that
                            // the plugin defines. So we then cd up a directory and resolve the path relative
                            // to the plugin entry file.
                            pathToPluginOverride = join(
                                require.resolve(this.formPluginRuntimePath(overridePluginNm)),
                                "../",
                                pathToPluginOverride
                            );
                        }
                        loadedSetting = require(pathToPluginOverride);
                        this.impLogger.info(`PluginOverride: Overrode "${settingNm}" ` +
                            `with "${pathToPluginOverride}" from plugin "${overridePluginNm}"`);
                    } catch (requireError) {
                        this.useOverrideThatFails(settingNm, overrideDispNm, overridePluginNm,
                            `Unable to load class from '${pathToPluginOverride}'. ${requireError.message}`
                        );
                        continue;
                    }
                }

                // Save the setting in the mPluginsOverrides object that was stored previously in
                // the loadedOverrides object as the plugin name.
                (this.mPluginOverrides as any)[settingNm] = loadedSetting;
            } // end overriding was specified
        } // end for loop of settings

        this.impLogger.info("All plugin configurations have been loaded. Details at trace level of logging.");
    }

    // __________________________________________________________________________
    /**
     * Produces a function that requires a module from a plugin using a relative
     * path name from the plugin's root to the module. Used as a callback function
     * from the ConfigurationLoader to load configuration handlers.
     *
     * @param {string} pluginName - The name of the plugin/module to load.
     *
     * @returns {function} - The method responsible for requiring the module
     */
    public requirePluginModuleCallback(pluginName: string): ((relativePath: string) => any) {

        return (relativePath: string) => {
            const pluginModuleRuntimePath = this.formPluginRuntimePath(pluginName, relativePath);
            try {
                return require(pluginModuleRuntimePath);
            } catch (requireError) {
                PluginIssues.instance.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                    "Unable to load the following module for plug-in '" +
                    pluginName + "' :\n" + pluginModuleRuntimePath + "\n" +
                    "Reason = " + requireError.message
                );
                return {};
            }
        };
    }

    // __________________________________________________________________________
    /**
     * Add the specified plugin to the imperative command tree.
     *
     * @param {IPluginCfgProps} pluginCfgProps - The configuration properties for this plugin
     */
    private addPluginToHostCli(pluginCfgProps: IPluginCfgProps): void {

        const timingApi = PerfTiming.api;

        if (PerfTiming.isEnabled) {
            // Marks point START
            timingApi.mark("START_ADD_PLUGIN");
        }

        /* Form a top-level command group for this plugin.
         * Resolve all means of command definition into the pluginCmdGroup.children
         */
        let pluginCmdGroup: ICommandDefinition = null;
        try {
            pluginCmdGroup = {
                name: pluginCfgProps.impConfig.name,
                description: pluginCfgProps.impConfig.rootCommandDescription,
                type: "group",
                children: DefinitionTreeResolver.combineAllCmdDefs(
                    this.formPluginRuntimePath(pluginCfgProps.pluginName, "./lib"),
                    pluginCfgProps.impConfig.definitions, pluginCfgProps.impConfig.commandModuleGlobs,
                    ImperativeConfig.instance.loadedConfig.baseProfile != null
                )
            };
            /**
             * Fill in the optional aliases and summary fields,
             * if specified.
             */
            if (pluginCfgProps.impConfig.pluginSummary != null) {
                this.impLogger.debug("Adding summary from pluginSummary field of configuration");
                pluginCmdGroup.summary = pluginCfgProps.impConfig.pluginSummary;
            }
            if (pluginCfgProps.impConfig.pluginAliases != null) {
                this.impLogger.debug("Adding aliases from pluginAliases field of configuration");
                pluginCmdGroup.aliases = pluginCfgProps.impConfig.pluginAliases;
            }
        }
        catch (impErr) {
            const errMsg = "Failed to combine command definitions. Reason = " + impErr.message;
            this.impLogger.error("addPluginToHostCli: DefinitionTreeResolver.combineAllCmdDefs: " + errMsg);
            this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CMD_ERROR, errMsg);
            return;
        }

        // validate the plugin's configuration
        if (this.validatePlugin(pluginCfgProps, pluginCmdGroup) === false) {
            this.impLogger.error("addPluginToHostCli: The plug-in named '" + pluginCfgProps.pluginName +
                "' failed validation and was not added to the host CLI app.");
            return;
        }

        if (pluginCmdGroup.children.length <= 0) {
            this.impLogger.info("addPluginToHostCli: The plugin '" +
                pluginCfgProps.pluginName +
                "' has no commands, so no new commands will be added to the host CLI app."
            );
        } else {
            // add the new plugin group into the imperative command tree
            this.impLogger.info("addPluginToHostCli: Adding commands for plug-in '" +
                pluginCfgProps.pluginName + "' to CLI command tree. Plugin command details at trace level of logging."
            );
            this.impLogger.trace("addPluginToHostCli: Commands for plugin = '" +
                pluginCfgProps.pluginName + "':\n" + JSON.stringify(pluginCmdGroup, null, 2)
            );
            if (!this.addCmdGrpToResolvedCliCmdTree(pluginCfgProps.pluginName, pluginCmdGroup)) {
                return;
            }
        }

        // add the profiles for this plugin to our imperative config object
        if (pluginCfgProps.impConfig.profiles && pluginCfgProps.impConfig.profiles.length > 0) {
            this.impLogger.trace("addPluginToHostCli: Adding these profiles for plug-in = '" +
                pluginCfgProps.pluginName + "':\n" +
                JSON.stringify(pluginCfgProps.impConfig.profiles, null, 2)
            );
            try {
                UpdateImpConfig.addProfiles(pluginCfgProps.impConfig.profiles);
            }
            catch (impErr) {
                const errMsg = "Failed to add profiles for the plug-in = '" + pluginCfgProps.pluginName +
                    "'.\nReason = " + impErr.message +
                    "\nBecause of profile error, removing commands for this plug-in";
                this.impLogger.error("addPluginToHostCli: " + errMsg);
                this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CMD_ERROR, errMsg);
                this.removeCmdGrpFromResolvedCliCmdTree(pluginCmdGroup);
            }
        }

        if (PerfTiming.isEnabled) {
            // Marks point END
            timingApi.mark("END_ADD_PLUGIN");
            timingApi.measure("Add plugin completed: " + pluginCfgProps.impConfig.name, "START_ADD_PLUGIN", "END_ADD_PLUGIN");
        }

    }

    // __________________________________________________________________________
    /**
     * Add a new command group into the host CLI's resolved command tree.
     * We had to wait until the host CLI was resolved, so that we could check for
     * name conflicts. So each  plugin's commands are added to the host CLI
     * command tree after both have been resolved.
     *
     * @param {string} pluginName - the name of the plugin to initialize
     *
     * @param {ICommandDefinition} cmdDefToAdd - command definition group to to be added.
     *
     * @returns True upon success. False upon error, and errors are recorded in pluginIssues.
     */
    private addCmdGrpToResolvedCliCmdTree(pluginName: string, cmdDefToAdd: ICommandDefinition): boolean {
        if (this.resolvedCliCmdTree == null) {
            const errMsg = "The resolved command tree was null. " +
                "Imperative should have created an empty command definition array.";
            this.impLogger.error("addCmdGrpToResolvedCliCmdTree: While adding plugin = '" +
                pluginName + "', " + errMsg);
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, errMsg);
            return false;
        }

        if (this.resolvedCliCmdTree.children == null) {
            const errMsg = "The resolved command tree children was null. " +
                "Imperative should have created an empty children array.";
            this.impLogger.error("addCmdGrpToResolvedCliCmdTree: While adding plugin = '" +
                pluginName + "', " + errMsg);
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, errMsg);
            return false;
        }

        const cmdDefInx = this.resolvedCliCmdTree.children.findIndex((existingCmdDef: ICommandDefinition) => {
            return existingCmdDef.name === cmdDefToAdd.name;
        });
        if (cmdDefInx > -1) {
            const errMsg = "The command group = '" + cmdDefToAdd.name +
                "' already exists. Plugin management should have already rejected this plugin.";
            this.impLogger.error("addCmdGrpToResolvedCliCmdTree: " + errMsg);
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, errMsg);
            return false;
        }
        this.impLogger.debug("Adding definition = '" + cmdDefToAdd.name + "' to the resolved command tree.");
        this.resolvedCliCmdTree.children.push(cmdDefToAdd);
        return true;
    }

    // __________________________________________________________________________
    /**
     * Compare the version of a plugin version property with a version property
     * of its base CLI.
     *
     * If the versions do not intersect (according so semver rules), then a
     * PluginIssue is recorded.
     *
     * @param  pluginName - The name of the plugin.
     *
     * @param  pluginVerPropNm - The name of the plugin property containing a version.
     *
     * @param  pluginVerVal - value of the plugin's version.
     *
     * @param  cliVerPropNm - The name of the base CLI property containing a version.
     *
     * @param  cliVerVal - value of the base CLI's version.
     *
     */
    private comparePluginVersionToCli(
        pluginName: string,
        pluginVerPropNm: string,
        pluginVerVal: string,
        cliVerPropNm: string,
        cliVerVal: string
    ): void {
        const cliCmdName = ImperativeConfig.instance.rootCommandName;
        try {
            if (!this.semver.intersects(cliVerVal, pluginVerVal, false)) {
                this.pluginIssues.recordIssue(pluginName, IssueSeverity.WARNING,
                    "The version value (" + pluginVerVal + ") of the plugin's '" +
                    pluginVerPropNm + "' property is incompatible with the version value (" +
                    cliVerVal + ") of the " + cliCmdName + " command's '" +
                    cliVerPropNm + "' property."
                );
            }
        } catch (semverExcept) {
            PluginIssues.instance.recordIssue(pluginName, IssueSeverity.WARNING,
                "Failed to compare the version value (" +
                pluginVerVal + ") of the plugin's '" + pluginVerPropNm +
                "' property with the version value (" + cliVerVal +
                ") of the " + cliCmdName + " command's '" + cliVerPropNm + "' property.\n" +
                "This can occur when one of the specified values is not a valid version string.\n" +
                "Reported reason = " + semverExcept.message
            );
        }
    }

    // __________________________________________________________________________
    /**
     * Get the package name of our base CLI.
     *
     * @returns The CLI package name contained in the package.json 'name' property.
     */
    private getCliPkgName(): string {
        const cliPackageJson: any = ImperativeConfig.instance.callerPackageJson;
        if (!Object.prototype.hasOwnProperty.call(cliPackageJson, this.npmPkgNmProp)) {
            return "NoNameInCliPkgJson";
        }
        return cliPackageJson[this.npmPkgNmProp];
    }

    // __________________________________________________________________________
    /**
     * Remove a command group that was previously added.
     * We remove a command group if we discover errors after
     * adding the command group.
     *
     * @param {ICommandDefinition} cmdDefToRemove - command definition to be removed.
     */
    private removeCmdGrpFromResolvedCliCmdTree(cmdDefToRemove: ICommandDefinition): void {
        if (this.resolvedCliCmdTree &&
            this.resolvedCliCmdTree.children &&
            this.resolvedCliCmdTree.children.length > 0
        ) {
            const cmdDefInx = this.resolvedCliCmdTree.children.findIndex((existingCmdDef: ICommandDefinition) => {
                return existingCmdDef.name === cmdDefToRemove.name;
            });
            if (cmdDefInx > -1) {
                this.impLogger.debug("Removing definition = '" + cmdDefToRemove.name + "'");
                this.resolvedCliCmdTree.children.splice(cmdDefInx, 1);
            }
        }
    }

    // __________________________________________________________________________
    /**
     * Does the supplied pluginGroupNm match an existing top-level
     * name or alias in the imperative command tree?
     * If a conflict occurs, plugIssues.doesPluginHaveError() will return true.
     *
     * @param {string} pluginName - The name of the plugin that we are checking.
     *
     * @param {ICommandDefinition} pluginGroupDefinition - A plugin's command group definition..
     *
     * @param {ICommandDefinition} cmdTreeDef - A top-level command tree
     *        definition against which we compare the supplied
     *        pluginGroupNm. It is typically the imperative command tree.
     *
     * @returns {[boolean, string]} - {hasConflict, message} - hasConflict: True when we found a conflict.
     *                                False when find no conflicts.
     *                                message: the message describing the conflict
     */
    private conflictingNameOrAlias(
        pluginName: string,
        pluginGroupDefinition: ICommandDefinition,
        cmdTreeDef: ICommandDefinition
    ): { hasConflict: boolean, message: string } {
        const pluginGroupNm: string = pluginGroupDefinition.name;
        /* Confirm that pluginGroupNm is not an existing top-level
         * group or command in the imperative command tree
         * and confirm that none of the plugin aliases match any command names
         */
        if (pluginGroupNm.toLowerCase() === cmdTreeDef.name.toLowerCase()) {
            const conflictMessage = this.impLogger.error("The plugin named '%s' attempted to add a group of commands" +
                " with the name '%s'" +
                ". Your base application already contains a group with the name '%s'.", pluginGroupNm, pluginGroupDefinition.name,
            cmdTreeDef.name);
            return { hasConflict: true, message: conflictMessage };
        }

        if (pluginGroupDefinition.aliases != null) {
            for (const pluginAlias of pluginGroupDefinition.aliases) {
                if (pluginAlias.toLowerCase() === cmdTreeDef.name.toLowerCase()) {
                    const conflictMessage = this.impLogger.error("The plugin named '%s' attempted to add a group of commands" +
                        " with the alias '%s' " +
                        ". Your base application already contains a group with the name '%s'.", pluginGroupNm, pluginAlias,
                    cmdTreeDef.name);
                    return { hasConflict: true, message: conflictMessage };
                }
            }
        }
        /* Confirm that pluginGroupNm is not an existing top-level
         * alias in the command tree definition.
         */
        if (Object.prototype.hasOwnProperty.call(cmdTreeDef, "aliases")) {
            for (const nextAliasToTest of cmdTreeDef.aliases) {
                // if the plugin name matches an alias of the definition tree
                if (pluginGroupNm.toLowerCase() === nextAliasToTest.toLowerCase()) {
                    const conflictMessage = this.impLogger.error("The plugin attempted to add a group of commands with the name '%s' " +
                        ". Your base application already contains a group with an alias '%s'.", pluginGroupNm, nextAliasToTest,
                    cmdTreeDef.name);
                    return { hasConflict: true, message: conflictMessage };
                }
                if (pluginGroupDefinition.aliases != null) {
                    for (const pluginAlias of pluginGroupDefinition.aliases) {
                        // if an alias of the plugin matches an alias of hte definition tree
                        if (pluginAlias.toLowerCase() === nextAliasToTest.toLowerCase()) {
                            const conflictMessage = this.impLogger.error("The plugin named '%s' attempted to add a " +
                                "group of command with the alias '%s', which conflicts with " +
                                "another alias of the same name for group '%s'.", pluginGroupDefinition.name, pluginAlias,
                            cmdTreeDef.name);
                            return { hasConflict: true, message: conflictMessage };
                        }
                    }
                }
            }
        }
        // no conflict if we got this far
        return { hasConflict: false, message: undefined };
    }

    // __________________________________________________________________________
    /**
     * Form the absolute path to a runtime file for a plugin from a path name
     * that is relative to the plugin's root directory (where its package.json lives).
     *
     * @param {string} pluginName - The name of the plugin.
     *
     * @param {string} relativePath - A relative path from plugin's root.
     *        Typically supplied as ./lib/blah/blah/blah.
     *        If not supplied, (or supplied as an an empty string,
     *        the result will be a path to
     *        <The_PLUGIN_NODE_MODULE_LOCATION_ForTheBaseCLI>/<pluginName>.
     *        If an absolute path is supplied, it is returned exactly as supplied.
     *
     * @returns {string} - The absolute path to the file.
     */
    private formPluginRuntimePath(
        pluginName: string,
        relativePath: string = ""
    ): string {
        // Attempt to find the node_modules that contains the plugin
        let pluginRuntimeDir = null;
        for (const location of this.pmfConst.PLUGIN_NODE_MODULE_LOCATION) {
            pluginRuntimeDir = join(location, pluginName);
            if (existsSync(pluginRuntimeDir)) {
                break;
            }
        }

        if (relativePath.length === 0) {
            return pluginRuntimeDir;
        }

        /* If the relative path is already absolute, do not place our
         * plugin's runtime location in front of the supplied path.
         */
        if (isAbsolute(relativePath)) {
            return relativePath;
        }

        return join(pluginRuntimeDir, relativePath);
    }

    // __________________________________________________________________________
    /**
     * Read a plugin's configuration properties. The properties are obtained
     * from the plugins package.json file, including it's imperative property.
     *
     * @param {string} pluginName - the name of the plugin
     *
     * @returns {IPluginCfgProps} - The plugin's configuration properties
     *    or null if the plugin's configuration cannot be retrieved.
     *    Errors are recorded in PluginIssues.
     */
    private loadPluginCfgProps(pluginName: string): IPluginCfgProps {
        const pluginCfgProps: IPluginCfgProps = {
            pluginName,
            npmPackageName: "PluginHasNoNpmPkgName",
            impConfig: {},
            cliDependency: {
                peerDepName: this.pmfConst.CLI_CORE_PKG_NAME,
                peerDepVer: this.noPeerDependency
            },
            impDependency: {
                peerDepName: this.pmfConst.IMPERATIVE_PKG_NAME,
                peerDepVer: this.noPeerDependency
            }
        };

        this.impLogger.trace("loadPluginCfgProps: Reading configuration for plugin = '" +
            pluginName + "' from its package.json file.");

        // this is the starting point for reporting plugin issues, so clear old ones
        this.pluginIssues.removeIssuesForPlugin(pluginName);

        // confirm that we can find the path to the plugin node_module
        const pluginRunTimeRootPath = this.formPluginRuntimePath(pluginName);
        if (!existsSync(pluginRunTimeRootPath)) {
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CFG_ERROR,
                "The path to the plugin does not exist: " + pluginRunTimeRootPath);
            return null;
        }

        // confirm that we can find the path to the plugin's package.json
        const pluginPkgJsonPathNm = join(pluginRunTimeRootPath, "package.json");
        if (!existsSync(pluginPkgJsonPathNm)) {
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CFG_ERROR,
                "Configuration file does not exist: '" + pluginPkgJsonPathNm + "'");
            return null;
        }

        // read package.json
        let pkgJsonData: any = null;
        try {
            pkgJsonData = readFileSync(pluginPkgJsonPathNm);
        }
        catch (ioErr) {
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CFG_ERROR,
                "Cannot read '" + pluginPkgJsonPathNm +
                "' Reason = " + ioErr.message);
            return null;
        }

        // extract the plugin npm package name property for later use in class
        if (Object.prototype.hasOwnProperty.call(pkgJsonData, this.npmPkgNmProp)) {
            pluginCfgProps.npmPackageName = pkgJsonData[this.npmPkgNmProp];
        }

        // use the CLI's package name as a peer dependency in the plugin
        const cliPkgName = this.getCliPkgName();
        const cliCmdName = ImperativeConfig.instance.rootCommandName;
        if (cliPkgName === "NoNameInCliPkgJson") {
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.WARNING,
                "The property '" + this.npmPkgNmProp +
                "' does not exist in the package.json file of the '" +
                cliCmdName + "' project. Defaulting to " +
                "'" + pluginCfgProps.cliDependency.peerDepName + "',"
            );
        } else {
            pluginCfgProps.cliDependency.peerDepName = cliPkgName;
        }

        // confirm that the peerDependencies property exists in plugin's package.json
        const peerDepPropNm = "peerDependencies";
        if (Object.prototype.hasOwnProperty.call(pkgJsonData, peerDepPropNm)) {
            // get the version of the host CLI dependency for this plugin
            if (Object.prototype.hasOwnProperty.call(pkgJsonData[peerDepPropNm], pluginCfgProps.cliDependency.peerDepName)) {
                pluginCfgProps.cliDependency.peerDepVer =
                    pkgJsonData[peerDepPropNm][pluginCfgProps.cliDependency.peerDepName];
            }

            // get the version of the imperative dependency for this plugin
            if (Object.prototype.hasOwnProperty.call(pkgJsonData[peerDepPropNm], pluginCfgProps.impDependency.peerDepName)) {
                pluginCfgProps.impDependency.peerDepVer =
                    pkgJsonData[peerDepPropNm][pluginCfgProps.impDependency.peerDepName];
            } else {
                this.pluginIssues.recordIssue(pluginName, IssueSeverity.WARNING,
                    "The property '" + pluginCfgProps.impDependency.peerDepName +
                    "' does not exist within the '" + peerDepPropNm +
                    "' property in the file '" + pluginPkgJsonPathNm + "'."
                );
            }
        } else {
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.WARNING,
                "Your '" + this.pmfConst.NPM_NAMESPACE +
                "' dependencies must be contained within a '" + peerDepPropNm +
                "' property. That property does not exist in the file '" +
                pluginPkgJsonPathNm + "'."
            );
        }

        // extract the imperative property
        if (!Object.prototype.hasOwnProperty.call(pkgJsonData, this.impConfigPropNm)) {
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CFG_ERROR,
                "The required property '" + this.impConfigPropNm +
                "' does not exist in file '" + pluginPkgJsonPathNm + "'.");
            return null;
        }

        // use the core imperative loader because it will load config modules

        const timingApi = PerfTiming.api;

        if (PerfTiming.isEnabled) {
            // Marks point START
            timingApi.mark("START_LOAD_PLUGIN");
        }

        let pluginConfig: IImperativeConfig;
        try {
            pluginConfig = ConfigurationLoader.load(
                null, pkgJsonData, this.requirePluginModuleCallback(pluginName)
            );
        }
        catch (impError) {
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CFG_ERROR,
                "Failed to load the plugin's configuration from:\n" +
                pluginPkgJsonPathNm +
                "\nReason = " + impError.message
            );
            return null;
        }

        if (PerfTiming.isEnabled) {
            // Marks point END
            timingApi.mark("END_LOAD_PLUGIN");
            timingApi.measure("Load plugin completed", "START_LOAD_PLUGIN", "END_LOAD_PLUGIN");
        }

        pluginCfgProps.impConfig = pluginConfig;
        return pluginCfgProps;
    }

    // __________________________________________________________________________
    /**
     * Due to configuration errors, we use an override that purposely fails.
     *
     * @param {string} settingNm - The name of the setting being processed.
     * @param {string} overrideDispNm - The display name of override being processed.
     * @param {string} overridePluginNm - The name of plugin supplying the override.
     * @param {string} reasonText - The text describing the reason for the error.
     */
    private useOverrideThatFails(
        settingNm: string,
        overrideDispNm: string,
        overridePluginNm: string,
        reasonText: string
    ): void {
        let overrideErrMsg = `Unable to override "${settingNm}" with "${overrideDispNm}" ` +
            `from plugin "${overridePluginNm}"\nReason = ${reasonText}\n` +
            `We will use a "${settingNm}" that purposely fails until you reconfigure.\n` +
            `You can edit the file $ZOWE_CLI_HOME/settings/imperative.json ` +
            `and enter a value for the "${settingNm}" property`;

        if (settingNm === CredentialManagerOverride.CRED_MGR_SETTING_NAME) {
            overrideErrMsg += `\nFor the "${CredentialManagerOverride.CRED_MGR_SETTING_NAME}" ` +
                `property you can specify "${CredentialManagerOverride.DEFAULT_CRED_MGR_NAME}" ` +
                `or you can install a plugin from the list below:\n\n`;

            /* Add all known credMgr override display names to the error message.
             * This code assumes that the default Zowe credMgr name is first in our knownCredMgrs.
             */
            const knownCredMgrs: ICredentialManagerNameMap[] = CredentialManagerOverride.getKnownCredMgrs();
            overrideErrMsg += `"${settingNm}": "${CredentialManagerOverride.DEFAULT_CRED_MGR_NAME}" (default)`;
            for ( let credMgrInx = 1; credMgrInx < knownCredMgrs.length; credMgrInx++) {
                overrideErrMsg += `\n"${settingNm}": "${knownCredMgrs[credMgrInx].credMgrDisplayName}" `;

                if ( typeof(knownCredMgrs[credMgrInx].credMgrPluginName) !== "undefined") {
                    overrideErrMsg += `(supplied in CLI plugin ${knownCredMgrs[credMgrInx].credMgrPluginName}`;
                }
                if ( typeof(knownCredMgrs[credMgrInx].credMgrZEName) !== "undefined") {
                    const punctuation = 8;
                    overrideErrMsg += "\n";
                    for (let indent: number = 0; indent <
                        settingNm.length + knownCredMgrs[credMgrInx].credMgrDisplayName.length + punctuation;
                        indent++ )
                    {
                        overrideErrMsg += " ";
                    }
                    overrideErrMsg += `and in ZE extension ${knownCredMgrs[credMgrInx].credMgrZEName}`;
                }
                overrideErrMsg += `)`;
            }
        }

        // log our error message and create a failing override class that throws the same error.
        this.impLogger.error(overrideErrMsg);

        /* We need to assign a class into the current override setting.
         * We cannot create a new object from a class and pass the error into its
         * constructor, because the CredentialManagerFactory takes a class and
         * it calls the constructor of our supplied class. Thus we need an
         * anonymous class so that we can access our 'overrideErrMsg' variable.
         * Our trick is that we simply throw an error in the constructor
         * of our anonymous class. The CredentialManagerFactory catches
         * our error, and places it into its InvalidCredentialManager, which
         * in turn shows our error every time the CLI tries to use credentials.
         */
        (this.mPluginOverrides as any)[settingNm] = class {
            constructor() {
                throw overrideErrMsg;
            }
        };
    }

    // __________________________________________________________________________
    /**
     * Validates that the semver range strings specified by the plugin for
     * versions of the imperative framework and host CLI program are compatible
     * with those specified in the host CLI.
     *
     * Both range strings come from the package.json files of the plugin and the
     * hosting CLI. We consider the version ranges to be compatible if the two
     * ranges intersect. This should allow npm to download one common version
     * of core and of imperative to be owned by the base CLI and shared by the plugin.
     *
     * Any errors are recorded in PluginIssues.
     *
     * @param {IPluginCfgProps} pluginCfgProps - The configuration properties for this plugin
     */
    private validatePeerDepVersions(pluginCfgProps: IPluginCfgProps): void {
        // get the name of the base CLI for error messages
        const cliCmdName = ImperativeConfig.instance.rootCommandName;
        const cliPackageJson: any = ImperativeConfig.instance.callerPackageJson;
        let cliVerPropName = "version";

        // compare the plugin's requested CLI version with the CLI's actual version
        if (pluginCfgProps.cliDependency.peerDepVer !== this.noPeerDependency) {
            if (Object.prototype.hasOwnProperty.call(cliPackageJson, cliVerPropName)) {
                this.comparePluginVersionToCli(
                    pluginCfgProps.pluginName,
                    pluginCfgProps.cliDependency.peerDepName,
                    pluginCfgProps.cliDependency.peerDepVer,
                    cliVerPropName,
                    cliPackageJson[cliVerPropName]
                );
            } else {
                this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CFG_ERROR,
                    "The property '" + cliVerPropName +
                    "' does not exist within the package.json file of the '" +
                    cliCmdName + "' project."
                );
            }
        }

        // compare the plugin's requested imperative version with the CLI's actual version
        if (pluginCfgProps.impDependency.peerDepVer !== this.noPeerDependency) {
            /* The CLI's imperative version is within its dependencies property
             * under the same property name as the plugin uses.
             */
            const cliDepPropName = "dependencies";
            cliVerPropName = pluginCfgProps.impDependency.peerDepName;
            if (Object.prototype.hasOwnProperty.call(cliPackageJson, cliDepPropName)) {
                if (Object.prototype.hasOwnProperty.call(cliPackageJson[cliDepPropName], cliVerPropName)) {
                    this.comparePluginVersionToCli(
                        pluginCfgProps.pluginName,
                        pluginCfgProps.impDependency.peerDepName,
                        pluginCfgProps.impDependency.peerDepVer,
                        cliVerPropName,
                        cliPackageJson[cliDepPropName][cliVerPropName]
                    );
                } else {
                    this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CFG_ERROR,
                        "The property '" + cliVerPropName +
                        "' does not exist within the '" + cliDepPropName +
                        "' property in the package.json file of the '" +
                        cliCmdName + "' project."
                    );
                }
            } else {
                this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CFG_ERROR,
                    "The property '" + cliDepPropName +
                    "' does not exist in the package.json file of the '" +
                    cliCmdName + "' project."
                );
            }
        }
    }

    // __________________________________________________________________________
    /**
     * Validate the plugin.
     *
     * @param {IPluginCfgProps} pluginCfgProps - The configuration properties for this plugin
     *
     * @param {ICommandDefinition} pluginCmdGroup - The command group to be added
     *        for this plugin, with all commands resolved into its children property.
     *
     * @returns {boolean} - True if valid. False otherwise.
     *        PluginIssues contains the set of issues.
     */
    private validatePlugin(
        pluginCfgProps: IPluginCfgProps,
        pluginCmdGroup: ICommandDefinition
    ): boolean {
        if (JsUtils.isObjEmpty(pluginCfgProps.impConfig)) {
            // without a config object, we can do no further validation
            this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CFG_ERROR,
                "The plugin's configuration is empty.");
            return false;
        }

        this.impLogger.info("validatePlugin: Validating plugin '" +
            pluginCfgProps.pluginName + "'. Plugin config details at trace level of logging."
        );
        this.impLogger.trace("validatePlugin: Config for plugin '" +
            pluginCfgProps.pluginName + "':\n" +
            JSON.stringify(pluginCfgProps.impConfig, null, 2)
        );

        // is there an imperative.name property?
        if (!Object.prototype.hasOwnProperty.call(pluginCfgProps.impConfig, "name")) {
            // can we default to the npm package name?
            if (pluginCfgProps.npmPackageName === "PluginHasNoNpmPkgName" ||
                pluginCfgProps.npmPackageName.length === 0) {
                this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CFG_ERROR,
                    "The plugin's configuration does not contain an '" +
                    this.impConfigPropNm + ".name' property, or an npm package 'name' property in package.json.");
            } else {
                pluginCfgProps.impConfig.name = pluginCfgProps.npmPackageName;
            }
        }

        /* Confirm that the plugin group name does not conflict with another
         * top-level item in the imperative command tree.
         */
        if (Object.prototype.hasOwnProperty.call(pluginCfgProps.impConfig, "name")) {
            for (const nextImpCmdDef of this.resolvedCliCmdTree.children) {
                const conflictAndMessage = this.conflictingNameOrAlias(pluginCfgProps.pluginName,
                    pluginCmdGroup, nextImpCmdDef);
                if (conflictAndMessage.hasConflict) {
                    this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CMD_ERROR,
                        conflictAndMessage.message);
                    break;
                }
            }
        }

        if (!Object.prototype.hasOwnProperty.call(pluginCfgProps.impConfig, "rootCommandDescription")) {
            this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CMD_ERROR,
                "The plugin's configuration does not contain an '" +
                this.impConfigPropNm + ".rootCommandDescription' property.");
        }

        /* Validate that versions of the imperative framework and
         * host CLI program are compatible with those of the host CLI.
         */
        this.validatePeerDepVersions(pluginCfgProps);

        /* If a plugin does neither of the following actions, we reject it:
         *   - define commands
         *   - override an infrastructure component
         */
        if ((!pluginCmdGroup.children || pluginCmdGroup.children.length <= 0) &&
            (!pluginCfgProps.impConfig.overrides || Object.keys(pluginCfgProps.impConfig.overrides).length <= 0)) {
            this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CFG_ERROR,
                "The plugin defines no commands and overrides no framework components.");
        } else {
            // recursively validate the plugin's command definitions
            this.validatePluginCmdDefs(pluginCfgProps.pluginName, pluginCmdGroup.children);
        }

        /* Plugins are not required to have profiles.
         * So, if they do not exist, just move on.
         */
        if (pluginCfgProps.impConfig.profiles) {
            this.validatePluginProfiles(pluginCfgProps.pluginName, pluginCfgProps.impConfig.profiles);
        }

        /* Now that we have done plugin-specific validation, let the imperative
         * ConfigurationValidator perform it's detailed validation.
         *
         * The core imperative validator demands some properties required by
         * a CLI, which are not required for a plugin. So, we add all required
         * properties to a temporary plugin config, just so that we can use
         * the validator to validate all of the other properties.
         *
         * We place this check last, since it finds one error and throws an exception.
         */
        const pluginConfigToValidate: IImperativeConfig = { ...pluginCfgProps.impConfig };
        if (!Object.prototype.hasOwnProperty.call(pluginConfigToValidate, "defaultHome")) {
            pluginConfigToValidate.defaultHome = "defaultHome-ForValidation";
        }
        if (!Object.prototype.hasOwnProperty.call(pluginConfigToValidate, "productDisplayName")) {
            pluginConfigToValidate.productDisplayName = "productDisplayName-ForValidation";
        }

        try {
            ConfigurationValidator.validate(pluginConfigToValidate);
        }
        catch (impError) {
            this.pluginIssues.recordIssue(pluginCfgProps.pluginName, IssueSeverity.CFG_ERROR,
                "The plugin configuration is invalid.\nReason = " +
                impError.message
            );
        }

        return !this.pluginIssues.doesPluginHaveIssueSev(pluginCfgProps.pluginName,
            [IssueSeverity.CFG_ERROR, IssueSeverity.CMD_ERROR]);
    }

    // __________________________________________________________________________
    /**
     * Validate a plugin's array of command definitions at the specified depth
     * within the plugin's command definition tree. This is a recursive function
     * used to navigate down through the command tree, validating as we go.
     * If errors occur, they are recorded in PlugIssues.
     *
     * @param {string} pluginName - The name of the plugin.
     *
     * @param {ICommandDefinition[]} pluginCmdDefs - Array of plugin commands.
     *
     * @param {number} cmdTreeDepth - The depth within the plugin command
     *        tree at which we are validating. It is used within error messages.
     */
    private validatePluginCmdDefs(
        pluginName: string,
        pluginCmdDefs: ICommandDefinition[],
        cmdTreeDepth: number = 1
    ): void {
        for (const pluginCmdDef of pluginCmdDefs) {
            // check for name property
            let pluginCmdName: string = "NotYetAssigned";
            if (Object.prototype.hasOwnProperty.call(pluginCmdDef, "name")) {
                pluginCmdName = pluginCmdDef.name + " (at depth = " + cmdTreeDepth + ")";
            } else {
                this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                    "Command definition at depth " + cmdTreeDepth + " has no 'name' property");
                pluginCmdName = "No name supplied at depth = " + cmdTreeDepth;
            }

            // check for description property
            if (!Object.prototype.hasOwnProperty.call(pluginCmdDef, "description")) {
                this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                    "Name = '" + pluginCmdName + "' has no 'description' property");
            }

            // check for type property
            if (!Object.prototype.hasOwnProperty.call(pluginCmdDef, "type")) {
                this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                    "Name = '" + pluginCmdName + "' has no 'type' property");
            } else {
                // is this entry a command?
                if (pluginCmdDef.type.toLowerCase() === "command") {
                    // a command must have a handler or a chained handler
                    if (!Object.prototype.hasOwnProperty.call(pluginCmdDef, "handler")) {
                        // if it doesn't have a handler, does it have a chained handler
                        if (Object.prototype.hasOwnProperty.call(pluginCmdDef, "chainedHandlers")) {
                            // if the command has chained handlers, verify they exist
                            if (pluginCmdDef.chainedHandlers.length > 0) {
                                for (const cmdHandler of pluginCmdDef.chainedHandlers) {
                                    if (!Object.prototype.hasOwnProperty.call(cmdHandler, "handler")) {
                                        // the chained handler doesn't contain a handler
                                        this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                                            "Command name = '" + pluginCmdName + "' has no 'handler' property in one of its chained handlers.");
                                    } else {
                                        // the handler file must exist
                                        const handlerModulePath =
                                            this.formPluginRuntimePath(pluginName, cmdHandler.handler);
                                        const handlerFilePath = handlerModulePath + ".js";
                                        if (existsSync(handlerFilePath)) {
                                            // replace relative path with absolute path in the handler property
                                            cmdHandler.handler = handlerModulePath;
                                        } else {
                                            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                                                "A chained handler for command = '" + pluginCmdName +
                                                "' does not exist: " + handlerFilePath);
                                        }
                                    }
                                }
                            } else {
                                // the chained handler list is empty
                                this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                                    "Command name = '" + pluginCmdName + "' has defined 'chainedHandler' property but contains no handlers.");
                            }
                        } else {
                            // there was not a handler or a chained handler
                            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                                "Command name = '" + pluginCmdName + "' has no 'handler' property");
                        }
                    } else {
                        // the handler file must exist
                        const handlerModulePath =
                            this.formPluginRuntimePath(pluginName, pluginCmdDef.handler);
                        const handlerFilePath = handlerModulePath + ".js";
                        if (existsSync(handlerFilePath)) {
                            // replace relative path with absolute path in the handler property
                            pluginCmdDef.handler = handlerModulePath;
                        } else {
                            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                                "The handler for command = '" + pluginCmdName +
                                "' does not exist: " + handlerFilePath);
                        }
                    }
                } else if (pluginCmdDef.type.toLowerCase() === "group") {
                    if (Object.prototype.hasOwnProperty.call(pluginCmdDef, "children")) {
                        if (pluginCmdDef.children.length > 0) {
                            // validate children at the next level down in the plugin command tree
                            this.validatePluginCmdDefs(pluginName, pluginCmdDef.children, cmdTreeDepth + 1);
                        } else {
                            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                                "Group name = '" + pluginCmdName +
                                "' has a 'children' property with no children");
                        }
                    } else {
                        // A group must have the children property.
                        this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                            "Group name = '" + pluginCmdName + "' has no 'children' property");
                    }
                } // end group
            } // end has type
        } // end for pluginCmdDefs
    } // end validatePluginCmdDefs

    // __________________________________________________________________________
    /**
     * Validate a plugin's array of profiles
     * If errors occur, they are recorded in PlugIssues.
     *
     * @param {string} pluginName - The name of the plugin.
     *
     * @param {ICommandProfileTypeConfiguration[]} pluginProfiles - Array of profiles.
     */
    private validatePluginProfiles(
        pluginName: string,
        pluginProfiles: ICommandProfileTypeConfiguration[]
    ): void {
        if (JsUtils.isObjEmpty(pluginProfiles)) {
            this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                "The plugin's existing 'profiles' property is empty.");
            return;
        }

        const impHasNoProfiles: boolean =
            JsUtils.isObjEmpty(ImperativeConfig.instance.loadedConfig) ||
            JsUtils.isObjEmpty(ImperativeConfig.instance.loadedConfig.profiles);

        // reject profiles whose top-level type conflicts with an existing profile
        const pluginProfLength = pluginProfiles.length;
        for (let currProfInx = 0; currProfInx < pluginProfLength; currProfInx++) {
            /* Reject a plugin profile that has the same profile type value as
             * an another plugin profile. We only need to compare with the
             * remaining profiles from our plugin.
             */
            let nextProfInx = currProfInx + 1;
            while (nextProfInx < pluginProfLength) {
                if (pluginProfiles[currProfInx].type === pluginProfiles[nextProfInx].type) {
                    this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                        "The plugin's profiles at indexes = '" + currProfInx +
                        "' and '" + nextProfInx + "' have the same 'type' property = '" +
                        pluginProfiles[currProfInx].type + "'."
                    );
                }
                nextProfInx++;
            }

            /* Reject a plugin profile that has the same profile type value as
             * an existing imperative profile.
             */
            if (impHasNoProfiles) {
                continue;
            }
            for (const impProfile of ImperativeConfig.instance.loadedConfig.profiles) {
                if (pluginProfiles[currProfInx].type === impProfile.type) {
                    this.pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR,
                        "The plugin's profile type = '" + pluginProfiles[currProfInx].type +
                        "' already exists within existing profiles."
                    );
                }
            }
        }
    }
} // end PluginManagementFacility
