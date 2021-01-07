# z/OS Management Facility Package

Contains APIs to interact with the z/OS Management Facility (using z/OSMF REST endpoints).

## API Examples

**Check z/OSMF status**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession, CheckStatus, IZosmfInfoResponse } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";

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

    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IZosmfInfoResponse;
    response = await CheckStatus.getZosmfInfo(session);
    console.log(response);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});

const session = new Session(sessionConfig);

async function main() {
    let response: IZosmfInfoResponse;
    try {
        response = await CheckStatus.getZosmfInfo(session);
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
```

#
**List systems defined to z/OSMF**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession, ListDefinedSystems, IZosmfListDefinedSystemsResponse } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";

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

    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IZosmfListDefinedSystemsResponse;
    response = await ListDefinedSystems.listDefinedSystems(session);
    console.log(response);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});

const session = new Session(sessionConfig);

async function main() {
    let response: IZosmfListDefinedSystemsResponse;
    try {
        response = await ListDefinedSystems.listDefinedSystems(session);
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
```