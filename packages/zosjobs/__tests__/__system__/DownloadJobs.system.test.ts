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

import { DeleteJobs, DownloadJobs, GetJobs, IJobFile, SubmitJobs } from "../../";
import { ImperativeError, IO, Session, TextUtils } from "@zowe/imperative";
import { TestEnvironment } from "../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Get } from "../../../zosfiles/src/methods/get";
import { MonitorJobs } from "../../src/MonitorJobs";
import { IJob } from "../../src/doc/response/IJob";
import * as fs from "fs";
import { TEST_RESOURCES_DIR } from "../__src__/ZosJobsTestConstants";
import { join } from "path";

let outputDirectory: string;
let REAL_SESSION: Session;
let ACCOUNT: string;
let DOWNLOAD_JOB_NAME: string;
let JOBCLASS: string;
let SYSAFF: string;
let defaultSystem: ITestPropertiesSchema;
let testEnvironment: ITestEnvironment;

const LONG_TIMEOUT = 200000;

describe("Download Jobs - System tests", () => {
    let jobid: string;
    let jobname: string;
    let jobFiles: IJobFile[];
    let jesJCLJobFile: IJobFile;
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_download_jobs"
        });
        outputDirectory = testEnvironment.workingDir + "/output";
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        // download the valid IEFBR14 from the data set specified in the properties file
        const iefbr14DataSet = testEnvironment.systemTestProperties.zosjobs.iefbr14Member;
        const iefbr14JCL = (await Get.dataSet(REAL_SESSION, iefbr14DataSet)).toString();

        const job = await SubmitJobs.submitJclNotifyCommon(REAL_SESSION, {
            jcl: iefbr14JCL
        });
        jobid = job.jobid;
        jobname = job.jobname;
        jobFiles = await GetJobs.getSpoolFiles(REAL_SESSION, jobname, jobid);
        // find the specific DDs we will use in the tests
        for (const file of jobFiles) {
            if (file.ddname === "JESJCL") {
                jesJCLJobFile = file;
            }
        }

        ACCOUNT = defaultSystem.tso.account;
        const JOB_LENGTH = 6;
        DOWNLOAD_JOB_NAME = REAL_SESSION.ISession.user.substr(0, JOB_LENGTH).toUpperCase() + "DJ";

        JOBCLASS = testEnvironment.systemTestProperties.zosjobs.jobclass;
        SYSAFF = testEnvironment.systemTestProperties.zosjobs.sysaff;
    });

    afterEach((done: any) => {
        require("rimraf")(outputDirectory, {maxBusyTries: 10}, (err?: Error) => {
            done(err);
        });
    });

    afterAll(async () => {
        await DeleteJobs.deleteJob(REAL_SESSION, jobname, jobid);
    });

    describe("Positive tests", () => {

        it("should be able to download a single DD from job output", async () => {
            const downloadDir = outputDirectory + "/downloadsingle/";
            await DownloadJobs.downloadSpoolContentCommon(REAL_SESSION, {
                outDir: downloadDir,
                jobFile: jesJCLJobFile
            });
            expect(IO.existsSync(downloadDir)).toEqual(true);
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jesJCLJobFile, false, downloadDir);
            expect(IO.existsSync(expectedFile)).toEqual(true);
            expect(IO.readFileSync(expectedFile).toString()).toContain("EXEC PGM=IEFBR14");
        });

        it("should be able to download a single DD from job output", async () => {

            await DownloadJobs.downloadSpoolContent(REAL_SESSION,
                jesJCLJobFile
            );
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jesJCLJobFile, false);
            expect(IO.existsSync(expectedFile)).toEqual(true);
            expect(IO.readFileSync(expectedFile).toString()).toContain("EXEC PGM=IEFBR14");
        });

        it("should be able to download all DDs from job output", async () => {
            const downloadDir = outputDirectory + "/downloadall/";
            await DownloadJobs.downloadAllSpoolContentCommon(REAL_SESSION, {
                outDir: downloadDir,
                jobid,
                jobname
            });

            for (const file of jobFiles) {
                const expectedFile = DownloadJobs.getSpoolDownloadFile(file, false, downloadDir);
                expect(IO.existsSync(expectedFile)).toEqual(true);
            }
        });

        it("should be able to download all DDs from job output containing duplicate step names", async () => {
            // Construct the JCL
            const templateJcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/duplicate_steps.jcl")).toString();
            const renderedJcl = TextUtils.renderWithMustache(templateJcl,
                {JOBNAME: DOWNLOAD_JOB_NAME, ACCOUNT, JOBCLASS, TYPERUNPARM: "", SYSAFF});

            const job: IJob = await SubmitJobs.submitJcl(REAL_SESSION, renderedJcl);

            await MonitorJobs.waitForJobOutputStatus(REAL_SESSION, job);

            const downloadDir = outputDirectory + "/downloadsteps/";
            await DownloadJobs.downloadAllSpoolContentCommon(REAL_SESSION, {
                outDir: downloadDir,
                jobid: job.jobid,
                jobname: job.jobname
            });

            const expectedExt = DownloadJobs.DEFAULT_JOBS_OUTPUT_FILE_EXT;
            for (const file of await GetJobs.getSpoolFilesForJob(REAL_SESSION, job)) {
                const expectedFile = DownloadJobs.getSpoolDownloadFile(file, false, downloadDir);
                expect(IO.existsSync(expectedFile)).toEqual(true);

                if (file.stepname !== "JES2") {
                    expect(IO.existsSync(expectedFile.slice(0, -expectedExt.length) + "(1)" + expectedExt)).toEqual(true);
                    expect(IO.existsSync(expectedFile.slice(0, -expectedExt.length) + "(2)" + expectedExt)).toEqual(true);
                }
            }
        }, LONG_TIMEOUT);
    });


    describe("Negative tests", () => {
        let badJobFile: IJobFile;

        const badID = 9999;
        beforeAll(() => {
            badJobFile = JSON.parse(JSON.stringify(jobFiles[0])); // copy the real job file
            badJobFile.ddname = "FAKEDD"; // make this jobFile invalid
            badJobFile.id = badID;
        });

        it("should encounter an error if a non existent spool file is passed to downloadSpoolContentCommon",
            async () => {
                let err: Error | ImperativeError;
                try {
                    await DownloadJobs.downloadSpoolContentCommon(REAL_SESSION, {
                        jobFile: badJobFile,
                        outDir: outputDirectory
                    });
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toContain(jobname);
                expect(err.message).toContain(jobid);
                expect(err.message).toContain("does not contain");
            });

        it("should encounter an error if a non existent jobname/jobid is passed to downloadAllSpoolContentCommon",
            async () => {
                let err: Error | ImperativeError;
                try {
                    await DownloadJobs.downloadAllSpoolContentCommon(REAL_SESSION, {
                        jobname: "FAKEJOB",
                        jobid: "JOBABCD",
                        outDir: outputDirectory
                    });
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toContain("FAKEJOB");
                expect(err.message).toContain("JOBABCD");
                expect(err.message).toContain("Failed to lookup");
            });

        it("should encounter an error if a non existent spool file is passed to downloadSpoolContent",
            async () => {
                let err: Error | ImperativeError;
                try {
                    await DownloadJobs.downloadSpoolContent(REAL_SESSION, badJobFile);
                } catch (e) {
                    err = e;
                }
                expect(err).toBeDefined();
                expect(err instanceof ImperativeError).toEqual(true);
                expect(err.message).toContain(jobname);
                expect(err.message).toContain(jobid);
                expect(err.message).toContain("does not contain");
            });

    });
});
