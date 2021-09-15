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

/* Validate any existing plugins. We do this when the user has re-installed
 * brightside. It is a safety net to validate whether any existing plugins
 * are incompatible with newly installed brightside/imperative.
 *
 * This script is run in our package.json:scripts:postinstall as:
 *    node ./scripts/validatePlugins.js
 * to re-validate plugins if zowe has just been re-installed.
 *
 * We can only run the zowe plugins validate command if zowe's main
 * program exists. If the project has not been built yet in a local source
 * directory retrieved from GitHub, main will not exist. An end-user install
 * should always have a main program. So, we must check if lib/main.js exists.
 */

function validatePlugins() {
    const fs = require('fs');

    // only run the zowe command when main has been built
    const zowePgm = process.cwd() + "/lib/main.js";
    if (fs.existsSync(zowePgm)) {
        /* Imperative gets its root directory from the mainModule filename,
        * which is currently set to this script. Make it look like the script
        * being run by NodeJS is main.js.
        */
        process.mainModule.filename = zowePgm;

        // add the parameters for the zowe command to validate plugins
        process.argv.push("plugins");
        process.argv.push("validate");

        console.log("Since you re-installed Zowe CLI, we are re-validating any plugins.");
        require(zowePgm);
    }
};

module.exports = validatePlugins;