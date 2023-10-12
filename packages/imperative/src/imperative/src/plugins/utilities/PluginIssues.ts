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

import { IPluginIssues, IPluginIssue } from "../doc/IPluginIssues";
import { IPluginJson } from "../doc/IPluginJson";
import { ImperativeError } from "../../../../error";
import { PMFConstants } from "./PMFConstants";
import { readFileSync } from "jsonfile";

/**
 * This enum represents the possible severity types of a plugin issue.
 */
export enum IssueSeverity {
    /**
   * Configuration errors. We cannot even properly define this plugin.
   * The plugin cannot be used.
   */
    CFG_ERROR = "CfgError",

    /**
   * An error in a plugin's set of commands.
   * The plugin's commands will not be loaded into the host CLI app.
   * It's overrides may be used.
   */
    CMD_ERROR = "CmdError",

    /**
   * An error in a plugin's override component.
   * The plugin's overrides will not be used by imperative
   * It's commands may be added to the host CLI app.
   */
    OVER_ERROR = "OverrideError",

    /**
   * Warnings identify optional items not implemented by a plugin.
   */
    WARNING = "Warning"
}

/**
 * This class is used to record and access plugin errors and warnings.
 * It is a singleton and should be accessed via PluginIssues.instance.
 */
export class PluginIssues {
    /**
   * This is the variable that stores the specific instance of the PluginIssues.
   * Defined as static so that it can be accessed from anywhere.
   *
   * @private
   * @type {PluginIssues}
   */
    private static mInstance: PluginIssues;

    /**
   * A map containing issues  for each plugin for which problems were detected.
   *
   * @private
   * @type {IPluginIssues}
   */
    private pluginIssues: IPluginIssues = {};

    /**
   * The set of installed plugins. We access this class property only
   * through its accompanying function
   * [getInstalledPlugins]{@link PluginIssues#getInstalledPlugins}
   * to ensure that we only read the file once and reduce excessive I/O.
   *
   * @private
   * @type {IPluginJson}
   */
    private installedPlugins: IPluginJson = null;

    // ___________________________________________________________________________
    /**
   * Gets a single instance of the PluginIssues. On the first call of
   * PluginIssues.instance, a new Plugin Issues object is initialized and returned.
   * Every subsequent call will use the one that was first created.
   *
   * @returns {PluginIssues} The newly initialized PMF object.
   */
    public static get instance(): PluginIssues {
        if (this.mInstance == null) {
            this.mInstance = new PluginIssues();
        }

        return this.mInstance;
    }

    // ___________________________________________________________________________
    /**
   * Reports whether or not a plugin has any issues with any of the specified
   * severities.
   *
   * @param {string} pluginName - The name of the plugin
   *
   * @param {string} issueSevs - An array of issue severities.
   *
   * @returns {boolean} - True if any plugin issues have any of the severities.
   *                      False otherwise.
   */
    public doesPluginHaveIssueSev(pluginName: string, issueSevs: IssueSeverity[]): boolean {
        if (Object.prototype.hasOwnProperty.call(this.pluginIssues, pluginName)) {
            for (const nextSev of issueSevs) {
                for (const nextIssue of this.pluginIssues[pluginName].issueList) {
                    if (nextIssue.issueSev === nextSev) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // ___________________________________________________________________________
    /**
   * Get the issues recorded for all plugins.
   * @returns {IPluginIssues} - Map of plugin names to their array of issues.
   */
    public getAllIssues(): IPluginIssues {
        return this.pluginIssues;
    }

    // __________________________________________________________________________
    /**
   * Get the set of installed plugins. This function should be the only means
   * used to access our installedPlugins class variable.
   *
   * @returns {IPluginJson} - The set of installed plugins.
   */
    public getInstalledPlugins(): IPluginJson {
        if (this.installedPlugins == null) {
            try {
                this.installedPlugins = readFileSync(PMFConstants.instance.PLUGIN_JSON);
            }
            catch (ioErr) {
                throw new ImperativeError({
                    msg:  "Cannot read '" + PMFConstants.instance.PLUGIN_JSON +
          "' Reason = " + ioErr.message,
                    causeErrors: ioErr
                });
            }
        }
        return this.installedPlugins;
    }

    // ___________________________________________________________________________
    /**
   * Get the array of issues for the specified plugin.
   * @param {string} pluginName - The name of the plugin
   * @returns {IPluginIssue[]} - Array of issues for the plugin.
   *                             If no issues, an empty array is returned.
   */
    public getIssueListForPlugin(pluginName: string): IPluginIssue[] {
        if (Object.prototype.hasOwnProperty.call(this.pluginIssues, pluginName)) {
            return this.pluginIssues[pluginName].issueList;
        }
        return [];
    }

    // ___________________________________________________________________________
    /**
   * Remove the specified plugin from the collection of plugin issues.
   * @param {string} pluginName - The name of the plugin to remove
   */
    public removeIssuesForPlugin(pluginName: string): void {
        if (Object.prototype.hasOwnProperty.call(this.pluginIssues, pluginName)) {
            delete this.pluginIssues[pluginName];
        }
    }

    // ___________________________________________________________________________
    /**
   * Record an issue that was discovered in a plugin into an in-memory structure.
   * The plugin issues can later be accessed to report the health of a plugin.
   * @param {string} pluginName - The name of the plugin
   * @param {IssueSeverity} issueSev - The severity of the issue.
   *                            Use PluginIssues.ERROR or PluginIssues.WARNING
   * @param {string} issueText - The issue message text to record.
   */
    public recordIssue(pluginName: string, issueSev: IssueSeverity, issueText: string): void {
        const issue: IPluginIssue = {
            issueSev,
            issueText
        };
        if (Object.prototype.hasOwnProperty.call(this.pluginIssues, pluginName)) {
            // add to an existing issue list for this plugin
            this.pluginIssues[pluginName].issueList.push(issue);
        } else {
            // create an new issue object for this plugin
            this.pluginIssues[pluginName] = {
                issueList: [issue]
            };
        }
    }
}
