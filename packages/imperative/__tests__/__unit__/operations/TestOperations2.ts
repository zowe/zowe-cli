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

import { TestSubOp4 } from "./subops/TestSubOp4";
import { TestSubOp5 } from "./subops/TestSubOp5";
import { Operations } from "../../../../imperative/src/operations/index";

export class TestOperations2 extends Operations<any> {

    constructor() {
        super("Test Operations 2", true);
        this.defineOperations();
    }

    protected defineOperations(): void {
        this.addNextOperation(new TestSubOp4());
        this.addNextOperation(new TestSubOp5());
    }
}
