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

import { ICommandDefinition } from "@zowe/imperative";

describe("zos-tso group definition", () => {
    it("should not have changed", () => {
        const CHILDREN = 5;
        const definition: ICommandDefinition = require("../../src/cli/ZosTso.definition");
        expect(definition).toBeDefined();
        expect(definition.children.length).toBe(CHILDREN);
        delete definition.children;
        expect(definition).toMatchSnapshot();
    });
});
