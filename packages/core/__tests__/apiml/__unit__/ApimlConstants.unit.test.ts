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

import { ApimlConstants } from "../../../src/apiml/ApimlConstants";
import { inspect } from "../../../../../__tests__/__src__/TestUtils";

describe("APIML Constants unit tests", () => {
    it("should not have changed", () => {
        expect(inspect(ApimlConstants)).toMatchSnapshot();
    });
});
