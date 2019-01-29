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

import { isNullOrUndefined } from "util";
import { Imperative, ImperativeError, Session } from "@brightside/imperative";
import { TestProperties } from "../../../../../__tests__/__src__/properties/TestProperties";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestSystemSchema } from "../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { StartWorkflow } from "../../../../workflows";

const MAX_TIMEOUT_NUMBER: number = 3600000;
const SLEEP_TIME: number = 10000;

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;

let templateName: string;
let instanceName: string;

let REAL_SESSION: Session;

// any or ?
function expectZosmfResponseFailed(response: any, error: ImperativeError, msg: string) {
    expect(response).not.toBeDefined();
    expect(error).toBeDefined();
    expect(error.details.msg).toContain(msg);
}
