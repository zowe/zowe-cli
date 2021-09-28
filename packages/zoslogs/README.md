# z/OS Console Package

Contains APIs to interact with logs on z/OS (using z/OSMF log REST endpoints).
z/OSMF version 2.4 (Ensure that the [z/OSMF logger Support is available via APAR and associated PTFs](https://www.ibm.com/support/pages/apar/PH35930)) or higher is required.
## API Examples

**List z/OS logs**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError, CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { GetZosLog, IZosLogParms, IZosLogType } from "@zowe/zos-logs-for-zowe-sdk";

(async () => {
  //Initialize the Imperative Credential Manager Factory and Logger
  Logger.initLogger(LoggingConfigurer.configureLogger("lib", { name: "test" }));
  // Uncommment the below line if the Secure Credential Store is in use
  // await CredentialManagerFactory.initialize({service: "Zowe-Plugin"});

  // Get the default z/OSMF profile and create a z/OSMF session with it
  let defaultZosmfProfile: IProfile;
  try {
    defaultZosmfProfile = await getDefaultProfile("zosmf", true);
  } catch (err) {
    throw new ImperativeError({ msg: "Failed to get a profile." });
  }

  const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);

  const zosLogParms: IZosLogParms = {
    startTime: "2021-09-08T07:27:03.000Z",
    direction: "backward",
    range: "1m"
  };

  const response: IZosLogType = await GetZosLog.getZosLog(session, zosLogParms);

  console.log(response);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
```
