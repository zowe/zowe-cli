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
    // Log messages to check in the tests
    Imperative.api.imperativeLogger.trace("This is a trace message after init!");
    Imperative.api.imperativeLogger.debug("This is a debug message after init!");
    Imperative.api.imperativeLogger.info("This is an info message after init!");
    Imperative.api.imperativeLogger.warn("This is a warn message after init!");
    Imperative.api.imperativeLogger.error("This is an error message after init!");
    Imperative.api.imperativeLogger.fatal("This is a fatal message after init!");

    // Parse the command
    Imperative.parse();
}).catch((error) => {
    process.stderr.write("Imperative Failed to Initialize: " + error + "\n");
    if (error instanceof ImperativeError) {
        process.stderr.write("Additional details:\n" + inspect(error.details, {depth: null}) + "\n");
    }
});
