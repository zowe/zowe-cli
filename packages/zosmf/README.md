# z/OS Management Facility Package

Contains APIs to interact with the z/OS Management Facility (using z/OSMF REST endpoints).

## API Examples

**Check z/OSMF status**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { CheckStatus } from "@zowe/zosmf-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const response = await CheckStatus.getZosmfInfo(session);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**List systems defined to z/OSMF**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { ListDefinedSystems } from "@zowe/zosmf-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const response = await ListDefinedSystems.listDefinedSystems(session);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
