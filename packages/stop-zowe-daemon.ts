#!/usr/bin/env node
import * as pm2 from "pm2";

process.stdout.write("Daemon stopping...\n");

// start true daemon (if not started already)
pm2.connect((err) => {

    if (err) {
        throw err;
    }

    // stop Zowe CLI process / daemon
    pm2.stop("zowe-daemon", (startErr) => {
        if (startErr) {
            throw startErr;
        }
        process.stdout.write("...daemon stopped.\n");
        pm2.disconnect();
    });

});