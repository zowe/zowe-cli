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

import { ITestEnvironment } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../__tests__/__src__/properties/ITestPropertiesSchema";
import { Session, ImperativeError, Imperative } from "@zowe/imperative";
import { Services } from "../../../src/apiml/Services";
import { IApimlSvcAttrsLoaded } from "../../../src/apiml/doc/IApimlSvcAttrsLoaded";
import { IApimlProfileInfo } from "../../../src/apiml/doc/IApimlProfileInfo";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let REAL_SESSION: Session;

describe("APIML Services system test", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "apiml_services"
        });
        REAL_SESSION = TestEnvironment.createBaseSession(testEnvironment);
        REAL_SESSION.ISession.type = "basic";
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    it("should succeed with correct parameters and retrieve z/OSMF connection info", async () => {
        const pluginConfigs: IApimlSvcAttrsLoaded[] = [
            {
                apiId: "ibm.zosmf",
                gatewayUrl: "api/v1",
                connProfType: "zosmf",
                pluginName: "@zowe/cli"
            }
        ];
        let response: IApimlProfileInfo[];
        let caughtError;

        try {
            response = await Services.getServicesByConfig(REAL_SESSION, pluginConfigs);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeUndefined();
        const zosmfProfileInfo = response.find(({ profType }) => profType === "zosmf");
        expect(zosmfProfileInfo).toBeTruthy();
        expect(new Array(...zosmfProfileInfo.pluginConfigs)).toEqual(pluginConfigs);
    });
});
