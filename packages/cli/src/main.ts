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

timingApi.mark("PRE_IMPORT_IMPERATIVE");

import { IImperativeConfig, Imperative } from "@zowe/imperative";
import { Constants } from "./Constants";
import { inspect } from "util";
import { DaemonDecider } from "./daemon/DaemonDecider";
import { join } from "path";

// TODO(Kelosky): if we remove this, imperative fails to find config in package.json & we must debug this.
const config: IImperativeConfig = {
    configurationModule: join(__dirname, "imperative")
};

(async () => {
    timingApi.mark("POST_IMPORT_IMPERATIVE");
    timingApi.measure("time to get into main function", "PRE_IMPORT_IMPERATIVE", "POST_IMPORT_IMPERATIVE");

    try {
        timingApi.mark("BEFORE_INIT");

        if(process.argv.includes("--daemon") || process.env.npm_lifecycle_event === "postinstall") {
            config.daemonMode = true;
        }
        await Imperative.init(config);

        const daemonDecider = new DaemonDecider(process.argv);
        daemonDecider.init();

        timingApi.mark("AFTER_INIT");
        timingApi.measure("imperative.init", "BEFORE_INIT", "AFTER_INIT");

        Imperative.api.appLogger.trace("Init was successful");

        timingApi.mark("BEFORE_PARSE");

        daemonDecider.runOrUseDaemon();

        timingApi.mark("AFTER_PARSE");
        timingApi.measure("Imperative.parse", "BEFORE_PARSE", "AFTER_PARSE");
    } catch (initErr) {
        if (initErr?.suppressDump) {
            Imperative.console.fatal(initErr.message);
        } else {
            Imperative.console.fatal("Error initializing " + Constants.DISPLAY_NAME +
                ":\n "
                + inspect(initErr));
        }
        process.exit(1);
    }
})();
