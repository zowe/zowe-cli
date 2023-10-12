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

import { IssueSeverity } from "../utilities/PluginIssues";

/**
 * Structure for the list of plugin issues.
 */
export interface IPluginIssues {
    /**
   * The plugin name is the key into a hash of validation issues.
   */
    [pluginName: string]: {
        issueList: IPluginIssue[];
    };
}

export interface IPluginIssue {
    /**
   * Each entry is the text of the issue and the severity of the issue.
   */
    issueText: string;
    issueSev: IssueSeverity;   // one of PluginIssues.IssueSeverity enum
}
