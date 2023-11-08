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

const childProcess = require("child_process");
const path = require("path");
const glob = require("glob");

process.chdir(__dirname + "/..");
const npmPrefix = path.join(process.cwd(), ".npm-global");

function runAll(callback, parallel=false) {
    if (!parallel) {
        glob.sync("packages/core/__tests__/__integration__/*").forEach((dir) => {
            const command = callback(dir);
            childProcess.execSync(command.command, { cwd: command.cwd, stdio: "inherit" });
        });
    } else {
        require("concurrently")(glob.sync("packages/core/__tests__/__integration__/*").map((dir) => callback(dir)));
    }
}

switch (process.argv[2]) {
    case "build":
        runAll((dir) => ({ command: "npm run build", cwd: dir }), true);
        break;
    case "install":
        runAll((dir) => ({ command: `npm install -g . --prefix ${npmPrefix} --install-links=false`, cwd: dir }));
        const binMap = {
            cmd: "lib/node_modules/cmd-sample-cli/lib/index.js",
            hello_world: "lib/node_modules/hello-world-cli/lib/index.js",
            imperative: "lib/node_modules/imperative-test-cli/lib/main.js"
        };
        runAll((dir) => ({command: `chmod +x ${npmPrefix}/${binMap[path.basename(dir)]} || echo ${dir}`, cwd: dir }));
        break;
    case "uninstall":
        // Delete install folder since npm uninstall doesn't work as expected: https://github.com/npm/npm/issues/17905
        // runAll((dir) => ({ command: `npm uninstall -g ${path.basename(dir)} --prefix ${npmPrefix}` }));
        require("rimraf").sync(npmPrefix);
        break;
}
