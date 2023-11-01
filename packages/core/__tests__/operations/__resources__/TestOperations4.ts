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

import { TestOperations1 } from "./TestOperations1";
import { TestOperations2 } from "./TestOperations2";
import { TestSubOpFail } from "./subops/TestSubOpFail";
import { Operations } from "../../../src/index";

export class TestOperations4 extends Operations<any> {

    constructor() {
        super("Test Operations 4: Fail Test", true);
        this.defineOperations();
    }

    protected defineOperations(): void {
        this.addNextOperation(new TestOperations1());
        this.addNextOperation(new TestOperations2());
        this.addNextOperation(new TestSubOpFail());
    }
}
