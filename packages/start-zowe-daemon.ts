#!/usr/bin/env node
import * as pm2 from "pm2";

/**
 * Simple parsing to accept an integer when run via `zowe-daemon <PORT>`.
 */

const numOfParms = process.argv.length - 2;

const defaultPort = 4000;
let port = process.argv[2] || defaultPort;

port = parseInt(port as string, 10); // throw error if non number

/**
 * Running PM2 this way helps with Windows which fails to run the globally installed `zowe.cmd` wrapper
 * that ultimately launches `node lib/main.js`.
 *
 * This will start a true `pm2` daemon and run Zowe CLI as a background process.  After initial start,
 * Zowe CLI process (aka daemon) can be restarted via `pm2 restart zowe-daemon`.  This implies `pm2` is globally
 * installed.
 */

// start true daemon (if not started already)
pm2.connect((err) => {

    if (err) {
        throw err;
    }

    // start Zowe CLI process / daemon
    pm2.start({
        args: `--daemon=${port}`,
        name: "zowe-daemon",
        script: "./lib/main.js"
    }, (startErr) => {
        if (startErr) {
            throw startErr;
        }
        pm2.disconnect()
    });

});