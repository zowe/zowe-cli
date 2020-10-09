# z/OS USS Package

Contains APIs and commands to interact with USS on z/OS (using z/OSMF USS REST endpoints).

# API Examples

**Check disk space on file system containing home directory**

```typescript
import { Logger, LoggingConfigurer } from "@zowe/imperative";
import { ISshSession, Shell, SshSession } from "@zowe/zos-uss-for-zowe-sdk";

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
```

#
**Connect with private key and make a script executable**

```typescript
import { Logger, LoggingConfigurer } from "@zowe/imperative";
import { ISshSession, Shell, SshSession } from "@zowe/zos-uss-for-zowe-sdk";

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
```
