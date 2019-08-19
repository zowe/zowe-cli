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

describe("UnmountDefinition", () => {
    it("should be using the correct string field in the object", () => {
        expect(UnmountDefinition.description).toBe(i18nEnglish.UNMOUNT.DESCRIPTION);
    });
});
