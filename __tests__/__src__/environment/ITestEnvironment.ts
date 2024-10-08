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

import { ITestEnvironment as IBaseTestEnvironment } from "../../__packages__/cli-test-utils/src/environment/doc/response/ITestEnvironment";
import { ITestEnvironmentResources } from "./ITestEnvironmentResources";

/**
 * The test environment for your test.
 * @export
 * @interface ITestEnvironment
 */
export interface ITestEnvironment<TestPropertiesSchema> extends IBaseTestEnvironment<TestPropertiesSchema>{
    /**
     * A collection of resources used within the test environment that need to be cleaned up once test finishes.
     * @type {ITestEnvironmentResources}
     * @memberof ITestEnvironment
     */
    resources?: ITestEnvironmentResources;
}