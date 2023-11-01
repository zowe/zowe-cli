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

import { TestSubOp6 } from "./subops/TestSubOp6";
import { TestOperations1 } from "./TestOperations1";
import { TestOperations2 } from "./TestOperations2";
import { Operations } from "../../../src/index";

export class TestOperations3 extends Operations<any> {

    constructor() {
        super("Test Operations 3", true);
        this.defineOperations();
    }

    protected defineOperations(): void {
        this.addNextOperation(new TestOperations1());
        this.addNextOperation(new TestOperations2());
        this.addNextOperation(new TestSubOp6());
    }
}
