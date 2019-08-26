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
import { UnmountDefinition } from "../../../src/cli/unmount/Unmount.definition";
import { ICommandDefinition } from "@zowe/imperative";

describe("zos-files unmount group definition", () => {
    it("should not have changed", () => {
        const definition: ICommandDefinition = require("../../../src/cli/unmount/Unmount.definition").UnmountDefinition;

        expect(definition).toBeDefined();

        // Should not contain options nor examples since this is a group
        expect(definition.options).toBeUndefined();
        expect(definition.examples).toBeUndefined();

        // Should have children since this is a group
        expect(definition.children).toBeDefined();
    });

    it("should be using the correct string field in the object", () => {
        expect(UnmountDefinition.description).toBe(i18nEnglish.UNMOUNT.DESCRIPTION);
    });
});
