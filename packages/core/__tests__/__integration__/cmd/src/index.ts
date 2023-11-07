#!/usr/bin/env node
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


import { Imperative, ImperativeError } from "../../../../lib/index";
import { inspect } from "util";

Imperative.init().then((response) => {
    Imperative.parse();
}).catch((error) => {
    process.stderr.write("Imperative Failed to Initialize: " + error + "\n");
    if (error instanceof ImperativeError) {
        process.stderr.write("Additional details:\n" + inspect(error.details, {depth: null}) + "\n");
    }
});
