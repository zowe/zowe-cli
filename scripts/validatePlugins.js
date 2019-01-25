/* Validate any existing plugins. We do this when the user has re-installed
 * the CLI. It is a safety net to validate whether any existing plugins
 * are incompatible with newly installed brightside/imperative.
 *
 * This script is run in our package.json:scripts:postinstall as:
 *    node ./scripts/validatePlugins.js
 * to re-validate plugins if bright has just been re-installed.
 *
 * We can only run the bright plugins validate command if bright's main
 * program exists. If the project has not been built yet in a local source
 * directory retrieved from GitHub, main will not exist. An end-user install
 * should always have a main program. So, we must check if lib/main.js exists.
 */

const fs = require('fs');

// only run the bright command when main has been built
const brightPgm = process.cwd() + "/lib/main.js";
if (fs.existsSync(brightPgm)) {
    /* Imperative gets its root directory from the mainModule filename,
     * which is currently set to this script. Make it look like the script
     * being run by NodeJS is main.js.
     */
    process.mainModule.filename = brightPgm;

    // add the parameters for the bright command to validate plugins
    process.argv.push("plugins");
    process.argv.push("validate");

    console.log("Since you re-installed the CLI, we are re-validating any plugins.");
    require(brightPgm);
}
