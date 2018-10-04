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

describe("zos-tso start group definition", () => {
    it("should not have changed", () => {
        const definition: ICommandDefinition = require("../../../src/cli/start/Start.definition").StartCommand;
        expect(definition).toBeDefined();
        expect(definition.children.length).toBe(1);
        delete definition.children;
        expect(definition).toMatchSnapshot();
    });
});
