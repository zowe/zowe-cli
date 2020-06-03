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

import { LoginConstants } from "../../src/api/LoginConstants";
import { LogoutConstants } from "../../src/api/LogoutConstants";

describe("LoginConstants Unit Test", () => {
    it("Should not have changed", () => {
        expect(LoginConstants.APIML_V1_RESOURCE).toMatchSnapshot();
    });
});

describe("LogoutConstants Unit Test", () => {
    it("Should not have changed", () => {
        expect(LogoutConstants.APIML_V1_RESOURCE).toMatchSnapshot();
        expect(LogoutConstants.APIML_V1_TOKEN_EXP_ERR).toMatchSnapshot();
    });
});
