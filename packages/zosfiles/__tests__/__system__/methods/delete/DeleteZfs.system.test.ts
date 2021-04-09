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

import { Create, Delete, ZosFilesMessages } from "../../../../src";
import { Imperative, Session } from "@zowe/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName } from "../../../../../../__tests__/__src__/TestUtils";
import { ICreateZfsOptions } from "../../../../src/methods/create/doc/ICreateZfsOptions";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let fsname: string;

describe("Delete a z/OS File System", () => {
    const createOptions: ICreateZfsOptions = {} as any;
    const perms = 755;
    const cylsPri = 10;
    const cylsSec = 2;
    const timeout = 20;
    createOptions.perms = perms;
    createOptions.cylsPri = cylsPri;
    createOptions.cylsSec = cylsSec;
    createOptions.timeout = timeout;

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "zos_delete_zfs"
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
        fsname = getUniqueDatasetName(defaultSystem.zosmf.user);
        createOptions.volumes = [defaultSystem.datasets.vol];
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let error;
            let response;
            try {
                response = await Create.zfs(REAL_SESSION, fsname, createOptions);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
        });

        it("should delete a ZFS", async () => {
            let error;
            let response;

            try {
                response = await Delete.zfs(REAL_SESSION, fsname);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(ZosFilesMessages.zfsDeletedSuccessfully.message);
        });

        it("should delete a ZFS with response timeout", async () => {
            let error;
            let response;

            try {
                response = await Delete.zfs(REAL_SESSION, fsname, {responseTimeout: 5});
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeUndefined();
            expect(response).toBeDefined();
            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain(ZosFilesMessages.zfsDeletedSuccessfully.message);
        });
    });

    describe("Failure scenarios", () => {
        it("should display proper error message when called with invalid file system name", async () => {
            let error;
            let response;

            try {
                response = await Delete.zfs(REAL_SESSION, undefined);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeDefined();
            expect(response).toBeUndefined();
            expect(error.message).toContain(ZosFilesMessages.missingFileSystemName.message);
        });

        it("should display proper error message when try to delete non existing ZFS", async () => {
            let error;
            let response;
            const nonExistZfs = `${fsname}.NONEXIST`;

            try {
                response = await Delete.zfs(REAL_SESSION, nonExistZfs);
                Imperative.console.info("Response: " + inspect(response));
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }
            expect(error).toBeDefined();
            expect(response).toBeUndefined();
            expect(error.message).toContain("Error executing IDCAMS DELETE command. exit_code=8");
        });
    });

});
