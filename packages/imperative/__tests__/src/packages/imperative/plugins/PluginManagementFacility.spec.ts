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

import { IImperativeConfig } from "../../../../../packages/imperative";
import { IO } from "../../../../../packages/io";
import * as T from "../../../../src/TestUtil";
import { join } from "path";

/////////////////////////////////////////////////////////////////////////////
//////////// USE ONLY FROM WITHIN /test/src/packages/plugins ////////////////
/////////////////////////////////////////////////////////////////////////////
/**
 * The config of the test cli
 * @type {IImperativeConfig}
 */
export const config: IImperativeConfig = require(join(__dirname, "test_cli", "TestConfiguration"));

/**
 * The bin directory for plugins tests
 * @type {string}
 */
export const cliBin: string = join(__dirname, "test_cli", "TestCLI.ts");

/**
 * The name of the plugin group to run tests on. In the event it changes in the future
 * @type {string}
 */
export const pluginGroup: string = "plugins";

const testCliNodeModulePath = join(__dirname, "test_cli", "node_modules");
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
    });

    afterAll(() => {
        // remove the subdirectories and symbolic link that we created
        IO.deleteDirTree(testCliNodeModulePath);
    });

    require("./suites/InstallingPlugins");
    require("./suites/ValidatePlugin");
    require("./suites/UsingPlugins");
    require("./suites/UninstallPlugins");
    require("./suites/ListPlugins");
    require("./suites/UpdatePlugins");
});
