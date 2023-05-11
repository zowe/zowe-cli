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
import { ZosFilesConstants, ZosmfRestClient, ZosmfHeaders } from "@zowe/cli";
import {ITestEnvironment, runCliScript} from "@zowe/cli-test-utils";
import {TestEnvironment} from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import {ITestPropertiesSchema} from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { getUniqueDatasetName} from "../../../../../../../__tests__/__src__/TestUtils";

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

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.password,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
        // using unique DS function to generate unique USS file name
        ussname = dsname.replace(/\./g, "");
        ussname = `${defaultSystem.unix.testdir}/${ussname}`;
        Imperative.console.info("Using ussfile:" + ussname);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        beforeEach(async () => {
            let response;
            let error;
            const data = "{\"type\":\"file\",\"mode\":\"RWXRW-RW-\"}";
            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
            try {
                response = await ZosmfRestClient.postExpectString(REAL_SESSION, endpoint, [], data);
            } catch (err) {
                error = err;
            }
        });

        afterEach(async () => {
            let error;
            let response;

            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;

            try {
                response = await ZosmfRestClient.deleteExpectString(REAL_SESSION, endpoint);
            } catch (err) {
                error = err;
            }
        });

        it("should view uss file", async () => {
            const data: string = "abcdefghijklmnopqrstuvwxyz";
            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
            await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

            const shellScript = path.join(__dirname, "__scripts__", "command", "command_view_uss_file.sh");
            const response = runCliScript(shellScript, testEnvironment, [ussname.substr(1, ussname.length)]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString().trim()).toEqual(data);
        });
        it("should view uss file in binary", async () => {
            const data: string = "abcdefghijklmnopqrstuvwxyz";
            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
            await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [ZosmfHeaders.X_IBM_BINARY], data);

            const shellScript = path.join(__dirname, "__scripts__", "command", "command_view_uss_file.sh");
            const response = runCliScript(shellScript, testEnvironment, [ussname.substr(1, ussname.length), "--binary"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString().trim()).toEqual(data);
        });
        it("should view uss file with range", async () => {
            const data: string = "abcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz\n";
            const endpoint: string = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + ussname;
            await ZosmfRestClient.putExpectString(REAL_SESSION, endpoint, [], data);

            const shellScript = path.join(__dirname, "__scripts__", "command", "command_view_uss_file.sh");
            const response = runCliScript(shellScript, testEnvironment, [ussname.substr(1, ussname.length), "--range", "0,1"]);

            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString().trim()).toEqual("abcdefghijklmnopqrstuvwxyz");
        });
    });
});
