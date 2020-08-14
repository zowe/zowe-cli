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

// unit tests for submit jobs

import { IJob, MonitorJobs, SubmitJobs } from "../../";
import { ZosmfRestClient } from "../../../rest/src/ZosmfRestClient";
import { ImperativeError } from "@zowe/imperative";

jest.mock("../../../rest/src/api/ZosmfRestClient");
jest.mock("../../src/api/MonitorJobs");

const fakeSession: any = {};

const fakeJobName = "MYJOB1";
const returnIJob = async () => {
    return {jobid: "JOB00001", jobname: fakeJobName, retcode: "CC 0000", owner: "dummy"};
};

const mockErrorText = "My fake error for unit tests has this text";
const throwImperativeError = async () => {
    throw new ImperativeError({msg: mockErrorText});
};
describe("Submit Jobs API", () => {

    describe("Positive tests", () => {
        it("should allow users to call submitJCLCommon with correct parameters", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            const job = await SubmitJobs.submitJclCommon(fakeSession, {
                jcl: "//EXEC PGM=IEFBR14"
            });
            // mocking worked if this fake job name is filled in
            expect(job.jobname).toEqual(fakeJobName);
        });


        it("should allow users to call submitJCL with correct parameters (no internal reader settings)",
            async () => {
                (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
                const job = await SubmitJobs.submitJcl(fakeSession,
                    "//EXEC PGM=IEFBR14"
                );
                // mocking worked if this fake job name is filled in
                expect(job.jobname).toEqual(fakeJobName);
            });


        it("should allow users to call submitJCL with correct parameters (with internal reader settings)",
            async () => {
                (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
                const job = await SubmitJobs.submitJcl(fakeSession,
                    "//EXEC PGM=IEFBR14",
                    "VB",
                    "256"
                );
                // mocking worked if this fake job name is filled in
                expect(job.jobname).toEqual(fakeJobName);
            });

        it("should allow users to call submitJCL and wait for output status",
            async () => {
                (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
                const job = await SubmitJobs.submitJob(fakeSession,
                    "DATA.SET"
                );
                // mocking worked if this fake job name is filled in
                expect(job.jobname).toEqual(fakeJobName);
                MonitorJobs.waitForJobOutputStatus = jest.fn((session, jobToWaitFor) => {
                    jobToWaitFor.status = "OUTPUT";
                    jobToWaitFor.retcode = "CC 0000";
                    return jobToWaitFor;
                });
                const finishedJob = await SubmitJobs.checkSubmitOptions(fakeSession, {
                    waitForOutput: true,
                    jclSource: "dataset"
                }, job);
                expect((finishedJob as IJob).jobname).toEqual(fakeJobName);
                expect((finishedJob as IJob).status).toEqual("OUTPUT");
                expect((finishedJob as IJob).retcode).toEqual("CC 0000");
            });
        it("should allow users to call submitJCL and wait for ACTIVE status",
            async () => {
                (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
                const job = await SubmitJobs.submitJob(fakeSession,
                    "DATA.SET"
                );
                // mocking worked if this fake job name is filled in
                expect(job.jobname).toEqual(fakeJobName);
                MonitorJobs.waitForStatusCommon = jest.fn((session, jobToWaitFor) => {
                    jobToWaitFor.status = "ACTIVE";
                    jobToWaitFor.retcode = null;
                    return jobToWaitFor;
                });
                const finishedJob = await SubmitJobs.checkSubmitOptions(fakeSession, {
                    waitForActive: true,
                    jclSource: "dataset"
                }, job);
                expect((finishedJob as IJob).jobname).toEqual(fakeJobName);
                expect((finishedJob as IJob).status).toEqual("ACTIVE");
                expect((finishedJob as IJob).retcode).toEqual(null);
            });


        it("should allow users to call submitJCLNotifyCommon with correct parameters (with internal reader settings)",
            async () => {
                (MonitorJobs as any).waitForStatusCommon = returnIJob; // mock  monitor job API used by SubmitJobs.ts
                const job = await SubmitJobs.submitJclNotifyCommon(fakeSession,
                    {
                        jcl: "//EXEC PGM=IEFBR14",
                        internalReaderLrecl: "VB",
                        internalReaderRecfm: "256"
                    }
                );
                // mocking worked if this fake job name is filled in
                expect(job.jobname).toEqual(fakeJobName);
            });

        it("should allow users to call submitDataSetJobCommon with correct parameters", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            const job = await SubmitJobs.submitJobCommon(fakeSession, {
                jobDataSet: "DUMMY.DATA.SET"
            });
            // mocking worked if this fake job name is filled in
            expect(job.jobname).toEqual(fakeJobName);
        });

        it("should allow users to call submitJobNotifyCommon with correct parameters (using data set)", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            (MonitorJobs as any).waitForStatusCommon = returnIJob; // mock  monitor job API used by SubmitJobs.ts
            const job = await SubmitJobs.submitJobNotifyCommon(fakeSession, {
                jobDataSet: "DUMMY.DATA.SET"
            });
            // mocking worked if this fake job name is filled in
            expect(job.jobname).toEqual(fakeJobName);
        });

        it("should allow users to call submitJCLNotify with correct parameters", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            (MonitorJobs as any).waitForStatusCommon = returnIJob; // mock  monitor job API used by SubmitJobs.ts
            const job = await SubmitJobs.submitJclNotify(fakeSession, "//EXEC PGM=IEFBR14",
                "VB",
                "256");
            // mocking worked if this fake job name is filled in
            expect(job.jobname).toEqual(fakeJobName);
        });

        it("should allow users to call submitJobNotify with correct parameters", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            (MonitorJobs as any).waitForStatusCommon = returnIJob; // mock  monitor job API used by SubmitJobs.ts
            const job = await SubmitJobs.submitJobNotify(fakeSession,
                "DUMMY.DATA.SET"
            );
            // mocking worked if this fake job name is filled in
            expect(job.jobname).toEqual(fakeJobName);
        });

        it("should allow users to call submitJob with correct parameters", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            const job = await SubmitJobs.submitJob(fakeSession,
                "DUMMY.DATA.SET"
            );
            // mocking worked if this fake job name is filled in
            expect(job.jobname).toEqual(fakeJobName);
        });
    });


    describe("Error catching tests - async/ await", () => {
        it("should be able to catch an error awaiting submitJCLCommon", async () => {
            (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
            let err: any;
            try {
                await SubmitJobs.submitJclCommon(fakeSession, {
                    jcl: "//EXEC PGM=IEFBR14"
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorText);
        });


        it("should be able to catch an error from awaiting submitJCL",
            async () => {
                (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
                let err: any;
                try {
                    await SubmitJobs.submitJcl(fakeSession,
                        "//EXEC PGM=IEFBR14"
                    );
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err.message).toEqual(mockErrorText);
            });


        it("should be able to catch an error awaiting submitJcl",
            async () => {
                (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
                let err: any;
                try {
                    await SubmitJobs.submitJcl(fakeSession,
                        "//EXEC PGM=IEFBR14",
                        "VB",
                        "256"
                    );
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err.message).toEqual(mockErrorText);
            });


        it("should be able to catch an error awaiting submitJCLNotifyCommon",
            async () => {
                (MonitorJobs as any).waitForStatusCommon = throwImperativeError;
                // mock  monitor job API used by
                // SubmitJobs.ts to throw an error
                let err: any;
                try {
                    await SubmitJobs.submitJclNotifyCommon(fakeSession,
                        {
                            jcl: "//EXEC PGM=IEFBR14",
                            internalReaderLrecl: "VB",
                            internalReaderRecfm: "256"
                        }
                    );
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err.message).toEqual(mockErrorText);
            });

        it("should be able to catch an error awaiting submitJobCommon", async () => {
            (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
            let err: any;
            try {
                await SubmitJobs.submitJobCommon(fakeSession, {
                    jobDataSet: "DUMMY.DATA.SET"
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorText);
        });

        it("should be able to catch an error awaiting submitJobNotifyCommon", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            (MonitorJobs as any).waitForStatusCommon = throwImperativeError; // mock  monitor job API used by SubmitJobs.ts
            let err: any;
            try {
                await SubmitJobs.submitJobNotifyCommon(fakeSession, {
                    jobDataSet: "DUMMY.DATA.SET"
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorText);
        });

        it("should be able to catch an error awaiting submitJCLNotify", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            (MonitorJobs as any).waitForStatusCommon = throwImperativeError; // mock  monitor job API used by SubmitJobs.ts
            let err: any;
            try {
                await SubmitJobs.submitJclNotify(fakeSession, "//EXEC PGM=IEFBR14",
                    "VB",
                    "256");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorText);
        });

        it("should be able to catch an error awaiting submitJobNotify", async () => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            (MonitorJobs as any).waitForStatusCommon = throwImperativeError; // mock  monitor job API used by SubmitJobs.ts
            let err: any;
            try {
                await SubmitJobs.submitJobNotify(fakeSession,
                    "DUMMY.DATA.SET"
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorText);
        });

        it("should be able to catch an error awaiting submitJob", async () => {
            (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
            let err: any;
            try {
                await SubmitJobs.submitJob(fakeSession,
                    "DUMMY.DATA.SET"
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorText);
        });
    });

    describe("Error catching tests - promise catch() ", () => {
        it("should be able to catch an error for submitJclCommon with .catch() syntax", (done: any) => {
            (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
            SubmitJobs.submitJclCommon(fakeSession, {
                jcl: "//EXEC PGM=IEFBR14"
            }).then(() => {
                expect("Should have called .catch()").toEqual("test failed");
            }).catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toEqual(mockErrorText);
                done();
            });
        });

        it("should be able to catch errors for submitJcl with catch() syntax",
            (done: any) => {
                (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
                SubmitJobs.submitJcl(fakeSession,
                    "//EXEC PGM=IEFBR14"
                ).then(() => {
                    expect("Should have called .catch()").toEqual("test failed");
                }).catch((e) => {
                    expect(e).toBeDefined();
                    expect(e.message).toEqual(mockErrorText);
                    done();
                });
            });

        it("should be able to catch an error with submiutJCL with catch() syntax",
            (done: any) => {
                (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
                SubmitJobs.submitJcl(fakeSession,
                    "//EXEC PGM=IEFBR14",
                    "VB",
                    "256"
                ).then(() => {
                    expect("Should have called .catch()").toEqual("test failed");
                }).catch((e) => {
                    expect(e).toBeDefined();
                    expect(e.message).toEqual(mockErrorText);
                    done();
                });
            });


        it("should be able to catch an error for submitJCLNotifyCommon with catch() syntax",
            (done: any) => {
                (MonitorJobs as any).waitForStatusCommon = throwImperativeError;
                // mock  monitor job API used by
                // SubmitJobs.ts to throw an error
                SubmitJobs.submitJclNotifyCommon(fakeSession,
                    {
                        jcl: "//EXEC PGM=IEFBR14",
                        internalReaderLrecl: "VB",
                        internalReaderRecfm: "256"
                    }
                ).then(() => {
                    expect("Should have called .catch()").toEqual("test failed");
                }).catch((e) => {
                    expect(e).toBeDefined();
                    expect(e.message).toEqual(mockErrorText);
                    done();
                });
            });

        it("should be able to catch an error with submitJobCommon with catch() syntax ", (done: any) => {
            (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
            SubmitJobs.submitJobCommon(fakeSession, {
                jobDataSet: "DUMMY.DATA.SET"
            }).then(() => {
                expect("Should have called .catch()").toEqual("test failed");
            }).catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toEqual(mockErrorText);
                done();
            });
        });

        it("should be able to catch an error with submitJobNotifyCommon with catch() syntax", (done: any) => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            (MonitorJobs as any).waitForStatusCommon = throwImperativeError; // mock  monitor job API used by SubmitJobs.ts
            SubmitJobs.submitJobNotifyCommon(fakeSession, {
                jobDataSet: "DUMMY.DATA.SET"
            }).then(() => {
                expect("Should have called .catch()").toEqual("test failed");
            }).catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toEqual(mockErrorText);
                done();
            });
        });

        it("should be able to catch an error with submitJCLNotify with catch() syntax", (done: any) => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            (MonitorJobs as any).waitForStatusCommon = throwImperativeError; // mock  monitor job API used by SubmitJobs.ts

            SubmitJobs.submitJclNotify(fakeSession, "//EXEC PGM=IEFBR14",
                "VB",
                "256").then(() => {
                expect("Should have called .catch()").toEqual("test failed");
            }).catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toEqual(mockErrorText);
                done();
            });
        });

        it("should be able to catch an error with submitJobNotify with catch() syntax", (done: any) => {
            (ZosmfRestClient as any).putExpectJSON = returnIJob; // mock return job
            (MonitorJobs as any).waitForStatusCommon = throwImperativeError; // mock  monitor job API used by SubmitJobs.ts
            SubmitJobs.submitJobNotify(fakeSession,
                "DUMMY.DATA.SET"
            ).then(() => {
                expect("Should have called .catch()").toEqual("test failed");
            }).catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toEqual(mockErrorText);
                done();
            });
        });

        it("should be able to catch an error with submitJob with catch() syntax", (done: any) => {
            (ZosmfRestClient as any).putExpectJSON = throwImperativeError; // throw error from rest client
            SubmitJobs.submitJob(fakeSession,
                "DUMMY.DATA.SET"
            ).then(() => {
                expect("Should have called .catch()").toEqual("test failed");
            }).catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toEqual(mockErrorText);
                done();
            });
        });
    });

    describe("Parameter validation tests", () => {

        it("should reject calls to submitJclCommon that don't specify jcl", async () => {
            let err: any;
            try {
                await SubmitJobs.submitJclCommon(fakeSession, {
                    jcl: undefined
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toContain("jcl");
        });


        it("should reject calls to submitJCL that don't specify jcl",
            async () => {
                let err: any;
                try {
                    await SubmitJobs.submitJcl(fakeSession,
                        undefined
                    );
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err.message).toContain("jcl");
            });

        it("should reject calls to submitJclNotifyCommon that don't specify jcl",
            async () => {
                let err: any;
                try {
                    await SubmitJobs.submitJclNotifyCommon(fakeSession,
                        {
                            jcl: undefined,
                            internalReaderLrecl: "VB",
                            internalReaderRecfm: "256"
                        }
                    );
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err.message).toContain("jcl");
            });

        it("should reject calls to submitJobCommon that don't provide jobDataSet", async () => {
            let err: any;
            try {
                await SubmitJobs.submitJobCommon(fakeSession, {
                    jobDataSet: undefined
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toContain("jobDataSet");
        });

        it("should reject calls to submitJobNotifyCommon that don't specify jobDataSet", async () => {
            let err: any;
            try {
                await SubmitJobs.submitJobNotifyCommon(fakeSession, {
                    jobDataSet: undefined
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toContain("jobDataSet");
        });

        it("should reject calls to submitJclNotify that don't provide jcl", async () => {
            let err: any;
            try {
                await SubmitJobs.submitJclNotify(fakeSession, undefined,
                    "VB",
                    "256");
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toContain("jcl");
        });

        it("should reject calls to submitJobNotify that don't specify data set", async () => {
            let err: any;
            try {
                await SubmitJobs.submitJobNotify(fakeSession,
                    undefined
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toContain("jobDataSet");
        });

        it("should reject calls to submitJob that don't specify data set", async () => {
            let err: any;
            try {
                await SubmitJobs.submitJob(fakeSession,
                    undefined
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toContain("jobDataSet");
        });

        it("should reject calls to submitJclString that don't provide JCL string", async () => {
            let err: any;
            try {
                await SubmitJobs.submitJclString(fakeSession, undefined, {jclSource: "stdin"});
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toContain("No JCL provided");
        });
    });
});
