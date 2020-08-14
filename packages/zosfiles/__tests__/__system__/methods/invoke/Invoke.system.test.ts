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

import * as fs from "fs";
import { Imperative, Session, TextUtils } from "@zowe/imperative";
import { inspect } from "util";

import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ZosFilesMessages } from "../../../../src/constants/ZosFiles.messages";
import { Invoke } from "../../../../src/methods/invoke/Invoke";
import { getUniqueDatasetName } from "../../../../../../__tests__/__src__/TestUtils";

let testEnvironment: ITestEnvironment;
let systemProps: ITestPropertiesSchema;
let REAL_SESSION: Session;
let dsname: string;
let volume: string;

describe("Invoke AMS", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_create_VSAM_dataset"
        });
        systemProps = testEnvironment.systemTestProperties;

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);

        dsname = getUniqueDatasetName(`${systemProps.zosmf.user}.ZOSFILE.VSAM`);
        volume = systemProps.datasets.vol.toUpperCase();
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    function createTestAMSStatementFileFromTemplate(templateFile: string) {
        // replace DSN with unique data set name
        const AMSStatement = fs.readFileSync(templateFile).toString();
        const updatedStatement = TextUtils.renderWithMustache(AMSStatement, {DSN: dsname, VOL: volume});
        fs.writeFileSync(templateFile + ".temp", updatedStatement);
        return templateFile + ".temp";
    }

    it("should create and delete a VSAM data set from command statement in files", async () => {
        let error;
        let response;

        // create a temporary file from the template file that has the proper high level qualifier to create the VSAM file
        let controlStatementFile: string =
            createTestAMSStatementFileFromTemplate("./packages/zosfiles/__tests__/__system__/methods/invoke/DefineVSAM.ams");

        try {
            response = await Invoke.ams(REAL_SESSION, controlStatementFile);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

        // Delete the temp file
        fs.unlinkSync(controlStatementFile);

        // create a temporary file from the template file that has the proper high level qualifier to delete the VSAM file
        controlStatementFile =
            createTestAMSStatementFileFromTemplate("./packages/zosfiles/__tests__/__system__/methods/invoke/DeleteVSAM.ams");

        try {
            response = await Invoke.ams(REAL_SESSION, controlStatementFile);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

        // Delete the temp file
        fs.unlinkSync(controlStatementFile);
    });

    it("should create and delete a VSAM data set from command statements", async () => {
        let error;
        let response;

        let controlStatement: string[] = [`DEFINE CLUSTER (NAME (${dsname}) CYLINDERS (5 2 ) VOLUMES(${volume}))`];

        try {
            response = await Invoke.ams(REAL_SESSION, controlStatement);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);

        // Delete the VSAM file
        controlStatement = [`DELETE (${dsname}) CLUSTER`];

        try {
            response = await Invoke.ams(REAL_SESSION, controlStatement);
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();

        expect(response.success).toBe(true);
        expect(response.commandResponse).toContain(ZosFilesMessages.amsCommandExecutedSuccessfully.message);
    });

    it("should fail if no control statements provided", async () => {
        let error;
        let response;

        try {
            response = await Invoke.ams(REAL_SESSION, "");
            Imperative.console.info("Response: " + inspect(response));
        } catch (err) {
            error = err;
            Imperative.console.info("Error: " + inspect(error));
        }

        expect(error).toBeTruthy();
        expect(response).toBeFalsy();

        expect(error.toString()).toContain("Error: Expect Error: Missing AMS statements to be submitted.");
    });
});
