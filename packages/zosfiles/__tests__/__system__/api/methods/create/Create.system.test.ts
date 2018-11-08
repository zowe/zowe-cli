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

import { Imperative, Session } from "@brightside/imperative";
import { inspect } from "util";
import { Create, CreateDataSetTypeEnum, ICreateDataSetOptions, ICreateVsamOptions } from "../../../../../src/api/methods/create";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Delete } from "../../../../../src/api/methods/delete";
import { ZosFilesMessages } from "../../../../..";
import { getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";


let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let REAL_SESSION: Session;
let dsname: string;
let volume: string;

const LONGER_TIMEOUT = 10000;

describe("Create data set", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_dataset"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

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
});

describe("Create VSAM", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_vsam"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        volume = defaultSystem.datasets.list[0].vol;
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
});
