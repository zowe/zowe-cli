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

import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { Create, CreateDataSetTypeEnum, ICreateDataSetOptions, ICreateVsamOptions } from "../../../../src/methods/create";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Delete } from "../../../../src/methods/delete";
import { ZosFilesMessages } from "../../../../";
import { getUniqueDatasetName } from "../../../../../../__tests__/__src__/TestUtils";
import { ICreateZfsOptions } from "../../../../src/methods/create/doc/ICreateZfsOptions";


let testEnvironment: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let REAL_SESSION: Session;
let dsname: string;
let volume: string;
let filename: string;
let basePath: string;

const LONGER_TIMEOUT = 10000;

describe("Create data set", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_create_dataset"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dsname = `${defaultSystem.zosmf.user.trim().toUpperCase()}.TEST.DATA.SET`;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    beforeEach(async () => {
        let response;
        try {
            response = await Delete.dataSet(REAL_SESSION, dsname);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    afterEach(async () => {
        let response;
        try {
            response = await Delete.dataSet(REAL_SESSION, dsname);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    const options: ICreateDataSetOptions = {} as any;

    it("should create a partitioned data set", async () => {
        let error;
        let response;

        try {
            response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname, options);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.dataSetCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);

    it("should create a partitioned data set with response timeout", async () => {
        let error;
        let response;

        const tempOptions = { ...options, responseTimeout: 5 };

        try {
            response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname, tempOptions);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.dataSetCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);

    it("should create a sequential data set", async () => {
        let error;
        let response;

        try {
            response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname, options);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.dataSetCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);

    it("should create a sequential data set with response timeout", async () => {
        let error;
        let response;

        const tempOptions = { ...options, responseTimeout: 5 };

        try {
            response = await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dsname, tempOptions);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.dataSetCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);
});

describe("Allocate Like", () => {
    let dsnameLike: string;
    const options: ICreateDataSetOptions = {
        dsorg: "PO",
        alcunit: "CYL",
        primary: 20,
        recfm: "FB",
        blksize: 6160,
        lrecl: 80,
        showAttributes: true
    } as any;

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_create_dataset_like"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        dsnameLike = `${dsname}.LIKE`;

        await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, dsname, options);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    beforeEach(async () => {
        try {
            await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_CLASSIC, dsname, options);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    afterEach(async () => {
        try {
            await Delete.dataSet(REAL_SESSION, dsname);
            await Delete.dataSet(REAL_SESSION, dsnameLike);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    it("should be able to allocate like from a sequential data set", async () => {
        let error;
        let response;

        try {
            response = await Create.dataSetLike(REAL_SESSION, dsnameLike, dsname);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();
        expect(response.commandResponse).toContain(ZosFilesMessages.dataSetCreatedSuccessfully.message);
    });
});

describe("Create VSAM", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_create_vsam"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        volume = defaultSystem.datasets.vol;
        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    beforeEach(async () => {
        let response;
        try {
            response = await Delete.vsam(REAL_SESSION, dsname);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    afterEach(async () => {
        let response;
        try {
            response = await Delete.vsam(REAL_SESSION, dsname);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    const options: ICreateVsamOptions = {} as any;

    it("should create a VSAM data set with defaults (volume must be specified)", async () => {
        let error;
        let response;

        options.volumes = volume;

        try {
            response = await Create.vsam(REAL_SESSION, dsname, options);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.dataSetCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);

    it("should create a VSAM data set with response timeout (volume must be specified)", async () => {
        let error;
        let response;

        const tempOptions = { ...options, responseTimeout: 5 };

        try {
            response = await Create.vsam(REAL_SESSION, dsname, tempOptions);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.dataSetCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);
});

describe("Create z/OS file system", () => {
    let fsname: string;

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_create_zfs"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        fsname = getUniqueDatasetName(defaultSystem.zosmf.user);
        volume = defaultSystem.datasets.vol;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    beforeEach(async () => {
        let response;
        try {
            response = await Delete.zfs(REAL_SESSION, fsname);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    afterEach(async () => {
        let response;
        try {
            response = await Delete.zfs(REAL_SESSION, fsname);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    const options: ICreateZfsOptions = {} as any;
    const perms = 755;
    const cylsPri = 10;
    const cylsSec = 2;
    const timeout = 20;

    it("should create a ZFS with defaults", async () => {
        let error;
        let response;

        options.perms = perms;
        options.cylsPri = cylsPri;
        options.cylsSec = cylsSec;
        options.timeout = timeout;
        options.volumes = [volume];

        try {
            response = await Create.zfs(REAL_SESSION, fsname, options);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeUndefined();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.zfsCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);

    it("should create a ZFS with response timeout", async () => {
        let error;
        let response;

        const tempOptions = { ...options, responseTimeout: 5 };

        try {
            response = await Create.zfs(REAL_SESSION, fsname, tempOptions);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeUndefined();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.zfsCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);
});

describe("Create uss file", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_create_uss_file"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        basePath = defaultSystem.unix.testdir; // `${defaultSystem.zosmf.basePath.trim()}`;
        filename = `${basePath}/test.txt`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    beforeEach(async () => {
        let response;
        try {
            response = await Delete.ussFile(REAL_SESSION, filename);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    afterEach(async () => {
        let response;
        try {
            response = await Delete.ussFile(REAL_SESSION, filename);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    const options: ICreateDataSetOptions = {} as any;

    it("should create a uss file", async () => {
        let error;
        let response;

        try {
            response = await Create.uss(REAL_SESSION, filename, "file");
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.ussCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);

    it("should create a uss file with response timeout", async () => {
        let error;
        let response;

        try {
            response = await Create.uss(REAL_SESSION, filename, "file", undefined, {responseTimeout: 5});
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.ussCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);
});

describe("Create uss directory", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_create_uss_dir"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        // dsname = `${defaultSystem.zosmf.user.trim().toUpperCase()}.TEST.DATA.SET`;
        basePath = defaultSystem.unix.testdir; // `${defaultSystem.zosmf.basePath.trim()}`;
        filename = `${basePath}/testDir`.replace(/\./g, "");
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    beforeEach(async () => {
        let response;
        try {
            response = await Delete.ussFile(REAL_SESSION, filename);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    afterEach(async () => {
        let response;
        try {
            response = await Delete.ussFile(REAL_SESSION, filename);
        } catch (error) {
            Imperative.console.info("Error: " + inspect(error));
        }
    });

    const options: ICreateDataSetOptions = {} as any;

    it("should create a uss directory", async () => {
        let error;
        let response;

        try {
            response = await Create.uss(REAL_SESSION, filename, "directory");
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.ussCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);

    it("should create a uss directory with response timeout", async () => {
        let error;
        let response;

        try {
            response = await Create.uss(REAL_SESSION, filename, "directory", undefined, {responseTimeout: 5});
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.ussCreatedSuccessfully.message);
    }, LONGER_TIMEOUT);
});
