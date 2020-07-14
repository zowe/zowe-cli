/* Issue the TSO command "status" to display info about jobs for your user ID */

import { ISession, Logger, LoggingConfigurer, Session } from "@zowe/imperative";
import { IssueTso } from "./";

Logger.initLogger(LoggingConfigurer.configureLogger("lib", {name: "test"}));

const sessCfg: ISession = {
    hostname: "example.com",
    port: 443,
    rejectUnauthorized: false,
    user: "ibmuser",
    password: "password",
    type: "basic"
};
const session = new Session(sessCfg);
const accountNumber = "ACCT#";
const command = "status";

(async () => {
    const response = await IssueTso.issueTsoCommand(session, accountNumber, command);
    if (response.success) {
        console.log(response.commandResponse);
    } else {
        throw new Error(`Failed to issue TSO command "${command}"`);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
