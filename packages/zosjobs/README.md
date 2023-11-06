# z/OS Jobs Package

Contains APIs to interact with jobs on z/OS (using z/OSMF jobs REST endpoints).

## API Examples

**Cancel a job**

```typescript
import { ProfileInfo } from "@zowe/core-for-zowe-sdk";
import { CancelJobs } from "@zowe/zos-jobs-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const jobName: string = "JOBNAME";
    const jobId: string = "JOBID";
    const version: string = undefined;
    const response = await CancelJobs.cancelJob(session, jobName, jobId, version);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Download a job's output**

```typescript
import { ProfileInfo } from "@zowe/core-for-zowe-sdk";
import { DownloadJobs, IDownloadAllSpoolContentParms } from "@zowe/zos-jobs-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const jobParms: IDownloadAllSpoolContentParms = {
        jobname: "JOBNAME",
        jobid: "JOBID",
        outDir: undefined,
        extension: ".txt",
        omitJobidDirectory: false
    };
    const response = await DownloadJobs.downloadAllSpoolContentCommon(session, jobParms);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Get jobs by owner**

```typescript
import { ProfileInfo } from "@zowe/core-for-zowe-sdk";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const owner: string = session.ISession.user;
    // This may take awhile...
    const response = await GetJobs.getJobsByOwner(session, owner);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Submit a job**

```typescript
import { ProfileInfo } from "@zowe/core-for-zowe-sdk";
import { SubmitJobs } from "@zowe/zos-jobs-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const jobDataSet: string = "ZOWEUSER.PUBLIC.MY.DATASET.JCL(MEMBER)";
    const response = await SubmitJobs.submitJob(session, jobDataSet);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
