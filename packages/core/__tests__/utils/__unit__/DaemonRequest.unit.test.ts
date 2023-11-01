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

import { DaemonRequest } from "../src/DaemonRequest";
import { IDaemonRequest } from "../src/doc/IDaemonRequest";

describe("DaemonRequest tests", () => {
    it("should add stdout to JSON request", () => {
        const stdout = "stdout message";
        const request = DaemonRequest.create({stdout});
        const requestJson: IDaemonRequest = JSON.parse(request.substring(0, request.length - 1));
        expect(requestJson.stdout).toBe(stdout);
    });

    it("should add stderr to JSON request", () => {
        const stderr = "stderr message";
        const request = DaemonRequest.create({stderr});
        const requestJson: IDaemonRequest = JSON.parse(request.substring(0, request.length - 1));
        expect(requestJson.stderr).toBe(stderr);
    });

    it("should transform stdout buffer to string data type for request", () => {
        const stdout: unknown = Buffer.from("stdout message buffer");
        const request = DaemonRequest.create({stdout: stdout as string});
        const requestJson: IDaemonRequest = JSON.parse(request.substring(0, request.length - 1));
        expect(requestJson.stdout).toBe(stdout.toString());
    });

    it("should transform stderr buffer to string data type for request", () => {
        const stderr: unknown = Buffer.from("stderr message buffer");
        const request = DaemonRequest.create({stderr: stderr as string});
        const requestJson: IDaemonRequest = JSON.parse(request.substring(0, request.length - 1));
        expect(requestJson.stderr).toBe(stderr.toString());
    });
});
