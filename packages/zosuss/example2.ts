/* Connect with private key and make a script executable */

import { Logger, LoggingConfigurer } from "@zowe/imperative";
import { SshSession, Shell } from "./";
// TODO Should ISshSession type be exported from zosuss package?
import { ISshSession } from "./src/api/doc/ISshSession";

Logger.initLogger(LoggingConfigurer.configureLogger("lib", {name: "test"}));

const sessCfg: ISshSession = {
    hostname: "example.com",
    port: 22,
    user: "ibmuser",
    privateKey: require("os").homedir() + "/.ssh/id_rsa"
};
const session = new SshSession(sessCfg);

(async () => {
    await Shell.executeSshCwd(session, "chmod +x test.sh", "/tmp", (data: string) => {
        if (data.trim()) throw new Error(data);
    });
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
