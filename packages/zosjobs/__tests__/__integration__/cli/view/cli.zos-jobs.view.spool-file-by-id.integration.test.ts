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

import { ITestEnvironment } from "./../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "./../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "./../../../../../../__tests__/__src__/TestUtils";
import { Session } from "@brightside/imperative";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";

// TODO - Add cleanup logic when the properties are available

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let IEFBR14_JOB: string;
let REAL_SESSION: Session;
let ACCOUNT: string;
let JOB_NAME: string;
let NON_HELD_JOBCLASS: string;

describe("zos-jobs view spool-file-by-id command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_view_spool_file_by_id_command",
            tempProfileTypes: ["zosmf"]
        });

        IEFBR14_JOB = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
        const systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        const defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

        ACCOUNT = defaultSystem.tso.account;
        const JOB_LENGTH = 6;
        JOB_NAME = REAL_SESSION.ISession.user.substr(0, JOB_LENGTH).toUpperCase() + "SF";
        NON_HELD_JOBCLASS = TEST_ENVIRONMENT.systemTestProperties.zosjobs.jobclass;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.status).toBe(0);
    });

    describe("syntax errors", () => {
        it("should occur if the jobid and spool file id are missing", async () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/missing_jobid_and_spool_id.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
            expect(response.status).toBe(1);
        });

        it("should occur if the spool file id is missing", async () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/missing_spool_id.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
            expect(response.status).toBe(1);
        });
    });

});
