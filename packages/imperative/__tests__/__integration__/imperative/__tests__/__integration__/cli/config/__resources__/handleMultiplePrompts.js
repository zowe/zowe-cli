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
 * This file is used to handle multiple prompts interactively
 * 
 * For example: `zowe config init` may prompt for host, user, password, etc.
 *    You can call this script with the command and values to provide as input
 * 
 * `node /path/to/handleMultiplePrompts.js "$command" "$values"`
 * `node /path/to/handleMultiplePrompts.js "zowe config init" "localhost myUser p@ssw0rd"`
 * 
 * Note: 
 *    The command and values should be space separated
 */

/**
 * Import required modules and libraries
 */
const cp = require('child_process');
const os = require('os');

/**
 * Process the command to execute and the given values to provide as input
 */
const command = process.argv[2].trim().split(' ');
const values = process.argv[3].trim().split(' ');

/**
 * Get the full path of the test CLI
 * This is platform dependent since `which` is not available on Windows
 * 
 */
const testCliPath = cp.spawnSync(process.platform === 'win32' ? 'where' : 'which', [command[0]]).stdout.toString().trim();

/**
 * Process the output of the which/where command above
 * Fallback to the original command if the test CLI is not found
 */
command[0] = testCliPath.length > 0 && !testCliPath.includes("not found") ? testCliPath : command[0];

/**
 * Spawn the child process to run the test CLI
 * This is also platform dependent since Windows need an interpreter to run the test-cli executable script
 * For other platforms, the script is run directly (by shifting the test-cli out of the command array)
 */
const child = cp.spawn(process.platform === 'win32' ? "sh" : command.shift(), command, { stdio: "pipe" });

/**
 * Process the output of the child process
 */
child.stdout.on('data', (data) => {
  /**
   * We still need to print the stdout to the console in order for the tests to pass
   */
  console.log(data.toString());

  /**
   * If the output includes "Press ENTER to skip:" or "(will be hidden):",
   *    we need to provide the next value to the child process.
   */
  if (data.toString().includes("Press ENTER to skip:") || data.toString().includes("(will be hidden):")) {
    /**
     * Shift the next value from the values array and write it to the child process
     * Note: we need to add a new line character to the end of the value (which is also platform dependent)
     */
    child.stdin.write(values.shift() + os.EOL);

    /**
     * Check if we have processed all the values
     */
    if (values.length === 0) {
      /**
       * Make sure to close the stdin pipe to the child process in order to prevent any further input
       */
      child.stdin.end();
    }
  }
});
