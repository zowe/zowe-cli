# z/OS Files Package

Contains APIs to interact with files and data sets on z/OS (using z/OSMF files REST endpoints).

# API Examples

**Create a dataset**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { Create, ICreateDataSetOptions, IZosFilesResponse, CreateDataSetTypeEnum } from "@zowe/zos-files-for-zowe-sdk";

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

    // Create Options
    const dataset: string = "ZOWEUSER.PUBLIC.NEW.DATASET";
    const dataSetType = CreateDataSetTypeEnum.DATA_SET_CLASSIC;
    const options: ICreateDataSetOptions = {
        primary: 10,
        secondary: 1,
        alcunit: "TRK",
        lrecl: 80
    };
    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IZosFilesResponse;
    response = await Create.dataSet(session, dataSetType, dataset, options);
    console.log(response);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Download all datasets in a partitioned dataset**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { IDownloadOptions, Download, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";

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

    // Download Options
    const dataset: string = "ZOWEUSER.PUBLIC.YOUR.DATASET.HERE";
    const options: IDownloadOptions = {failFast: false};
    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IZosFilesResponse;
    response = await Download.allMembers(session, dataset, options);
    console.log(response);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**List datasets on z/OS**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { List, IListOptions, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";

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

    // List Options
    const dataset: string = "ZOWEUSER.*";
    const options: IListOptions = {};
    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IZosFilesResponse;
    response = await List.dataSet(session, dataset, options);
    const objArray = response.apiResponse.items;
    for (const obj of objArray) {
        if (obj) {
            console.log(obj.dsname.toString());
        }
    };
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Upload a file to Unix System Services**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { Upload, IUploadOptions, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";

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

    // Upload Options
    const localFile: string = "C:/Users/zoweuser/Documents/testFile.txt";
    const remoteLocation: string = "/u/zoweuser/file.txt";
    const options: IUploadOptions = {binary: true};
    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IZosFilesResponse;
    response = await Upload.fileToUssFile(session, localFile, remoteLocation, options);
    console.log(response);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```