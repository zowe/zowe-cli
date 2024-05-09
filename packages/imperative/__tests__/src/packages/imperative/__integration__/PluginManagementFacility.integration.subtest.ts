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

import { IO } from "../../../../../src/io";
import * as T from "../../../TestUtil";
import { join } from "path";
import { config } from "../plugins/PluginTestConstants";

const testCliNodeModulePath = join(__dirname, "..", "plugins", "test_cli", "node_modules");
const impLibDir = join(__dirname, "../../../../../lib");

describe("Plugin Management Facility", () => {
    const home = config.defaultHome;

    beforeAll(() => {
        /**
         * The plugin module loader will inject Imperative to plugins provided
         * it exists in TestCLI's node modules. Our TestCLI does not have a real
         * imperative node_module - it is only a test CLI. Also, this entire test
         * environment lives under the imperative source tree. So, we create a
         * symbolic link from the TestCLI back up to our own imperative source
         * tree's lib directory. All of the modules then find things where they
         * expect to see them.
         */
        const namespaceDirPath = join(testCliNodeModulePath, "@zowe");
        IO.mkdirp(namespaceDirPath);
        const testCliImpSymLink = join(namespaceDirPath, "imperative");
        IO.createSymlinkToDir(testCliImpSymLink, impLibDir);
    });

    beforeEach(() => {
        T.rimraf(home);
        // Some test may still need this directory to exists in order to spawn zowe commands in that location
        // (e.g. node --require ts-node/register <absolute-path-for-TestCLI.ts> config init)
        IO.mkdirp(home);
    });

    afterAll(() => {
        // remove the subdirectories and symbolic link that we created
        IO.deleteDirTree(testCliNodeModulePath);
    });

    require("../plugins/suites/InstallingPlugins");
    require("../plugins/suites/ValidatePlugin");
    require("../plugins/suites/UsingPlugins");
    require("../plugins/suites/UninstallPlugins");
    require("../plugins/suites/ListPlugins");
    require("../plugins/suites/UpdatePlugins");
});
