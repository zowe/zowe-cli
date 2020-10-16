# z/OS Workflows Package

Contains APIs to interact with the z/OS workflows APIs

## API Examples

**List Active Workflow Instance(s) in z/OSMF**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, TextUtils, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { IActiveWorkflows, ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";

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
    const response: IActiveWorkflows = await ListWorkflows.getWorkflows(session);
    console.log(response.workflows);
})();
```
