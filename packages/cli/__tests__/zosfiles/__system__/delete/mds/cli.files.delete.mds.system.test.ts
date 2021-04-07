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

import { ITestEnvironment, runCliScript } from "../../../../../../../__tests__/__packages__/cli-test-utils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { join } from "path";
import { Session, Imperative } from "@zowe/imperative";
import { inspect } from "util";
import { Delete, Create, CreateDataSetTypeEnum, IDeleteOptions, HMigrate } from "@zowe/zos-files-for-zowe-sdk";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let defaultSystem: ITestPropertiesSchema;
let dataSetName1: string;
let dataSetName2: string;
let dataSetName3: string;
let user: string;
let REAL_SESSION: Session;


const scriptsLocation = join(__dirname, "__scripts__", "command");
const deleteScript = join(scriptsLocation, "command_delete_migrated_data_set.sh");
const deleteScriptWait = join(scriptsLocation, "command_delete_migrated_data_set_wait.sh");
const deleteScriptPurge = join(scriptsLocation, "command_delete_migrated_data_set_purge.sh");

describe("Delete migrated Dataset", () => {
  beforeAll(async () => {
    TEST_ENVIRONMENT = await TestEnvironment.setUp({
      tempProfileTypes: ["zosmf"],
      testName: "zos_delete_migrated_data_set"
    });
    defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
    REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

    user = defaultSystem.zosmf.user.trim().toUpperCase();
    dataSetName1 = `${user}.SDATAC.DEL`;
    dataSetName2 = `${user}.PDATAC.DEL`;
    dataSetName3 = `${user}.FAIL.DEL`;
  });

  afterAll(async () => {
    await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
  });

  afterEach(async () => {
    try {
      await Promise.all([
        Delete.dataSet(REAL_SESSION, dataSetName1),
        Delete.dataSet(REAL_SESSION, dataSetName2),
        Delete.dataSet(REAL_SESSION, dataSetName3)]);
    } catch (err) {
      Imperative.console.info(`Error: ${inspect(err)}`);
    }
  });

  describe("Success scenarios", () => {
    describe("Sequential Data Set", () => {
      beforeEach(async () => {
        try {
          await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSetName1);
          await HMigrate.dataSet(REAL_SESSION, dataSetName1);
        } catch (err) {
          Imperative.console.info(`Error: ${inspect(err)}`);
        }
      });
      it("Should delete a migrated data set", async () => {
        const response = runCliScript(deleteScript, TEST_ENVIRONMENT, [dataSetName1]);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("Data set deletion requested.");
      });
      it("Should delete a migrated data set with wait = true", async () => {
        const deleteOptions: IDeleteOptions = { wait: true };
        const response = runCliScript(deleteScriptWait, TEST_ENVIRONMENT, [dataSetName1, deleteOptions]);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("Data set deletion requested.");
      });
      it("Should delete a migrated data set with purge = true", async () => {
        const deleteOptions: IDeleteOptions = { purge: true };
        const response = runCliScript(deleteScriptWait, TEST_ENVIRONMENT, [dataSetName1, deleteOptions]);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("Data set deletion requested.");
      });
    });
    describe("Partitioned Data Set", () => {
      beforeEach(async () => {
        try {
          await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSetName2);
          await HMigrate.dataSet(REAL_SESSION, dataSetName2);
        } catch (err) {
          Imperative.console.info(`Error: ${inspect(err)}`);
        }
      });
      it("Should delete a migrated data set", async () => {
        const response = runCliScript(deleteScript, TEST_ENVIRONMENT, [dataSetName2]);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("Data set deletion requested.");
      });
      it("Should delete a migrated data set with wait = true", async () => {
        const deleteOptions: IDeleteOptions = { wait: true };
        const response = runCliScript(deleteScriptWait, TEST_ENVIRONMENT, [dataSetName2, deleteOptions]);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("Data set deletion requested.");
      });
      it("Should delete a migrated data set with purge = true", async () => {
        const deleteOptions: IDeleteOptions = { purge: true };
        const response = runCliScript(deleteScriptPurge, TEST_ENVIRONMENT, [dataSetName2, deleteOptions]);

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
        expect(response.stdout.toString()).toContain("Data set deletion requested.");
      });
    });
  });
  describe("Failure scenarios", () => {
    describe("Sequential Data Set", () => {
      beforeEach(async () => {
        try {
          await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSetName3);
          await HMigrate.dataSet(REAL_SESSION, dataSetName3);
        } catch (err) {
          Imperative.console.info(`Error: ${inspect(err)}`);
        }
      });
      it("Should throw an error if a missing data set name is selected", async () => {
        const response = runCliScript(deleteScript, TEST_ENVIRONMENT, ["", dataSetName3]);

        expect(response.stderr.toString()).toBeTruthy();
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).not.toContain("Data set deletion requested.");
      });
    });
  });
});
