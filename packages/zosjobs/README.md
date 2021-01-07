# z/OS Jobs Package
Contains APIs and commands to interact with jobs on z/OS (using z/OSMF jobs REST endpoints).


Contains APIs to interact with jobs on z/OS (using z/OSMF jobs REST endpoints).
const port: number = 443;
const user: string = "ZOWEUSER";
const password: string = "ZOWEPASS";
const protocol: SessConstants.HTTP_PROTOCOL_CHOICES = "https";
const basePath: string = undefined;
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

## API Examples
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

**Cancel a job**

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

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { CancelJobs } from "@zowe/zos-jobs-for-zowe-sdk";

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
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

    // Job Options
    const jobName: string = "MYJOB";
    const jobId: string = "JOBID";
    const version: string = undefined;
    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: any;
    response = await CancelJobs.cancelJob(session, jobName, jobId, version);
    console.log(response);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
    protocol,
    tokenType,
    tokenValue,
    rejectUnauthorized
}

#
**Download a job's output**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { DownloadJobs, IDownloadAllSpoolContentParms } from "@zowe/zos-jobs-for-zowe-sdk";
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

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

    // Job Options
    const jobParms: IDownloadAllSpoolContentParms = {
        jobname: "JOBNAME",
        jobid: "JOBID",
        outDir: undefined,
        extension: ".txt",
        omitJobidDirectory: false
    }
    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: any;
    response = await DownloadJobs.downloadAllSpoolContentCommon(session, jobParms);
    console.log(response);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});

#
**Get jobs by owner**
const protocol: SessConstants.HTTP_PROTOCOL_CHOICES = "https";
const basePath: string = undefined;
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { GetJobs, IJob } from "@zowe/zos-jobs-for-zowe-sdk";
    password,
    protocol,
    basePath,
    type,
    tokenType,
    tokenValue,
    rejectUnauthorized
}

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
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

    // Job Options
    const owner: string = defaultZosmfProfile.user;
    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IJob[];
    // This may take awhile...
    response = await GetJobs.getJobsByOwner(session, owner);
    console.log(response);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

#
**Submit a job**

```typescript
import { IProfile, Session, Logger, LoggingConfigurer, ImperativeError,
         CredentialManagerFactory } from "@zowe/imperative";
import { ZosmfSession } from "@zowe/zosmf-for-zowe-sdk";
import { getDefaultProfile } from "@zowe/core-for-zowe-sdk";
import { SubmitJobs, IJob, ISubmitJobParms } from "@zowe/zos-jobs-for-zowe-sdk";

(async () => {
    //Initialize the Imperative Credential Manager Factory and Logger
    Logger.initLogger(LoggingConfigurer.configureLogger('lib', {name: 'test'}));
    // Uncommment the below line if the Secure Credential Store is in use
    // await CredentialManagerFactory.initialize({service: "Zowe-Plugin"});
const protocol: SessConstants.HTTP_PROTOCOL_CHOICES = "https";
const basePath: string = undefined;
const type: SessConstants.AUTH_TYPE_CHOICES = "basic";
const tokenType: string = undefined;
const tokenValue: string = undefined;
const rejectUnauthorized: boolean = false;

    // Get the default z/OSMF profile and create a z/OSMF session with it
    let defaultZosmfProfile: IProfile;
    try {
        defaultZosmfProfile = await getDefaultProfile("zosmf", true);
    } catch (err) {
        throw new ImperativeError({msg: "Failed to get a profile."});
    }
    protocol,
    basePath,
    type,
    tokenType,
    tokenValue,
    rejectUnauthorized
}

    // Job Options
    const jobDataSet: string = "ZOWEUSER.PUBLIC.MY.DATASET.JCL(MEMBER)"
    const session: Session = ZosmfSession.createBasicZosmfSession(defaultZosmfProfile);
    let response: IJob;
    response = await SubmitJobs.submitJob(session, jobDataSet);
    console.log(response);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
```
}

main();
```