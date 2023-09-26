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

import { ImperativeConfig } from "../../../../../utilities/src/__mocks__/ImperativeConfig";
import { Config } from "../../../../../config/src/__mocks__/Config";

/**
 * Mock PMFConstants class
 */
export class PMFConstants {
    private static mInstance: PMFConstants;

    public static get instance(): PMFConstants {
        if (PMFConstants.mInstance == null) {
            PMFConstants.mInstance = new PMFConstants();
        }

        return PMFConstants.mInstance;
    }

    public readonly NPM_NAMESPACE: string;
    public readonly IMPERATIVE_PKG_NAME: string;
    public readonly CLI_CORE_PKG_NAME: string;
    public readonly PMF_ROOT: string;
    public readonly PLUGIN_JSON: string;
    public readonly PLUGIN_INSTALL_LOCATION: string;
    public readonly PLUGIN_HOME_LOCATION: string;
    public readonly PLUGIN_NODE_MODULE_LOCATION: string[];
    public readonly PLUGIN_USING_CONFIG: boolean;
    public readonly PLUGIN_CONFIG: Config;

    constructor() {
        this.NPM_NAMESPACE = "@zowe";
        this.IMPERATIVE_PKG_NAME = ImperativeConfig.instance.imperativePackageName;
        this.CLI_CORE_PKG_NAME = ImperativeConfig.instance.hostPackageName;
        this.PMF_ROOT = "/sample-cli/home/plugins/";
        this.PLUGIN_JSON = this.PMF_ROOT + "plugins.json";
        this.PLUGIN_INSTALL_LOCATION = "/sample-cli/install";
        this.PLUGIN_HOME_LOCATION = `${this.PLUGIN_INSTALL_LOCATION}/lib/node_modules`;
        this.PLUGIN_NODE_MODULE_LOCATION = [this.PLUGIN_HOME_LOCATION];
        this.PLUGIN_USING_CONFIG = true;
        this.PLUGIN_CONFIG = Config.load(ImperativeConfig.instance.hostPackageName);
    }
}
