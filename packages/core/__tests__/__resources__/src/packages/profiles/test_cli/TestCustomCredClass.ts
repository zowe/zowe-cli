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

import { Imperative } from "../../../../../../src/imperative";
import * as path from "path";


process.on("unhandledRejection", (err) => {
    process.stderr.write("Err: " + err + "\n");
});

Imperative.init({configurationModule: path.join(__dirname, "/TestCustomCredClassConfiguration.ts")}).then(() => Imperative.parse());

