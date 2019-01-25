/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ICommandDefinition } from "@brightside/imperative";

const VIEW_CHILDREN: number = 2;

describe("zos-jobs view group definition", () => {
    it("should not have changed", () => {
        const definition: ICommandDefinition = require("../../../src/cli/view/View.definition").ViewDefinition;
        expect(definition).toBeDefined();
        expect(definition.children.length).toBe(VIEW_CHILDREN);
        delete definition.children;
        expect(definition).toMatchSnapshot();
    });
});
