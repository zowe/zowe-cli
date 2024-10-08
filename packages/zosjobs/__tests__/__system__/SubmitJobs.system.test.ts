/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { ImperativeError, Session } from "@zowe/imperative";
import { GetJobs, IJob, ISpoolFile, SubmitJobs } from "../../src";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/ITestEnvironment";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { wait } from "../../../../__tests__/__src__/TestUtils";
import { existsSync } from "fs";
import { ZosJobsMessages } from "../../src/JobsMessages";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let systemProps: ITestPropertiesSchema;
let REAL_SESSION: Session;
let account: string;
let jobDataSet: string;
let jobUSSFile: string;
let iefbr14JCL: string;
const badJCL = "thIsIs BaDJCL!";
const badDataSet = "DOES.NOT.EXIST(FAKE)";
const badUSSFile = "/tmp/does/not/exist/fake.txt";
const LONG_TIMEOUT = 100000; // 100 second timeout - jobs could take a while to complete due to system load

describe("Submit Jobs - System Tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_submit_jobs"
        });
        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        testEnvironment.resources.session = REAL_SESSION;

        systemProps = testEnvironment.systemTestProperties;
        account = systemProps.tso.account;
        jobDataSet = testEnvironment.systemTestProperties.zosjobs.iefbr14PSDataSet;
        jobUSSFile = testEnvironment.systemTestProperties.zosjobs.iefbr14USSFile;
        const maxJobNamePrefixLength = 5;
        iefbr14JCL = "//" + systemProps.zosmf.user.toUpperCase().substring(0, maxJobNamePrefixLength) + "J JOB  " + account +
            ",'Zowe Test',MSGLEVEL=(1,1),MSGCLASS=4,CLASS=C\n" +
            "//EXEC PGM=IEFBR14";
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Positive tests", () => {
        it("should allow users to call submitJCLCommon with correct parameters", async () => {
            const job = await SubmitJobs.submitJclCommon(REAL_SESSION, {
                jcl: iefbr14JCL
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        });

        it("should allow users to call submitJCLCommon with correct extended parameters", async () => {
            const job = await SubmitJobs.submitJclCommon(REAL_SESSION, {
                jcl: iefbr14JCL,
                internalReaderFileEncoding: "IBM-037",
                internalReaderLrecl: "80",
                internalReaderRecfm: "F"
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        });


        it("should allow users to call submitJCL with correct parameters (no internal reader settings)",
            async () => {
                const job = await SubmitJobs.submitJcl(REAL_SESSION,
                    iefbr14JCL
                );
                expect(job.jobid).toBeDefined();
                expect(job.jobname).toBeDefined();
                testEnvironment.resources.jobs.push(job);
            });


        it("should allow users to call submitJCL with correct parameters (with internal reader settings)",
            async () => {
                let jcl = iefbr14JCL + "\nLONGDD DD *\n";
                const twoHundredChars = 200;
                jcl += Array(twoHundredChars).join("A"); // add a long line to test internal reader
                const job = await SubmitJobs.submitJcl(REAL_SESSION,
                    jcl,
                    "V",
                    "256",
                    "IBM-037"
                );
                expect(job.jobid).toBeDefined();
                expect(job.jobname).toBeDefined();
                await wait(3000); // Waits for 3 seconds
                testEnvironment.resources.jobs.push(job);
            }, LONG_TIMEOUT);


        it("should allow users to call submitJCLNotifyCommon with correct parameters (with internal reader settings)",
            async () => {
                let jcl = iefbr14JCL + "\nLONGDD DD *\n";
                const twoHundredChars = 200;
                jcl += Array(twoHundredChars).join("A"); // add a long line to test internal reader
                jcl += "\n//";
                const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION,
                    {
                        jcl,
                        internalReaderLrecl: "256",
                        internalReaderRecfm: "F",
                        internalReaderFileEncoding: "IBM-037"
                    }
                );
                expect(job.jobid).toBeDefined();
                expect(job.jobname).toBeDefined();
                testEnvironment.resources.jobs.push(job);
            }, LONG_TIMEOUT);

        it("should allow users to call submitJobCommon with correct parameters (with data set)", async () => {
            const job = await SubmitJobs.submitJobCommon(REAL_SESSION, {
                jobDataSet
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        });

        it("should allow users to call submitJobCommon with correct parameters (with uss file)", async () => {
            const job = await SubmitJobs.submitJobCommon(REAL_SESSION, {
                jobUSSFile
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        });

        it("should allow users to call submitJobNotifyCommon with correct parameters (using a data set)", async () => {
            const job = await SubmitJobs.submitJobNotifyCommon(REAL_SESSION, {
                jobDataSet
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should allow users to call submitJobNotifyCommon with correct parameters (using a uss file)", async () => {
            const job = await SubmitJobs.submitJobNotifyCommon(REAL_SESSION, {
                jobUSSFile
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should allow users to call submitJCLNotify with correct parameters", async () => {
            let jcl = iefbr14JCL + "\nLONGDD DD *\n";
            const twoHundredChars = 200;
            jcl += Array(twoHundredChars).join("A"); // add a long line to test internal reader
            const job = await SubmitJobs.submitJclNotify(REAL_SESSION, jcl,
                "V",
                "256",
                "IBM-037");
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should allow users to call submitJobNotify with correct parameters", async () => {
            const job = await SubmitJobs.submitJobNotify(REAL_SESSION,
                jobDataSet
            );
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should allow users to call submitUSSJobNotify with correct parameters", async () => {
            const job = await SubmitJobs.submitUSSJobNotify(REAL_SESSION,
                jobUSSFile
            );
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        }, LONG_TIMEOUT);

        it("should allow users to call submitJob with correct parameters", async () => {
            const job = await SubmitJobs.submitJob(REAL_SESSION,
                jobDataSet
            );
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        });

        it("should allow users to call submitUSSJob with correct parameters", async () => {
            const job = await SubmitJobs.submitUSSJob(REAL_SESSION,
                jobUSSFile
            );
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        });
        it("should return the job info of a submitted JCL string", async () => {
            const jobOrSpoolFiles = await SubmitJobs.submitJclString(REAL_SESSION, "//JOBNAME1 JOB", { jclSource: "stdin" });

            // Now `jobOrSpoolFiles` is guaranteed to be of type `IJob`
            const job: IJob = jobOrSpoolFiles as IJob;

            // Ensure jobid and jobname are defined before proceeding
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        });

        it("should return the job info of a submitted JCL string with extended options", async () => {
            const job: any = await SubmitJobs.submitJclString(REAL_SESSION, "//JOBNAME1 JOB", {
                jclSource: "stdin",
                internalReaderFileEncoding: "IBM-037",
                internalReaderLrecl: "80",
                internalReaderRecfm: "F"
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            testEnvironment.resources.jobs.push(job);
        });

        it("should return an array of spool content", async () => {
            // Submit the JCL and request spool content to be returned
            const result = await SubmitJobs.submitJclString(REAL_SESSION, "//JOBNAME1 JOB", {
                jclSource: "stdin",
                viewAllSpoolContent: true
            });

            let job: IJob;
            let spoolFiles: ISpoolFile[];

            if (Array.isArray(result)) {
                // result is an array of spool files
                spoolFiles = result as ISpoolFile[];

                // Ensure the first spool file contains the expected content
                expect(spoolFiles[0].data.toString()).toContain("J E S 2  J O B  L O G");

                // Extract job ID from the spool file content
                const jobLogContent = spoolFiles[0].data.toString();
                const jobIdMatch = jobLogContent.match(/JOB\d{5}/).toString();

                job = await GetJobs.getJob(REAL_SESSION, jobIdMatch);
            } else {
                // result is a job
                job = result as IJob;
            }

            testEnvironment.resources.jobs.push(job);
        });

        it("should download spool content to a local directory", async () => {
            const jobOrSpoolFiles = await SubmitJobs.submitJclString(REAL_SESSION, "//JOBNAME1 JOB", {
                jclSource: "stdin",
                viewAllSpoolContent: false,
                directory: "./"
            });

            // Now `jobOrSpoolFiles` is guaranteed to be of type `IJob`
            const job: IJob = jobOrSpoolFiles as IJob;

            // Ensure jobid and jobname and file are defined before proceeding
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            expect(existsSync(`${job.jobid}/JES2`)).toBeTruthy();

            testEnvironment.resources.jobs.push(job);

            // Delete the locally created directory
            require("rimraf").sync(job.jobid, { maxBusyTries: 10 });
        });
    });

    describe("Negative tests", () => {

        it("should surface an error from z/OSMF when calling submitJclCommon with an invalid JCL", async () => {

            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitJclCommon(REAL_SESSION, {
                    jcl: badJCL
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("does not start with a slash");
        });


        it("should surface an error from z/OSMF when calling submitJcl with an invalid JCL",
            async () => {
                let err: Error | ImperativeError;
                try {
                    await SubmitJobs.submitJcl(REAL_SESSION,
                        badJCL
                    );
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toContain("does not start with a slash");
            });


        it("should surface an error from z/OSMF when calling submitJcl with an invalid JCL with internal reader settings",
            async () => {
                let err: Error | ImperativeError;
                let jcl = badJCL + "\nLONGDD DD *\n";
                const twoHundredChars = 200;
                jcl += Array(twoHundredChars).join("A"); // add a long line to test internal reader
                try {
                    await SubmitJobs.submitJcl(REAL_SESSION,
                        jcl,
                        "V",
                        "256"
                    );
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toContain("does not start with a slash");
            });


        it("should surface an error from z/OSMF when calling submitJclNotifyCommon with invalid JCL (with internal reader settings)",
            async () => {
                let err: Error | ImperativeError;
                let jcl = badJCL + "\nLONGDD DD *\n";
                const twoHundredChars = 200;
                jcl += Array(twoHundredChars).join("A"); // add a long line to test internal reader
                jcl += "\n//";
                try {
                    await SubmitJobs.submitJclNotifyCommon(REAL_SESSION,
                        {
                            jcl,
                            internalReaderLrecl: "256",
                            internalReaderRecfm: "F"
                        }
                    );
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toContain("does not start with a slash");
            }, LONG_TIMEOUT);

        it("should surface an error from z/OSMF when calling submitJobCommon with a non existent data set", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitJobCommon(REAL_SESSION, {
                    jobDataSet: badDataSet
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain(badDataSet);
        });

        it("should surface an error from z/OSMF when calling submitJobCommon with a non existent uss file", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitJobCommon(REAL_SESSION, {
                    jobUSSFile: badUSSFile
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain(badUSSFile);
        });

        it("should surface an error from z/OSMF when calling submitJobNotifyCommon with a non existent data set", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitJobNotifyCommon(REAL_SESSION, {
                    jobDataSet: badDataSet
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain(badDataSet);
        }, LONG_TIMEOUT);

        it("should surface an error from z/OSMF when calling submitJobNotifyCommon with a non existent uss file", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitJobNotifyCommon(REAL_SESSION, {
                    jobUSSFile: badUSSFile
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain(badUSSFile);
        }, LONG_TIMEOUT);

        it("should surface an error from z/OSMF when calling submitJclNotify with invalid JCL", async () => {
            let err: Error | ImperativeError;
            let jcl = badJCL + "\nLONGDD DD *\n";
            const twoHundredChars = 200;
            jcl += Array(twoHundredChars).join("A"); // add a long line to test internal reader
            try {
                await SubmitJobs.submitJclNotify(REAL_SESSION, jcl,
                    "V",
                    "256");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain("does not start with a slash");
        }, LONG_TIMEOUT);

        it("should surface an error from z/OSMF when calling submitJobNotify with a non existent data set", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitJobNotify(REAL_SESSION,
                    badDataSet
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain(badDataSet);
        }, LONG_TIMEOUT);

        it("should surface an error from z/OSMF when calling submitUSSJobNotify with a non existent uss file", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitUSSJobNotify(REAL_SESSION,
                    badUSSFile
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain(badUSSFile);
        }, LONG_TIMEOUT);

        it("should surface an error from z/OSMF when calling submitJob with a non existent data set", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitJob(REAL_SESSION,
                    badDataSet
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain(badDataSet);
        });

        it("should surface an error from z/OSMF when calling submitUSSJob with a non existent USS file", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitUSSJob(REAL_SESSION,
                    badUSSFile
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain(badUSSFile);
        });

        it("should throw an error if the JCL string is null", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitJclString(REAL_SESSION, null, {jclSource: "stdoin"});
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message.toString()).toContain(ZosJobsMessages.missingJcl.message);
        });

        it("should throw an error if the JCL is an empty string", async () => {
            let err: Error | ImperativeError;
            try {
                await SubmitJobs.submitJclString(REAL_SESSION, "", {jclSource: "stdoin"});
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err instanceof ImperativeError).toEqual(true);
            expect(err.message).toContain(ZosJobsMessages.missingJcl.message);
        });
    });
});
