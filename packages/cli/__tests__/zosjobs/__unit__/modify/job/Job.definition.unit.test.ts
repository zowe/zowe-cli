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

// import * as ModifyDefinition from "../../../../../src/zosjobs/modify/Modify.definition";
 
describe("zos-jobs modify job definition", () => {
    it("should not have changed", () => {
        const definition = require("../../../../../src/zosjobs/modify/Modify.definition").ModifyDefinition;
        // const definition = ModifyDefinition.ModifyDefinition;
        expect(definition).toBeDefined();
        delete definition.children;
        expect(definition).toMatchSnapshot();
    });
});
