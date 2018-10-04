# z/OS Jobs Package
Contains APIs & commands to work with z/OS batch jobs (using z/OSMF Jobs REST endpoints).
# API Examples
**Submit JCL Text:**
```
const iefbr14JCL = "//SAMPLEJ JOB 123" +
    ",'Brightside Test',MSGLEVEL=(1,1),MSGCLASS=4,CLASS=C\n" +
    "//EXEC PGM=IEFBR14";

// Initialize the secure credential manager
CredentialManagerFactory.initialize(DefaultCredentialManager, "@brightside/core");

// Load the profile contents
const zosmfProfile = await new CliProfileManager({
    profileRootDirectory: PROFILE_ROOT_DIR,
    type: "zosmf"
}).load({loadDefault: true});

// Create the session for the REST client
const session: Session = ZosmfSession.createBasicZosmfSession(zosmfProfile.profile);

// Submit the JCL 
const response: IJob = await SubmitJobs.submitJcl(session, iefbr14JCL);
```
**Note:** The `@brightside/imperative` package contains the `CliProfileManager` and `CredentialManagerFactory`

**Get Job Details:**
```
// Initialize the secure credential manager
CredentialManagerFactory.initialize(DefaultCredentialManager, "@brightside/core");

// Load the profile contents
const zosmfProfile = await new CliProfileManager({
    profileRootDirectory: PROFILE_ROOT_DIR,
    type: "zosmf"
}).load({ loadDefault: true });

// Create the session for the REST client
const session: Session = ZosmfSession.createBasicZosmfSession(zosmfProfile.profile);

// Submit the JCL
const response: IJob = await GetJobs.getJob(session, "JOB123");
```

**Get Job Details:**
```
// Initialize the secure credential manager
CredentialManagerFactory.initialize(DefaultCredentialManager, "@brightside/brightside");

// Load the profile contents
const zosmfProfile = await new CliProfileManager({
    profileRootDirectory: PROFILE_ROOT_DIR,
    type: "zosmf"
}).load({ loadDefault: true });

// Create the session for the REST client
const session: Session = Utils.createZosmfSession(zosmfProfile.profile);

// Get the job details
const response: IJob = await GetJobs.getJob(session, "JOB123");
```

**Note:** The `@brightside/imperative` package contains the `CliProfileManager` and `CredentialManagerFactory`

**Get Job Spool Files:**
```
// Initialize the secure credential manager
CredentialManagerFactory.initialize(DefaultCredentialManager, "@brightside/core");

// Load the profile contents
const zosmfProfile = await new CliProfileManager({
    profileRootDirectory: PROFILE_ROOT_DIR,
    type: "zosmf"
}).load({ loadDefault: true });

// Create the session for the REST client
const session: Session = ZosmfSession.createBasicZosmfSession(zosmfProfile.profile);

// Get the spool files for the job
const job: IJob[] = await GetJobs.getJob(session, "JOB123");
const files: IJobFile[] = await GetJobs.getSpoolFilesForJob(session, job);
```

**Note:** The `@brightside/imperative` package contains the `CliProfileManager` and `CredentialManagerFactory`

**Get Spool File Contents:**
```
// Initialize the secure credential manager
CredentialManagerFactory.initialize(DefaultCredentialManager, "@brightside/core");

// Load the profile contents
const zosmfProfile = await new CliProfileManager({
    profileRootDirectory: PROFILE_ROOT_DIR,
    type: "zosmf"
}).load({ loadDefault: true });

// Create the session for the REST client
const session: Session = ZosmfSession.createBasicZosmfSession(zosmfProfile.profile);

// Get the spool content
const content = await GetJobs.getSpoolContentById(session, "MYJOB", "JOB123", 2);
```

**Note:** The `@brightside/imperative` package contains the `CliProfileManager` and `CredentialManagerFactory`

