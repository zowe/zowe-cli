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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { ITestBaseSchema } from "../../../../../../__tests__/__src__/properties/ITestBaseSchema";
import * as fs from "fs";
import * as path from "path";

describe("config auto-init without profile", () => {
    let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
    let base: ITestBaseSchema;

    beforeEach(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "config_auto_init_apiml"
        });

        base = TEST_ENVIRONMENT.systemTestProperties.base;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should successfully issue the auto-init command", () => {
        const response = runCliScript(__dirname + "/__scripts__/config_auto_init.sh",
            TEST_ENVIRONMENT,
            [
                base.host,
                base.port,
                base.user,
                base.password,
                base.rejectUnauthorized
            ]
        );

        const config = fs.readFileSync(path.join(TEST_ENVIRONMENT.workingDir, "zowe.config.json")).toString();
        const profiles = JSON.parse(config).profiles;
        let zosmfExists = false;
        let baseExists = false;
        let baseProperties;
        let baseSecure;
        
        for (const profile of Object.values(profiles)) {
            if ((profile as any).type === "zosmf") {
                zosmfExists = true;
            }
            if ((profile as any).type === "base") {
                baseExists = true;
                baseProperties = (profile as any).properties;
                baseSecure = (profile as any).secure;
            }
            if (baseExists && zosmfExists) {
                break;
            }
        }
 
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(zosmfExists).toBe(true);
        expect(baseExists).toBe(true);
        expect(baseProperties.host).toEqual(base.host);
        expect(baseProperties.port).toEqual(base.port);
        expect(baseSecure).toContain("authToken");
    });
});
