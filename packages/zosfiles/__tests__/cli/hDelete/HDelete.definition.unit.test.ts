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

import i18nEnglish from "../../../src/cli/-strings-/en";
import { ICommandDefinition } from "@zowe/imperative";
import { HDeleteDefinition } from "../../../src/cli/hDelete/HDelete.definition";

describe("zos-files delete group definition", () => {
    it ("should not have changed", () => {
        const definition: ICommandDefinition = require("../../../src/cli/hDelete/HDelete.definition").HDeleteDefinition;

        expect(definition).toBeDefined();
        expect(definition.options).toBeUndefined();
        expect(definition.examples).toBeUndefined();
        expect(definition.children).toBeDefined();
    });

    it("should be using the correct string field in the object", () => {
        expect(HDeleteDefinition.description).toBe(i18nEnglish.HDELETE.DESCRIPTION);
    });
});
