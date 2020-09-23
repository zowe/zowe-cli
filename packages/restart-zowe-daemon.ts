#!/usr/bin/env node
import * as pm2 from "pm2";

process.stdout.write("Daemon restarting...\n");

// start true daemon (if not started already)
pm2.connect((err) => {

    if (err) {
        throw err;
    }

    // start Zowe CLI process / daemon
    pm2.restart("zowe-daemon", (startErr) => {
        if (startErr) {
            throw startErr;
        }
        process.stdout.write("...daemon restarted.\n");
        pm2.disconnect();
    });

});