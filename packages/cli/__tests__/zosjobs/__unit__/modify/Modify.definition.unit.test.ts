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
import * as ModifyDefintion from "../../../../src/zosjobs/modify/Modify.definition";

const VIEW_CHILDREN: number = 3;

describe("zos-jobs modify job definition", () => {
    it("should not have changed", () => {
        const definition: ICommandDefinition = ModifyDefintion.ModifyDefinition;
        expect(definition).toBeDefined();
        expect(definition).toMatchSnapshot();
    });
});
