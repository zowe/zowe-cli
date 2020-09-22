# z/OS Jobs Package

Contains APIs and commands to interact with jobs on z/OS (using z/OSMF jobs REST endpoints).

# API Examples

**Cancel a job**

```typescript
import { CancelJobs } from "@zowe/cli";
import { Session, ISession, SessConstants } from "@zowe/imperative";

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

// Job Options
const jobName: string = "MYJOB";
const jobId: string = "JOBID";
const version: string = undefined;
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
    let response: any;
    try {
        response = await CancelJobs.cancelJob(session, jobName, jobId, version);
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
**Download a job's output**

```typescript
import { DownloadJobs, IDownloadAllSpoolContentParms } from "@zowe/cli";
import { Session, ISession, SessConstants } from "@zowe/imperative";

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

// Job Options
const jobParms: IDownloadAllSpoolContentParms = {
    jobname: "JOBNAME",
    jobid: "JOBID",
    outDir: undefined,
    extension: ".txt",
    omitJobidDirectory: false
}
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
    let response: any;
    try {
        response = await DownloadJobs.downloadAllSpoolContentCommon(session, jobParms);
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
**Get jobs by owner**

```typescript
import { GetJobs, IJob } from "@zowe/cli";
import { Session, ISession, SessConstants } from "@zowe/imperative";

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

// Job Options
const owner: string = user;
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

// Example note: This can take a *considerable* amount of time, depending on the number of jobs on the system.
async function main() {
    let response: IJob[];
    try {
        response = await GetJobs.getJobsByOwner(session, owner);
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
**Submit a job**

```typescript
import { SubmitJobs, IJob, ISubmitJobParms } from "@zowe/cli";
import { Session, ISession, SessConstants } from "@zowe/imperative";

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

// Job Options
const jobDataSet: "ZOWEUSER.PUBLIC.MY.DATASET.JCL(MEMBER)"
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
    let response: IJob;
    try {
        response = await SubmitJobs.submitJob(session, jobDataSet);
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
```