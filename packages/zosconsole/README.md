# z/OS Console Package

Contains APIs to interact with the z/OS console (using z/OSMF console REST endpoints).

## API Examples

**Submit a command to the z/OS console**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { IIssueParms, IssueCommand } from "@zowe/zos-console-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const parms: IIssueParms = {
        command: "D IPLINFO",
        sysplexSystem: undefined,
        solicitedKeyword: undefined,
        async: "N"
    };
    const response = await IssueCommand.issue(session, parms);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Get the response from a command sent to the z/OS console**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { CollectCommand, ICollectParms } from "@zowe/zos-console-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const parms: ICollectParms = {
        commandResponseKey: "KEY",
        waitToCollect: undefined,
        followUpAttempts: undefined
    };
    const response = await CollectCommand.collect(session, parms);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
