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

import { AbstractSession, ImperativeError, IO } from "@zowe/core-for-zowe-sdk";
import { DownloadJobs, GetJobs, IDownloadAllSpoolContentParms, IDownloadSpoolContentParms, IJobFile } from "../../src";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { Writable } from "stream";

jest.mock("@zowe/core-for-zowe-sdk/src/rest/ZosmfRestClient");
jest.mock("../../src/GetJobs");

// Unit tests for DownloadJobs API
describe("DownloadJobs", () => {

    IO.writeFileAsync = jest.fn(async (file: any, content: any) => {
        // do nothing
    });

    IO.createFileSync = jest.fn((directory: string) => {
        // do nothing;
    });

    IO.createWriteStream = jest.fn((file: string): any => {
        // do nothing;
    });

    const mockErrorMessage = "This is our mocked error message.";
    const throwError = async () => {
        throw new Error(mockErrorMessage);
    };

    const fakeSession: any = {};
    const fakeJobName = "MYJOB1";
    const fakeJobID = "JOB0001";
    const expectedMockSpoolContent = "Hello! This is my spool content.";
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
            ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                // do nothing; method called within DowloadJobs.downloadSpoolContentCommon
            });
            IO.createDirsSyncFromFilePath = jest.fn((directory: string) => {
                // do nothing; method called within DowloadJobs.downloadSpoolContentCommon
            });
        });

        it ("should allow users to call downloadSpoolContent with correct parameters",async () => {
            const spoolParms: IDownloadSpoolContentParms = {
                jobFile: jobFiles[0],
                jobid: fakeJobID,
                jobname: fakeJobName,
            };

            await DownloadJobs.downloadSpoolContent(fakeSession, jobFiles[0]);
            const expectedFile = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
        });

        it("should allow users to call getSpoolDownloadFilePath with specified file extension and output dir",async () => {
            //test that custom directory was created for spool content
            const spoolParms: IDownloadSpoolContentParms = {
                jobFile: jobFiles[0],
                outDir: "/fakedir",
                jobid: fakeJobID,
                jobname: fakeJobName,
                extension: ".md",
            };

            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain("/fakedir");
            expect(downloadFilePath).toContain(fakeJobID);
            expect(downloadFilePath).toContain(".md");
        });

        describe("downloadAllSpoolContentCommon", () => {
            it("should allow users to call downloadAllSpoolContentCommon with correct parameters", async () => {
                const allSpoolParms: IDownloadAllSpoolContentParms = {
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                };
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFiles[0]
                };

                await DownloadJobs.downloadAllSpoolContentCommon(fakeSession, allSpoolParms);
                const expectedFile = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

                expect(GetJobs.getSpoolFiles).toHaveBeenCalled();
                expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
            });

            it("should allow users to call downloadAllSpoolContentCommon with correct parameters and binary mode", async () => {
                let uri: string = "";
                ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                    uri = resource;
                });
                const allSpoolParms: IDownloadAllSpoolContentParms = {
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                    binary: true
                };
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFiles[0]
                };

                await DownloadJobs.downloadAllSpoolContentCommon(fakeSession, allSpoolParms);
                const expectedFile = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

                expect(GetJobs.getSpoolFiles).toHaveBeenCalled();
                expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
                expect(uri).toContain("?mode=binary");
            });

            it("should allow users to call downloadAllSpoolContentCommon with correct parameters and record mode", async () => {
                let uri: string = "";
                ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                    uri = resource;
                });
                const allSpoolParms: IDownloadAllSpoolContentParms = {
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                    record: true
                };
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFiles[0]
                };

                await DownloadJobs.downloadAllSpoolContentCommon(fakeSession, allSpoolParms);
                const expectedFile = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

                expect(GetJobs.getSpoolFiles).toHaveBeenCalled();
                expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(expectedFile);
                expect(uri).toContain("?mode=record");
            });

            it("should allow users to call downloadAllSpoolContentCommon with a job containing duplicate step names", async () => {
                const sampJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
                GetJobs.getSpoolFiles = jest.fn(async (session: any, jobname: string, jobid: string) => {
                    return [sampJobFile, sampJobFile, sampJobFile];
                });
                const allSpoolParms: IDownloadAllSpoolContentParms = {
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                };
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFiles[0]
                };

                await DownloadJobs.downloadAllSpoolContentCommon(fakeSession, allSpoolParms);
                const expectedFile = DownloadJobs.getSpoolDownloadFilePath(spoolParms);
                const expectedExt = DownloadJobs.DEFAULT_JOBS_OUTPUT_FILE_EXT;
                expect(GetJobs.getSpoolFiles).toHaveBeenCalled();
                expect((IO.createDirsSyncFromFilePath as any).mock.calls).toEqual([
                    [expectedFile],
                    [expectedFile.slice(0, -expectedExt.length) + "(1)" + expectedExt],
                    [expectedFile.slice(0, -expectedExt.length) + "(2)" + expectedExt]
                ]);
            });
        });

        describe("downloadSpoolContentCommon", () => {
            it("should allow users to call downloadSpoolContentCommon with correct params (jobFile with no procstep in default outDir)", async () => {
                const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
                delete jobFile.procstep;
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFile,
                    outDir: "./myDir",
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                };
                const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

                await DownloadJobs.downloadSpoolContentCommon(fakeSession, spoolParms);

                expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(downloadFilePath);
                expect(downloadFilePath).not.toContain("PROC");
            });

            it("should allow users to call downloadSpoolContentCommon with correct parameters (default output directory)", async () => {
                const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFile,
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                };
                const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

                await DownloadJobs.downloadSpoolContentCommon(fakeSession, spoolParms);

                expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(downloadFilePath);
                expect(downloadFilePath).toContain(DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR);
            });

            it("should allow users to call downloadSpoolContentCommon with correct parameters (default outDir and binary mode)", async () => {
                let uri: string = "";
                ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                    uri = resource;
                });
                const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFile,
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                    binary: true
                };
                const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

                await DownloadJobs.downloadSpoolContentCommon(fakeSession, spoolParms);

                expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(downloadFilePath);
                expect(uri).toContain("?mode=binary");
            });

            it("should allow users to call downloadSpoolContentCommon with correct parameters (streamed in binary mode)", async () => {
                let uri: string = "";
                ZosmfRestClient.getStreamed = jest.fn(async (s: AbstractSession, resource: string, r?: any[], stream?: Writable): Promise<any> => {
                    uri = resource;
                    stream?._write("test", "utf-8", jest.fn());
                });
                const chunks: any[] = [];
                const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFile,
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                    binary: true,
                    stream: new Writable({write: (chunk) => {
                        chunks.push(chunk);
                    }})
                };

                await DownloadJobs.downloadSpoolContentCommon(fakeSession, spoolParms);

                expect(IO.createDirsSyncFromFilePath).not.toHaveBeenCalled();
                expect(uri).toContain("?mode=binary");
                expect(chunks).toEqual(["test"]);
            });

            it("should allow users to call downloadSpoolContentCommon with correct parameters (default outDir and record mode)", async () => {
                let uri: string = "";
                ZosmfRestClient.getStreamed = jest.fn(async (session: AbstractSession, resource: string, reqHeaders?: any[]): Promise<any> => {
                    uri = resource;
                });
                const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFile,
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                    record: true
                };
                const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

                await DownloadJobs.downloadSpoolContentCommon(fakeSession, spoolParms);

                expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(downloadFilePath);
                expect(uri).toContain("?mode=record");
            });

            it("should allow users to call downloadSpoolContentCommon with correct parameters (omitting job ID in the resulting dir)", async () => {
                const jobFile: IJobFile = JSON.parse(JSON.stringify(jobFiles[0]));
                const spoolParms: IDownloadSpoolContentParms = {
                    jobFile: jobFile,
                    outDir: "./myDir",
                    jobid: fakeJobID,
                    jobname: fakeJobName,
                    omitJobidDirectory: true
                };
                const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

                await DownloadJobs.downloadSpoolContentCommon(fakeSession, spoolParms);

                expect(IO.createDirsSyncFromFilePath).toHaveBeenCalledWith(downloadFilePath);
                expect(downloadFilePath).not.toContain(spoolParms.jobid);
            });
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
            };
            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain(DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR);
            expect(downloadFilePath).not.toContain(spoolParms.jobid);
            expect(downloadFilePath).not.toContain("PROC");
            expect(downloadFilePath).not.toContain("STEP");
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
            };
            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain(DownloadJobs.DEFAULT_JOBS_OUTPUT_DIR);
            expect(downloadFilePath).toContain(spoolParms.jobid);
            expect(downloadFilePath).not.toContain("PROC");
            expect(downloadFilePath).not.toContain("STEP");
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
            };
            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain(spoolParms.outDir);
            expect(downloadFilePath).not.toContain(spoolParms.jobid);
            expect(downloadFilePath).not.toContain("PROC");
            expect(downloadFilePath).toContain("STEP");
        });

        it("should generate a file path for a job file including procstep and stepname. Job ID included. Custom output dir", () => {
            const spoolParms: IDownloadSpoolContentParms = {
                jobFile: jobFiles[0],
                outDir: "/customDir",
                jobid: fakeJobID,
                jobname: fakeJobName,
                omitJobidDirectory: false
            };
            const downloadFilePath = DownloadJobs.getSpoolDownloadFilePath(spoolParms);

            expect(downloadFilePath).toContain(spoolParms.outDir);
            expect(downloadFilePath).toContain(spoolParms.jobid);
            expect(downloadFilePath).toContain("PROC");
            expect(downloadFilePath).toContain("STEP");
        });
    });
});