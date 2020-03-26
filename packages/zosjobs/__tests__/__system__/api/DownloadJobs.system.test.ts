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

import { DeleteJobs, DownloadJobs, GetJobs, IJobFile, SubmitJobs } from "../../../";
import { ImperativeError, IO, Session } from "@zowe/imperative";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Get } from "../../../../zosfiles/src/api/methods/get";

let outputDirectory: string;
let REAL_SESSION: Session;
let account: string;
let defaultSystem: ITestPropertiesSchema;
let testEnvironment: ITestEnvironment;

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

        account = defaultSystem.tso.account;
        const maxJobNamePrefix = 5;
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
