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

import { IImperativeConfig, Imperative } from "@zowe/imperative";
import { Constants } from "./Constants";
import { inspect } from "util";
import { DaemonDecider } from "./daemon/DaemonDecider";
import { join } from "path";

// Hack: special imports done to enable our hack below.
import { ProfileInfo } from "@zowe/imperative";
import {
    ConvertMsg, ConvertMsgFmt, ConvertV1Profiles, IConvertV1ProfOpts, IConvertV1ProfResult
} from "@zowe/imperative";
// end Hack

// TODO(Kelosky): if we remove this, imperative fails to find config in package.json & we must debug this.
const config: IImperativeConfig = {
    configurationModule: join(__dirname, "imperative")
};

(async () => {

    try {
        if(process.argv.includes("--daemon") || process.env.npm_lifecycle_event === "postinstall") {
            config.daemonMode = true;
        }

        /* Hack:
         * These are items that you can temporarily do in packages/cli/src/main.ts to test an API
         * initialized like ZE.
         * By switching which of the following 2 lines is commented, you can call an API as
         * the CLI would or as ZE would.
         */
        // await Imperative.init(config); // This initializes like the CLI does.
        const profInfo = new ProfileInfo("zowe"); // This initializes ConfigUtils.initImpUtils() like ZE

        // Now call the API function that you are interested in.
        await profInfo.readProfilesFromDisk();
        const zosmfProfile = profInfo.getDefaultProfile("zosmf");
        const baseProfile = profInfo.getDefaultProfile("base");
        const getSecureValsVal = true;
        const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfile,
            { getSecureVals: getSecureValsVal }
        );
        /* eslint-disable no-console */
        console.log("baseProfile:\n " + JSON.stringify(baseProfile, null, 2));
        console.log("zosmfProfile:\n " + JSON.stringify(zosmfProfile, null, 2));
        console.log("zosmfMergedArgs with getSecureVals = " + getSecureValsVal + ":\n " +
            JSON.stringify(zosmfMergedArgs, null, 2)
        );
        console.log("Gene's hack got to end");
        /* eslint-disable no-console */
        process.exit(999);
        // end Hack

        await Imperative.init(config);
        const daemonDecider = new DaemonDecider(process.argv);
        daemonDecider.init();

        Imperative.api.appLogger.trace("Init was successful");
        daemonDecider.runOrUseDaemon();
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
