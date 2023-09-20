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

import { RestStandAloneUtils } from "../../src/client/RestStandAloneUtils";

const IN_USER = "shadyside";
const IN_PASSWORD = "darkside";
const ENCODED_VALUE = "c2hhZHlzaWRlOmRhcmtzaWRl";

describe("RestStandAloneUtils tests", () => {

    it("should get a user from a base64 encoded string", () => {
        const outUser = RestStandAloneUtils.getUsernameFromAuth(ENCODED_VALUE);
        expect(outUser).toBe(IN_USER);
    });

    it("should get a password from a base64 encoded string", () => {
        const outPassword = RestStandAloneUtils.getPasswordFromAuth(ENCODED_VALUE);
        expect(outPassword).toBe(IN_PASSWORD);
    });

});
