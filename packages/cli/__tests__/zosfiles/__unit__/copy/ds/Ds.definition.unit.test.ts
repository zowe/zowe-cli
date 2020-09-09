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

import i18nEnglish from "../../../../src/-strings-/en";
import { DsDefinition } from "../../../../src/copy/ds/Ds.definition";

describe("DsDefinition", () => {
    it("should use the correct object for strings", () => {
        const strings = i18nEnglish.COPY.ACTIONS.DATA_SET;

        expect(DsDefinition.description).toBe(strings.DESCRIPTION);
        expect(DsDefinition.children).toBeUndefined();
        expect(DsDefinition.profile.optional).toEqual(["zosmf"]);
        expect(DsDefinition.options).toMatchSnapshot();
        expect(DsDefinition.examples).toMatchSnapshot();
        expect(DsDefinition.description).toBe(strings.DESCRIPTION);
    });
});
