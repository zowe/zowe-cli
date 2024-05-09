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
 * This interface represents the association of plugin name, VS Code extension name,
 * and credential manager override name for components that override the default
 * credential manager. Our imperative module will keep a list of known plugins and
 * VS Code extensions that can override the default credential manager. The name of
 * the default credential manager will also be in that list. Imperative will be
 * able to use this name mapping to identify the correct plugin or extension which
 * provides a given credential manager override.
 */

export interface ICredentialManagerNameMap {

    /**
     * Name of the credential manager. This is the name that will be stored in
     * $ZOWE_CLI_HOME/settings/imperative.json.
     */
    credMgrDisplayName: string;

    /**
     * Name of the plugin that supplies the credential manager override software.
     * A credential manager supplier must supply a CLI plugin, or a ZE extension,
     * or both.
     */
    credMgrPluginName?: string;

    /**
     * Name of the Zowe Explorer extension that supplies the credential manager
     * override software. A credential manager supplier must supply a CLI plugin,
     * or a ZE extension, or both.
     */
    credMgrZEName?: string;
}
