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

import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { join } from "path";
import { Session, Imperative } from "@zowe/imperative";
import { List, Delete, Create, CreateDataSetTypeEnum, IListOptions } from "../../../../..";
import { IRecallOptions } from "../../../../../src/api/methods/hRecall/doc/IRecallOptions";
import { inspect } from "util";
import { HMigrate } from "../../../../../src/api";

let TEST_ENVIRONMENT: ITestEnvironment;
let defaultSystem: ITestPropertiesSchema;
let dataSetName1: string;
let dataSetName2: string;
let dataSetName3: string;
let user: string;
let REAL_SESSION: Session;

const listOptions: IListOptions = { attributes: true };

const scriptsLocation = join(__dirname, "__scripts__", "command");
const recallScript = join(scriptsLocation, "command_recall_data_set.sh");
const recallScriptWait = join(scriptsLocation, "command_recall_data_set_wait.sh");
const recallScriptResponseTimeout = join(scriptsLocation, "command_recall_data_set_response_timeout.sh");

describe("Recall Dataset", () => {
  beforeAll(async () => {
    TEST_ENVIRONMENT = await TestEnvironment.setUp({
      tempProfileTypes: ["zosmf"],
      testName: "zos_recall_data_set"
    });
    defaultSystem = TEST_ENVIRONMENT.systemTestProperties;
    REAL_SESSION = TestEnvironment.createZosmfSession(TEST_ENVIRONMENT);

    user = defaultSystem.zosmf.user.trim().toUpperCase();
    dataSetName1 = `${user}.SDATAC.REC`;
    dataSetName2 = `${user}.PDATAC.REC`;
    dataSetName3 = `${user}.FAIL.REC`;
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
      it("Should recall a data set", async () => {
        const response = runCliScript(recallScript, TEST_ENVIRONMENT, [dataSetName1]);
        const list1 = await List.dataSet(REAL_SESSION, dataSetName1, listOptions);

        expect(list1.apiResponse.items[0].migr).toBe("NO");

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Data set recall requested.");
      });
      it("Should recall a data set with response timeout", async () => {
        const response = runCliScript(recallScriptResponseTimeout, TEST_ENVIRONMENT, [dataSetName1]);
        const list1 = await List.dataSet(REAL_SESSION, dataSetName1, listOptions);

        expect(list1.apiResponse.items[0].migr).toBe("NO");

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Data set recall requested.");
      });
      it("Should recall a data set with wait = true", async () => {
        const recallOptions: IRecallOptions = { "request": "hrecall", "wait": true };
        const response = runCliScript(recallScriptWait, TEST_ENVIRONMENT, [dataSetName1, recallOptions]);
        const list1 = await List.dataSet(REAL_SESSION, dataSetName1, listOptions);

        expect(list1.apiResponse.items[0].migr).toBe("NO");

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Data set recall requested.");
      });
    });
    describe("Partitioned Data Set", () => {
      beforeEach(async () => {
        try {
          await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSetName2);
          await HMigrate.dataSet(REAL_SESSION, dataSetName3);
        } catch (err) {
          Imperative.console.info(`Error: ${inspect(err)}`);
        }
      });
      it("Should recall a data set", async () => {
        const response = runCliScript(recallScript, TEST_ENVIRONMENT, [dataSetName2]);
        const list2 = await List.dataSet(REAL_SESSION, dataSetName2, listOptions);

        expect(list2.apiResponse.items[0].migr).toBe("NO");

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Data set recall requested.");
      });
      it("Should recall a data set with response timeout", async () => {
        const response = runCliScript(recallScriptResponseTimeout, TEST_ENVIRONMENT, [dataSetName2]);
        const list2 = await List.dataSet(REAL_SESSION, dataSetName2, listOptions);

        expect(list2.apiResponse.items[0].migr).toBe("NO");

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Data set recall requested.");
      });
      it("Should recall a data set with wait = true", async () => {
        const recallOptions: IRecallOptions = { "request": "hrecall", "wait": true };
        const response = runCliScript(recallScriptWait, TEST_ENVIRONMENT, [dataSetName2, recallOptions]);
        const list2 = await List.dataSet(REAL_SESSION, dataSetName2, listOptions);

        expect(list2.apiResponse.items[0].migr).toBe("NO");

        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toContain("Data set recall requested.");
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
        const response = runCliScript(recallScript, TEST_ENVIRONMENT, ["", dataSetName3]);

        expect(response.stderr.toString()).toBeTruthy();
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).not.toContain("Data set recall requested.");
      });
    });
  });
});
