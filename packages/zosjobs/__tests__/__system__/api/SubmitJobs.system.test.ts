/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ImperativeError, Session } from "@brightside/imperative";
import { DeleteJobs, IJob, SubmitJobs } from "../../../index";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";


let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let REAL_SESSION: Session;
let account: string;
let jobDataSet: string;
let iefbr14JCL: string;
const badJCL = "thIsIs BaDJCL!";
const badDataSet = "DOES.NOT.EXIST(FAKE)";

const LONG_TIMEOUT = 100000; // 100 second timeout - jobs could take a while to complete due to system load

const waitThreeSeconds = () => {
    return new Promise<void>((resolveWaitTime) => {
            const threeSeconds = 3000;
            setTimeout(() => {
                resolveWaitTime();
            }, threeSeconds);
        }
    );
};

describe("Submit Jobs - System Tests", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_submit_jobs"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });
        account = defaultSystem.tso.account;
        jobDataSet = testEnvironment.systemTestProperties.zosjobs.iefbr14PSDataSet;
        const maxJobNamePrefixLength = 5;
        iefbr14JCL = "//" + defaultSystem.zosmf.user.toUpperCase().substring(0, maxJobNamePrefixLength) + "J JOB  " + account +
            ",'Zowe Test',MSGLEVEL=(1,1),MSGCLASS=4,CLASS=C\n" +
            "//EXEC PGM=IEFBR14";
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

// helper to delete a job
    const deleteJob = async (job: IJob) => {
        await DeleteJobs.deleteJob(REAL_SESSION, job.jobname, job.jobid);
    };
    describe("Positive tests", () => {


        it("should allow users to call submitJCLCommon with correct parameters", async () => {
            const job = await SubmitJobs.submitJclCommon(REAL_SESSION, {
                jcl: iefbr14JCL
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            await deleteJob(job);
        });


        it("should allow users to call submitJCL with correct parameters (no internal reader settings)",
            async () => {
                const job = await SubmitJobs.submitJcl(REAL_SESSION,
                    iefbr14JCL
                );
                expect(job.jobid).toBeDefined();
                expect(job.jobname).toBeDefined();
                await deleteJob(job);
            });


        it("should allow users to call submitJCL with correct parameters (with internal reader settings)",
            async () => {
                let jcl = iefbr14JCL + "\nLONGDD DD *\n";
                const twoHundredChars = 200;
                jcl += Array(twoHundredChars).join("A"); // add a long line to test internal reader
                const job = await SubmitJobs.submitJcl(REAL_SESSION,
                    jcl,
                    "V",
                    "256"
                );
                expect(job.jobid).toBeDefined();
                expect(job.jobname).toBeDefined();
                await waitThreeSeconds();
                await deleteJob(job);
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
                    }
                );
                expect(job.jobid).toBeDefined();
                expect(job.jobname).toBeDefined();
                await deleteJob(job);
            }, LONG_TIMEOUT);

        it("should allow users to call submitDataSetJobCommon with correct parameters", async () => {
            const job = await SubmitJobs.submitJobCommon(REAL_SESSION, {
                jobDataSet
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            await deleteJob(job);
        });

        it("should allow users to call submitJobNotifyCommon with correct parameters (using data set)", async () => {
            const job = await SubmitJobs.submitJobNotifyCommon(REAL_SESSION, {
                jobDataSet
            });
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            await deleteJob(job);
        }, LONG_TIMEOUT);

        it("should allow users to call submitJCLNotify with correct parameters", async () => {
            let jcl = iefbr14JCL + "\nLONGDD DD *\n";
            const twoHundredChars = 200;
            jcl += Array(twoHundredChars).join("A"); // add a long line to test internal reader
            const job = await SubmitJobs.submitJclNotify(REAL_SESSION, jcl,
                "V",
                "256");
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            await deleteJob(job);
        }, LONG_TIMEOUT);

        it("should allow users to call submitJobNotify with correct parameters", async () => {
            const job = await SubmitJobs.submitJobNotify(REAL_SESSION,
                jobDataSet
            );
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            await deleteJob(job);
        }, LONG_TIMEOUT);

        it("should allow users to call submitJob with correct parameters", async () => {
            const job = await SubmitJobs.submitJob(REAL_SESSION,
                jobDataSet
            );
            expect(job.jobid).toBeDefined();
            expect(job.jobname).toBeDefined();
            await deleteJob(job);
        });
    });

    describe("Negative tests", () => {

        it("should surface an error from z/OSMF when calling submitJclCommon with invalid JCL", async () => {

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


        it("should surface an error from z/OSMF when calling submitJcl with invalid JCL",
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


        it("should surface an error from z/OSMF when calling submitJcl with invalid JCL with internal reader settings",
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
                            internalReaderRecfm: "F",
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
    });


});
