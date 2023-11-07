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

import { join } from "path";
import { IImperativeConfig } from "../../../../../../src/imperative";

/////////////////////////////////////////////////////////////////////////////
//////////// USE ONLY FROM WITHIN /test/src/packages/plugins ////////////////
/////////////////////////////////////////////////////////////////////////////
/**
 * The config of the test cli
 * @type {IImperativeConfig}
 */
export const config: IImperativeConfig = require(join(__dirname, "..", "plugins", "test_cli", "TestConfiguration"));

/**
 * The bin directory for plugins tests
 * @type {string}
 */
export const cliBin: string = join(__dirname, "..", "plugins", "test_cli", "TestCLI.ts");

/**
 * The name of the plugin group to run tests on. In the event it changes in the future
 * @type {string}
 */
export const pluginGroup: string = "plugins";
