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

import i18nEnglish from "../../../../../src/zosfiles/-strings-/en";
import { DatasetDefinition } from "../../../../../src/zosfiles/edit/ds/Dataset.definition";

describe("DatasetDefinition", () => {
    it("should use the correct object for strings", () => {
        const strings = i18nEnglish.EDIT.ACTIONS.DATA_SET;

        expect(DatasetDefinition.description).toBe(strings.DESCRIPTION);
        expect(DatasetDefinition.children).toBeUndefined();
        expect(DatasetDefinition.options).toMatchSnapshot();
        expect(DatasetDefinition.examples).toMatchSnapshot();
        expect(DatasetDefinition.description).toBe(strings.DESCRIPTION);
    });
});
