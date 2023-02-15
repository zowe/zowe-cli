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

import { AbstractSession, ImperativeError, IO } from "@zowe/imperative";
import { DownloadJobs, GetJobs, IDownloadSpoolContentParms, IJobFile } from "../../src";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";

jest.mock("@zowe/core-for-zowe-sdk/src/rest/ZosmfRestClient");
jest.mock("../../src/GetJobs");

// unit tests for DownloadJobs API
describe("DownloadJobs", () => {

    const mockErrorMessage = "This is our mocked error message.";
    const throwError = async () => {
        throw new Error(mockErrorMessage);
    };

    IO.writeFileAsync = jest.fn(async (file: any, content: any) => {
        // do nothing
    });

    IO.createFileSync = jest.fn((directory: string) => {
        // do nothing;
    });

    IO.createWriteStream = jest.fn((file: string): any => {
        // do nothing;
    });

    const fakeSession: any = {};
    const fakeJobName = "MYJOB1";
    const fakeJobID = "JOB0001";
    const expectedMockSpoolContent = "Hello! This is my spool content.";
    
    // mocked spool job files
    const jobFiles: IJobFile[] = [{
        "jobid": fakeJobID,
        "jobname": fakeJobName,
        "id": 0,
        "recfm": "FB",
        "lrecl": 80,
        "byte-count": expectedMockSpoolContent.length,
        "record-count": expectedMockSpoolContent.split("\n").length,
        "job-correlator": "hiasdfasdf",
        "class": "A",
        "ddname": "JESJCL",
        "records-url": "notreal.com",
        "subsystem": "JES2",
        "stepname": "STEP1",
        "procstep": "PROC1"
    }];

    describe("Positive tests", () => {
        beforeEach(() => {
            GetJobs.getSpoolFiles = jest.fn(async (session: any, jobname: string, jobid: string) => {
                return jobFiles;
            });
        });

        it("should allow users to call downloadSpoolContent with correct parameters", async () => {
            ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                // do nothing
            });
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });
            await DownloadJobs.downloadSpoolContent(fakeSession, jobFiles[0]);
            const expectedFile = DownloadJobs.getSpoolDownloadFilePath(jobFiles[0]);
            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
        });

        it("should allow users to call downloadAllSpoolContentCommon with correct parameters", async () => {
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });
            await DownloadJobs.downloadAllSpoolContentCommon(fakeSession,
                {jobname: fakeJobName, jobid: fakeJobID}
            );
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jobFiles[0]);
            expect(GetJobs.getSpoolFiles).toHaveBeenCalled();
            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
        });

        it("should allow users to call downloadAllSpoolContentCommon with correct parameters and binary mode", async () => {
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });
            await DownloadJobs.downloadAllSpoolContentCommon(fakeSession,
                {jobname: fakeJobName, jobid: fakeJobID, binary: true}
            );
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jobFiles[0]);
            expect(GetJobs.getSpoolFiles).toHaveBeenCalled();
            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
        });

        it("should allow users to call downloadAllSpoolContentCommon with correct parameters and record mode", async () => {
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });
            await DownloadJobs.downloadAllSpoolContentCommon(fakeSession,
                {jobname: fakeJobName, jobid: fakeJobID, record: true}
            );
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jobFiles[0]);
            expect(GetJobs.getSpoolFiles).toHaveBeenCalled();
            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
        });

        it("should allow users download output to directory with specified file extension",
        async () => {
            //test that custom directory was created for spool content
            const spoolParms: IDownloadSpoolContentParms = {
                jobFile: jobFiles[0],
                outDir: "/fakedir",
                jobid: fakeJobID,
                jobname: fakeJobName,
                extension: ".md",
            }

            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain("/fakedir");
            expect(downloadFilePath).toContain(fakeJobID);
            expect(downloadFilePath).toContain(".md");
        });

        it("should allow users to call downloadAllSpoolContentCommon with a job containing duplicate step names", async () => {
            const sampJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
            GetJobs.getSpoolFiles = jest.fn(async (session: any, jobname: string, jobid: string) => {
                return [sampJobFile, sampJobFile, sampJobFile];
            });
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });
            await DownloadJobs.downloadAllSpoolContentCommon(fakeSession,
                {jobname: fakeJobName, jobid: fakeJobID}
            );
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jobFiles[0]);
            const expectedExt = DownloadJobs.DEFAULT_JOBS_OUTPUT_FILE_EXT;
            expect(GetJobs.getSpoolFiles).toHaveBeenCalled();
            expect((IO.createDirsSyncFromFilePath as any).mock.calls).toEqual([
                [expectedFile],
                [expectedFile.slice(0, -expectedExt.length) + "(1)" + expectedExt],
                [expectedFile.slice(0, -expectedExt.length) + "(2)" + expectedExt]
            ]);
        });

        it("should allow users to call downloadSpoolContentCommon with correct parameters " +
            "(jobFile with no procstep - procstep should be omitted from the download directory)", async () => {
            ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                // do nothing
            });
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });
            const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
            delete jobFile.procstep;
            const outDir = "./myDir";
            await DownloadJobs.downloadSpoolContentCommon(fakeSession, {
                outDir,
                jobFile
            });
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jobFile, false, outDir);
            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
        });

        it("should allow users to call downloadSpoolContentCommon with correct parameters (default output directory)", async () => {
            ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                // do nothing;
            });
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });

            await DownloadJobs.downloadSpoolContentCommon(fakeSession, {
                jobFile: jobFiles[0]
            });
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jobFiles[0]);
            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
        });

        it("should allow users to call downloadSpoolContentCommon with correct parameters (default output directory and binary mode)", async () => {
            let uri: string = "";
            ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                uri = resource;
            });
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });

            await DownloadJobs.downloadSpoolContentCommon(fakeSession, {
                jobFile: jobFiles[0],
                binary: true
            });
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jobFiles[0]);
            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
            expect(uri).toContain("?mode=binary");
        });

        it("should allow users to call downloadSpoolContentCommon with correct parameters (default output directory and record mode)", async () => {
            let uri: string = "";
            ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                uri = resource;
            });
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });

            await DownloadJobs.downloadSpoolContentCommon(fakeSession, {
                jobFile: jobFiles[0],
                record: true
            });
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jobFiles[0]);
            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
            expect(uri).toContain("?mode=record");
        });

        it("should allow users to call downloadSpoolContentCommon with correct parameters (omitting job ID in the resulting directory)", async () => {
            ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                // do nothing
            });
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing;
            });
            const outDir = "./myDir";
            const content = await DownloadJobs.downloadSpoolContentCommon(fakeSession, {
                outDir,
                jobFile: jobFiles[0],
                omitJobidDirectory: true
            });
            const expectedFile = DownloadJobs.getSpoolDownloadFile(jobFiles[0], true, outDir);
            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
        });
    });
    describe("Error catching - async/ await", () => {
        it("should be able to catch errors thrown by ZosmfRestClient in downloadAllSpoolContentCommon with async/await syntax", async () => {
            ZosmfRestClient.getStreamed = jest.fn(throwError);
            let err: Error | ImperativeError;
            try {
                await DownloadJobs.downloadAllSpoolContentCommon(fakeSession, {
                    outDir: "./",
                    jobname: fakeJobName,
                    jobid: "JOB00001"
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorMessage);
        });

        it("should be able to catch errors thrown by ZosmfRestClient in downloadSpoolContentCommon with async/await syntax", async () => {
            ZosmfRestClient.getStreamed = jest.fn(throwError);
            let err: Error | ImperativeError;
            try {
                await DownloadJobs.downloadSpoolContentCommon(fakeSession, {
                    outDir: "./",
                    jobFile: jobFiles[0]
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorMessage);
        });

        it("should be able to catch errors thrown by ZosmfRestClient in downloadSpoolContent with async/await syntax", async () => {
            ZosmfRestClient.getStreamed = jest.fn(throwError);
            let err: Error | ImperativeError;
            try {
                await DownloadJobs.downloadSpoolContent(fakeSession,
                    jobFiles[0]
                );
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message).toEqual(mockErrorMessage);
        });
    });

    describe("Error catching - Promise catch()", () => {
        /* eslint-disable jest/no-done-callback */
        it("should be able to catch errors thrown by ZosmfRestClient in downloadAllSpoolContentCommon with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.getExpectString = jest.fn(throwError);
            DownloadJobs.downloadAllSpoolContentCommon(fakeSession, {
                outDir: "./",
                jobname: fakeJobName,
                jobid: "JOB00001"
            }).then(() => {
                expect("Should have called .catch()").toEqual("test failed");
            }).catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toEqual(mockErrorMessage);
                done();
            });
        });

        it("should be able to catch errors thrown by ZosmfRestClient in downloadSpoolContentCommon with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.getExpectString = jest.fn(throwError);
            DownloadJobs.downloadSpoolContentCommon(fakeSession, {
                outDir: "./",
                jobFile: jobFiles[0]
            }).then(() => {
                expect("Should have called .catch()").toEqual("test failed");
            }).catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toEqual(mockErrorMessage);
                done();
            });
        });

        it("should be able to catch errors thrown by ZosmfRestClient in downloadSpoolContent with Promise.catch() syntax", (done: any) => {
            ZosmfRestClient.getStreamed = jest.fn(throwError);
            DownloadJobs.downloadSpoolContent(fakeSession,
                jobFiles[0]
            ).then(() => {
                expect("Should have called .catch()").toEqual("test failed");
            }).catch((e) => {
                expect(e).toBeDefined();
                expect(e.message).toEqual(mockErrorMessage);
                done();
            });
        });
        /* eslint-enable jest/no-done-callback */
    });

    describe("Parameter validation tests", () => {
        it("should reject calls to downloadAllSpoolContent that don't specify jobid", async () => {
            let err: Error | ImperativeError;
            try {
                await DownloadJobs.downloadAllSpoolContentCommon(fakeSession, {
                    outDir: "./",
                    jobname: fakeJobName,
                    jobid: undefined
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message.toLowerCase()).toContain("job id");
        });

        it("should reject calls to downloadAllSpoolContentCommon that don't specify jobname", async () => {
            let err: Error | ImperativeError;
            try {
                await DownloadJobs.downloadAllSpoolContentCommon(fakeSession, {
                    outDir: "./",
                    jobname: undefined,
                    jobid: "JOB00001"
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message.toLowerCase()).toContain("job name");
        });

        it("should reject calls to downloadSpoolContentCommon that don't specify jobFile", async () => {
            let err: Error | ImperativeError;
            try {
                await DownloadJobs.downloadSpoolContentCommon(fakeSession, {
                    outDir: "./",
                    jobFile: undefined
                });
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.message.toLowerCase()).toContain("job file");
        });

    });

    describe("Download destination tests", () => {

        it("should generate a file path for a job file with no procstep, no stepname. Job ID omitted. Default output dir", () => {
            const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
            delete jobFile.stepname;
            delete jobFile.procstep;
            const spoolParms: IDownloadSpoolContentParms = {
                jobFile: jobFile,
                jobid: fakeJobID,
                jobname: fakeJobName,
                omitJobidDirectory: true
            }
            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain("./output");
        });

        it("should generate a file path for a job file with no procstep, no stepname. Job ID included. Default output dir", () => {
            const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
            delete jobFile.stepname;
            delete jobFile.procstep;
            const spoolParms: IDownloadSpoolContentParms = {
                jobFile: jobFile,
                jobid: fakeJobID,
                jobname: fakeJobName,
                omitJobidDirectory: false
            }
            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain("./output");
            expect(downloadFilePath).toContain(fakeJobID);
        });

        it("should generate a file path for a job file with no procstep, but including a stepname. Job ID omitted. Custom output dir", () => {
            const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
            delete jobFile.procstep;
            const spoolParms: IDownloadSpoolContentParms = {
                jobFile: jobFile,
                outDir: "/customDir",
                jobid: fakeJobID,
                jobname: fakeJobName,
                omitJobidDirectory: true
            }
            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain("/customDir");
            expect(downloadFilePath).toContain(jobFile.stepname);
        });

        it("should generate a file path for a job file including procstep and jobname. Job ID included. Custom output dir", () => {
            const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
            const spoolParms: IDownloadSpoolContentParms = {
                jobFile: jobFile,
                outDir: "/customDir",
                jobid: fakeJobID,
                jobname: fakeJobName,
                omitJobidDirectory: false
            }
            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain("/customDir");
            expect(downloadFilePath).toContain(fakeJobID);
        });
    });
});