# z/OS Console Package

Contains APIs to interact with the z/OS console (using z/OSMF console REST endpoints).

# API Examples

**Submit a command to the z/OS console**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { IssueCommand, IIssueParms, IConsoleResponse } from "@zowe/zos-console-for-zowe-sdk";

(async () => {
    //Initialize the Imperative Credential Manager Factory and Logger
    Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));
    // Uncommment the below line if the Secure Credential Store is in use
    // await CredentialManagerFactory.initialize({service: "Zowe-Plugin"});

    // Get the default z/OSMF profile and create a z/OSMF session with it
    let defaultZosmfProfile: IProfile;
    try {
        defaultZosmfProfile = await getDefaultProfile("zosmf", true);
    } catch (err) {
        throw new ImperativeError({msg: "Failed to get a profile."});
    }

    // Console Options
const parms: IIssueParms = {
    command: "D IPLINFO",
    sysplexSystem: undefined,
    solicitedKeyword: undefined,
    async: "N"
}

    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IConsoleResponse;
    try {
        response = await IssueCommand.issue(session, parms);
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
```

#
**Get the response from a command sent to the z/OS console**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { CollectCommand, ICollectParms, IConsoleResponse } from "@zowe/zos-console-for-zowe-sdk";

(async () => {
    //Initialize the Imperative Credential Manager Factory and Logger
    Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));
    // Uncommment the below line if the Secure Credential Store is in use
    // await CredentialManagerFactory.initialize({service: "Zowe-Plugin"});

    // Get the default z/OSMF profile and create a z/OSMF session with it
    let defaultZosmfProfile: IProfile;
    try {
        defaultZosmfProfile = await getDefaultProfile("zosmf", true);
    } catch (err) {
        throw new ImperativeError({msg: "Failed to get a profile."});
    }

    const parms: ICollectParms = {
        commandResponseKey: "KEY",
        waitToCollect: undefined,
        followUpAttempts: undefined
    }

    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IConsoleResponse;
    try {
        response = await CollectCommand.collect(session, parms);
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
```