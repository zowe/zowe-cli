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

import { Session } from "@brightside/imperative";
import { getUniqueDatasetName, runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Delete, IDeleteVsamOptions } from "../../../../../src/api/methods/delete";
import { ICreateVsamOptions } from "../../../../../src/api/methods/create";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;
let volume: string;

describe("Create VSAM Data Set", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_vsam_data_set"
        });

        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized,
        });

        dsname = getUniqueDatasetName(`${defaultSystem.zosmf.user}.ZOSFILE.VSAM`);
        volume = defaultSystem.datasets.list[0].vol;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Help scenarios", () => {

        it("should display create data-set-vsam help", () => {
            const response = runCliScript(__dirname + "/__scripts__/create_vsam_help.sh", testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Success scenarios", () => {

        afterEach(async () => {
            // use DELETE APIs
            const deleteOptions: IDeleteVsamOptions = {} as any;

            deleteOptions.purge = true;

            const response = await Delete.vsam(REAL_SESSION, dsname, deleteOptions);
        });

        it("should create a VSAM data set", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_vsam.sh",
              testEnvironment, [dsname, `-v ${volume}`]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        it("should create a VSAM data set specifying 'retain-to'", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_vsam.sh",
                testEnvironment, [dsname, `-v ${volume} --rt 2018360`]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });

        it("should create a VSAM data set specifying 'size '", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_vsam.sh",
                testEnvironment, [dsname, `-v ${volume} --size 30MB`]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
        });
    });

    describe("Expected failures", () => {

        it("should fail creating a VSAM data set due to missing data set name", () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_create_vsam.sh",
              testEnvironment, []);
            expect(response.stderr.toString()).toContain("Missing Positional Option");
            expect(response.stderr.toString()).toContain("dataSetName");
        });
    });
});
