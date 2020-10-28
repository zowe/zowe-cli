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

import { ICommandDefinition } from "@zowe/imperative";

describe("zos-files upload stds command definition", () => {
    it("should not have changed", () => {
        const definition: ICommandDefinition = require("../../../../../src/zosfiles/upload/stds/StdinToDataSet.definition").StdinToDataSetDefinition;

        expect(definition).toBeDefined();

        expect(definition.children).toBeUndefined();

        expect(definition.profile.optional).toEqual(["zosmf"]);

        expect(definition.positionals.length).toEqual(1);

        expect(definition.positionals[0].required).toBeTruthy();

        expect(definition.opitons).toMatchSnapshot();
        expect(definition.examples).toMatchSnapshot();
    });
});
