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

import { execSync } from "child_process";

/**
 * NOTE(Kelosky): Documentation says to use `forever-monitor`; however, processes started this way are not in
 * `forever list`.  You must use `forever.startServer()` to achieve this. @types are unavailable
 * for `forever` but are found for `forever-monitor.
 */

process.stdout.write(`execSync("npx forever restart zowe-daemon").toString()\n`);