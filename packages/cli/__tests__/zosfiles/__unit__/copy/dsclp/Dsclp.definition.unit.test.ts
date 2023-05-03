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
import { DsclpDefinition } from "../../../../../src/zosfiles/copy/dsclp/Dsclp.definition";

describe("DsDefinition", () => {
    it("should use the correct object for strings", () => {
        const strings = i18nEnglish.COPY.ACTIONS.DATA_SET_CROSS_LPAR;

        expect(DsclpDefinition.description).toBe(strings.DESCRIPTION);
        expect(DsclpDefinition.children).toBeUndefined();
        expect(DsclpDefinition.profile.optional).toEqual(["zosmf"]);
        expect(DsclpDefinition.options).toMatchSnapshot();
        expect(DsclpDefinition.examples).toMatchSnapshot();
        expect(DsclpDefinition.description).toBe(strings.DESCRIPTION);
    });
});
