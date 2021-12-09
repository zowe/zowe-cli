# z/OS Files Package

Contains APIs to interact with files and data sets on z/OS (using z/OSMF files REST endpoints).

## API Examples

**Create a dataset**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { Create, CreateDataSetTypeEnum, ICreateDataSetOptions } from "@zowe/zos-files-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const dataset = "ZOWEUSER.PUBLIC.NEW.DATASET";
    const dataSetType = CreateDataSetTypeEnum.DATA_SET_CLASSIC;
    const options: ICreateDataSetOptions = {
        primary: 10,
        secondary: 1,
        alcunit: "TRK",
        lrecl: 80
    };
    const response = await Create.dataSet(session, dataSetType, dataset, options);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Download all datasets in a partitioned dataset**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { Download, IDownloadOptions } from "@zowe/zos-files-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const dataset = "ZOWEUSER.PUBLIC.YOUR.DATASET.HERE";
    const options: IDownloadOptions = { failFast: false };
    const response = await Download.allMembers(session, dataset, options);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**List datasets on z/OS**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { IListOptions, List } from "@zowe/zos-files-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const dataset = "ZOWEUSER.*";
    const options: IListOptions = {};
    const response = await List.dataSet(session, dataset, options);
    for (const obj of response.apiResponse.items) {
        if (obj) console.log(obj.dsname.toString());
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Upload a file to Unix System Services**

```typescript
import { ProfileInfo } from "@zowe/imperative";
import { IUploadOptions, Upload } from "@zowe/zos-files-for-zowe-sdk";

(async () => {
    // Load connection info from default z/OSMF profile
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    const zosmfProfAttrs = profInfo.getDefaultProfile("zosmf");
    const zosmfMergedArgs = profInfo.mergeArgsForProfile(zosmfProfAttrs, { getSecureVals: true });
    const session = ProfileInfo.createSession(zosmfMergedArgs.knownArgs);

    const localFile = "C:/Users/zoweuser/Documents/testFile.txt";
    const remoteLocation = "/u/zoweuser/file.txt";
    const options: IUploadOptions = { binary: true };
    const response = await Upload.fileToUssFile(session, localFile, remoteLocation, options);
    console.log(response);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
