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

import { PerfTiming } from "@zowe/perf-timing";

const timingApi = PerfTiming.api;

timingApi.mark("pre-init");

import { IImperativeConfig, Imperative } from "@brightside/imperative";
import { Constants } from "./Constants";
import { inspect } from "util";

// TODO(Kelosky): if we remove this, imperative fails to find config in package.json & we must debug this.
const config: IImperativeConfig = {
    configurationModule: __dirname + "/imperative"
};

(async () => {
    timingApi.mark("post-init");
    timingApi.measure("time to get into brightside main function", "pre-init", "post-init");

    try {
        timingApi.mark("before init");
        await Imperative.init(config);
        timingApi.mark("after init");
        timingApi.measure("imperative.init", "before init", "after init");

        Imperative.api.appLogger.trace("Init was successful");

        timingApi.mark("before parse");
        Imperative.parse();
        timingApi.mark("after parse");
        timingApi.measure("Imperative.parse", "before parse", "after parse");
    }
    catch (initErr) {
        Imperative.console.fatal("Error initializing " + Constants.DISPLAY_NAME +
            ":\n "
            + inspect(initErr));
    }
})();
