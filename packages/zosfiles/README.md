# z/OS Files Package

Contains APIs to interact with files and data sets on z/OS (using z/OSMF files REST endpoints).

# API Examples

**Create a dataset**

```typescript
import { Session, ISession, SessConstants } from "@zowe/imperative";
import { Create, ICreateDataSetOptions, IZosFilesResponse, CreateDataSetTypeEnum } from "@zowe/zos-files-for-zowe-sdk";

// Connection Options
const hostname: string = "yourhost.yourdomain.net";
const port: number = 443;
const user: string = "ZOWEUSER";
const password: string = "ZOWEPASS";
const protocol: SessConstants.HTTP_PROTOCOL_CHOICES = "https";
const basePath: string = undefined;
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

// Create Options
const dataset: string = "ZOWEUSER.PUBLIC.NEW.DATASET";
const options: ICreateDataSetOptions = {
    primary: 10,
    secondary: 1,
    alcunit: "TRK",
    lrecl: 80
};
const dataSetType = CreateDataSetTypeEnum.DATA_SET_CLASSIC
const sessionConfig: ISession = {
    hostname,
    port,
    user,
    password,
    protocol,
    basePath,
    type,
    tokenType,
    tokenValue,
    rejectUnauthorized
}

const session = new Session(sessionConfig);

async function main() {
    let response: IZosFilesResponse;
    try {
        response = await Create.dataSet(session, dataSetType, dataset, options);
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
**Download all datasets in a partitioned dataset**

```typescript
import { Session, ISession, SessConstants } from "@zowe/imperative";
import { Download, IDownloadOptions, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";

// Connection Options
const hostname: string = "yourhost.yourdomain.net";
const port: number = 443;
const user: string = "ZOWEUSER";
const password: string = "ZOWEPASS";
const protocol: SessConstants.HTTP_PROTOCOL_CHOICES = "https";
const basePath: string = undefined;
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

// Download Options
const dataset: string = "ZOWEUSER.PUBLIC.YOUR.DATASET.HERE";
const options: IDownloadOptions = {failFast: false};
const sessionConfig: ISession = {
    hostname,
    port,
    user,
    password,
    protocol,
    basePath,
    type,
    tokenType,
    tokenValue,
    rejectUnauthorized
}

const session = new Session(sessionConfig);

async function main() {
    let response: IZosFilesResponse;
    try {
        response = await Download.allMembers(session, dataset, options);
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
**List datasets on z/OS**

```typescript
import { Session, ISession, SessConstants } from "@zowe/imperative";
import { List, IListOptions, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";

// Connection Options
const hostname: string = "yourhost.yourdomain.net";
const port: number = 443;
const user: string = "ZOWEUSER";
const password: string = "ZOWEPASS";
const protocol: SessConstants.HTTP_PROTOCOL_CHOICES = "https";
const basePath: string = undefined;
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

// List Options
const dataset: string = "ZOWEUSER.*";
const options: IListOptions = {};
const sessionConfig: ISession = {
    hostname,
    port,
    user,
    password,
    protocol,
    basePath,
    type,
    tokenType,
    tokenValue,
    rejectUnauthorized
}

const session = new Session(sessionConfig);

async function main() {
    let response: IZosFilesResponse;
    try {
        response = await List.dataSet(session, dataset, options);
        const objArray = response.apiResponse.items;
        for (const obj of objArray) {
            if (obj) {
                console.log(obj.dsname.toString());
            }
        };
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
```

#
**Upload a file to Unix System Services**

```typescript
import { Session, ISession, SessConstants } from "@zowe/imperative";
import { Upload, IUploadOptions, IZosFilesResponse } from "@zowe/zos-files-for-zowe-sdk";

// Connection Options
const hostname: string = "yourhost.yourdomain.net";
const port: number = 443;
const user: string = "ZOWEUSER";
const password: string = "ZOWEPASS";
const protocol: SessConstants.HTTP_PROTOCOL_CHOICES = "https";
const basePath: string = undefined;
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

// Upload Options
const localFile: string = "C:/Users/zoweuser/Documents/testFile.txt";
const remoteLocation: string = "/u/zoweuser/file.txt"
const options: IUploadOptions = {binary: true};
const sessionConfig: ISession = {
    hostname,
    port,
    user,
    password,
    protocol,
    basePath,
    type,
    tokenType,
    tokenValue,
    rejectUnauthorized
}

const session = new Session(sessionConfig);

async function main() {
    let response: IZosFilesResponse;
    try {
        response = await Upload.fileToUssFile(session, localFile, remoteLocation, options);
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.log(err.message);
        process.exit(1);
    }
}

main();
```