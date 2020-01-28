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
import { HMigrateDefinition } from "../../../src/cli/hMigrate/HMigrate.definintion";
import { ICommandDefinition } from "@zowe/imperative";

describe("zos-files migrate group definition", () => {
    it ("should not have changed", () => {
        const definition: ICommandDefinition = require("../../../src/cli/hMigrate/HMigrate.definintion").HMigrateDefinition;

        expect(definition).toBeDefined();
        expect(definition.options).toBeUndefined();
        expect(definition.examples).toBeUndefined();
        expect(definition.children).toBeDefined();
    });

    it("should be using the correct string field in the object", () => {
        expect(HMigrateDefinition.description).toBe(i18nEnglish.HMIGRATE.DESCRIPTION);
    });
});
