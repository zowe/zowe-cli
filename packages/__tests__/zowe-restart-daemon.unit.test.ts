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

jest.mock("child_process")
import Mock = jest.Mock;

import { resolve } from "path";
import { execSync } from "child_process";

it ("should call the restart file and get a response", () => {

    const fn = execSync as Mock<typeof execSync>;
    fn.mockImplementation((...args: any[]) => {
        return Buffer.from("restarted");
    });

    const resp = require(resolve(__dirname, '../../packages/zowe-restart-daemon'));
    expect(resp).toMatchSnapshot();
});
