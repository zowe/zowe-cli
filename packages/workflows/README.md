# z/OS Workflows Package

Contains APIs to interact with the z/OS workflows APIs

## API Examples

**List Active Workflow Instance(s) in z/OSMF**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { IActiveWorkflows, ListWorkflows } from "@zowe/zos-workflows-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const response: IActiveWorkflows = await ListWorkflows.getWorkflows(session);
    console.log(response.workflows);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
