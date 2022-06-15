# z/OS Logs Package

Contains APIs to interact with logs on z/OS (using z/OSMF log REST endpoints).
z/OSMF version 2.4 or higher is required. Ensure that the [z/OSMF Operations Log Support is available via APAR and associated PTFs](https://www.ibm.com/support/pages/apar/PH35930).
## API Examples

**List z/OS logs**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { GetZosLog, IZosLogParms } from "@zowe/zos-logs-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const zosLogParms: IZosLogParms = {
        direction: "backward",
        range: "1m"
    };
    const response = await GetZosLog.getZosLog(session, zosLogParms);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
