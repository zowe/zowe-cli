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
import { CopyDefinition } from "../../../src/cli/copy/Copy.definition";

describe("Copy Definition", () => {
    it("should be using the correct string field in the object", () => {
        expect(CopyDefinition.description).toBe(i18nEnglish.COPY.DESCRIPTION);

        // Should have children since this is a group
        expect(CopyDefinition.children).toBeDefined();
    });
});
