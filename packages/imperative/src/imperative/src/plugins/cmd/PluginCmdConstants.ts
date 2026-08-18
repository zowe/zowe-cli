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

import { PMFConstants } from "../utilities/PMFConstants";
import { ImperativeConfig } from "../../../../utilities";

const cliCmdName = ImperativeConfig.instance.findPackageBinName() ?
    ImperativeConfig.instance.findPackageBinName() : "Your_CLI_Command_Name";

/**
 * Descriptions used by the plugin command definitions (e.g. install and update).
 */
export class PluginCmdConstants {
    public static readonly INSTALL_PLUGIN_DESCRIPTION: string =
        "A space-separated list of plug-ins to install. A plug-in can be " +
        "any format that is accepted by the `npm install` command (local directory, " +
        "TAR file, git URL, public package, private package, etc.).\n" +
        "\n" +
        "To use a relative local directory, at least one '/' or '\\' must exist in " +
        "the plug-in path. For example, there is a local plug-in in folder 'test-plugin' " +
        "that you want to install. Specify the relative local directory by issuing the following command:\n\n" +
        `${cliCmdName} plugins install ./test-plugin\n\n` +
        "If you omit the './', the install command looks for 'test-plugin' in an NPM registry.\n" +
        "\n" +
        "If the `plugin` argument is omitted, the plugins.json file determines which " +
        "plug-ins are installed. For more information on the plugins.json file, see the --file entry in the Options section.";

    public static readonly UPDATE_PLUGIN_DESCRIPTION: string =
        "The name of the plug-in to update.\n\n" +
        "If omitted, no action is taken.";

    public static readonly FILE_DESCRIPTION: string =
        "The location of a plugins.json file that contains the plug-ins you want to install.\n" +
        "\n" +
        "All plug-ins specified in plugins.json are installed to the base CLI and " +
        `the contents are placed into ${PMFConstants.instance.PLUGIN_JSON}.\n` +
        "\n" +
        "If you do not specify a plugins.json file and do not specify a plug-in, the default " +
        `plugin.json file (${PMFConstants.instance.PLUGIN_JSON}) is used. This provides a ` +
        "way to install plug-ins that were lost or corrupted after " +
        `reinstalling or updating ${ImperativeConfig.instance.loadedConfig.productDisplayName}.`;

    public static readonly REGISTRY_DESCRIPTION: string =
        "The NPM registry that is used when installing remote packages. When omitted, the " +
        "value returned by `npm config get registry` is used.\n" +
        "\n" +
        "For more information about NPM registries, see: " +
        "https://docs.npmjs.com/misc/registry";

    public static readonly LOGIN_DESCRIPTION: string =
        "The flag to add a registry user account to install from secure registry. It saves credentials " +
        "to the `.npmrc` file using `npm login`.\n\n" +
        "When omitted, credentials from `.npmrc` file are used. " +
        "If you used this flag once for specific registry, you do not have to use it again, it uses credentials from `.npmrc` file.\n" +
        "\n" +
        "For more information about NPM registries, see: \n" +
        "  https://docs.npmjs.com/cli/login";

    public static readonly VERBOSE_DESCRIPTION: string =
        "Verbose output is printed for NPM install.\n\n" +
        "This can be useful for debugging errors during plug-in installation.";

    public static readonly ALLOW_SCRIPTS_DESCRIPTION: string =
        "A comma-separated list of package names that are allowed to run their NPM install scripts " +
        "(preinstall, install, postinstall, and prepare). The names must match. Zowe passes " +
        "this list to NPM as its own --allow-scripts option.\n" +
        "\n" +
        "NPM 12 blocks these scripts unless the package is in the list. This breaks plug-ins that " +
        "have a dependency that must be built during install, such as the Db2 plug-in and its " +
        "ibm_db dependency. Older versions of NPM do not know this option and ignore it, so using " +
        "this option does not change how they work. Older versions of NPM may show a warning about " +
        "the --allow-scripts option being unknown. This warning can be safely ignored. " +
        "When omitted, Zowe does not pass anything to NPM, and NPM decides what to do.\n" +
        "\n" +
        "Only list packages that you trust. Install scripts can run any code on your machine.";
}
