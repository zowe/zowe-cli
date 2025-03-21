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
import * as path from "path";
import { Upload } from "@zowe/zos-files-for-zowe-sdk";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { deleteFiles, getRandomBytes, getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { runCliScript } from "@zowe/cli-test-utils";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dsname: string;
let ussname: string;

describe("View uss file", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "view_uss_file",
            tempProfileTypes: ["zosmf"]
        });
        defaultSystem = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user + ".ZOSTEST");
        // using unique DS function to generate unique USS file name
        ussname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        afterEach(async () => {
            await deleteFiles(REAL_SESSION, ussname);
        });

        it("should view uss file", async () => {
            const data: string = "abcdefghijklmnopqrstuvwxyz";
            await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(data));

            const shellScript = path.join(__dirname, "__scripts__", "command", "command_view_uss_file.sh");
            const response = runCliScript(shellScript, testEnvironment, [ussname.substring(1, ussname.length)]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString().trim()).toEqual(data);
        });
        it("should view uss file in binary", async () => {
            const data: string = "abcdefghijklmnopqrstuvwxyz";
            await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(data), { binary: true });

            const shellScript = path.join(__dirname, "__scripts__", "command", "command_view_uss_file.sh");
            const response = runCliScript(shellScript, testEnvironment, [ussname.substring(1, ussname.length), "--binary"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString().trim()).toEqual(data);
        });
        it("should view large uss file in binary", async () => {
            const rawData: Buffer = await getRandomBytes(1024*64);
            const data = encodeURIComponent(rawData.toLocaleString());
            await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(data), { binary: true });

            const shellScript = path.join(__dirname, "__scripts__", "command", "command_view_uss_file.sh");
            const response = runCliScript(shellScript, testEnvironment, [ussname.substring(1, ussname.length), "--binary"]);
            const respdata = response.stdout.toLocaleString();

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(respdata.trim()).toEqual(data);
        });
        it("should view uss file with range", async () => {
            const data: string = "abcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz\n";
            await Upload.bufferToUssFile(REAL_SESSION, ussname, Buffer.from(data));

            const shellScript = path.join(__dirname, "__scripts__", "command", "command_view_uss_file.sh");
            const response = runCliScript(shellScript, testEnvironment, [ussname.substring(1, ussname.length), "--range", "0,1"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString().trim()).toEqual("abcdefghijklmnopqrstuvwxyz");
        });
    });
});
