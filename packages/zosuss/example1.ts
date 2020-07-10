/* Check disk space on file system that contains home directory */

import { Logger, LoggingConfigurer } from "@zowe/imperative";
import { SshSession, Shell } from "./";
// TODO Should ISshSession type be exported from zosuss package?
import { ISshSession } from "./src/api/doc/ISshSession";

Logger.initLogger(LoggingConfigurer.configureLogger("lib", {name: "test"}));

const sessCfg: ISshSession = {
    hostname: "example.com",
    port: 22,
    user: "ibmuser",
    password: "password"
};
const session = new SshSession(sessCfg);

(async () => {
    await Shell.executeSsh(session, "df .", (data: string) => {
        if (data.trim()) console.log(data);
    });
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
