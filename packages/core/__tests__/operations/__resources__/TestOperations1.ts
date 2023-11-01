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

import { TestSubOp1 } from "./subops/TestSubOp1";
import { TestSubOp2 } from "./subops/TestSubOp2";
import { TestSubOpNoUndo } from "./subops/TestSubOpNoUndo";
import { Operations } from "../../../src/index";
export class TestOperations1 extends Operations<any> {

    constructor() {
        super("Test Operations 1", true);
        this.defineOperations();
    }

    protected defineOperations(): void {
        this.addNextOperation(new TestSubOp1());
        this.addNextOperation(new TestSubOp2());
        this.addNextOperation(new TestSubOpNoUndo());
    }
}
