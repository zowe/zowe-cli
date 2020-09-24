import { execSync } from "child_process";

/**
 * NOTE(Kelosky): Documentation says to use `forever-monitor`; however, processes started this way are not in
 * `forever list`.  You must use `forever.startServer()` to achieve this. @types are unavailable
 * for `forever` but are found for `forever-monitor.
 */

process.stdout.write(`execSync("npx forever --id zowe-daemon start lib/main.js --daemon").toString()\n`);