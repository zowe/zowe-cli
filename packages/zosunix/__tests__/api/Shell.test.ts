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

import { Shell } from "../../src/api/Shell";
import { SubmitJobs } from "../../../zosjobs/src/api/SubmitJobs";
import { Client } from "ssh2";
import { Session } from "@brightside/imperative";
import { EventEmitter } from "events";
jest.mock("ssh2");

const EXPECTED_LSTAT_CALLS: number = 3;
// Mock submitJclString
const mockedSubmitJclString = jest.fn((args) => {
    return [
        {
        },
        {
        },
        {
        },
        {
            data: "command output"
        }
    ];
});
const fakeSession: any = {};
// Mock Client.on
const mockedExecuteSsh = jest.fn((args) => {
    return "command output";
});

describe("Shell", () => {

    it("Should submit a job containing an UNIX command", async () => {
        (SubmitJobs.submitJclString as any) = mockedSubmitJclString;

        await Shell.executeCommand(fakeSession, "commandtest");
        expect(mockedSubmitJclString).toBeCalled();
        // Check the value of jcl pass to the mock function
        expect(mockedSubmitJclString.mock.calls[0][1]).toMatch("BPXBATCH");
        expect(mockedSubmitJclString.mock.calls[0][1]).toMatch("commandtest");
    });

    it("Should return UNIX command output", async () => {
        (SubmitJobs.submitJclString as any) = mockedSubmitJclString;

        const returnString = await Shell.executeCommand(fakeSession, "commandtest");
        expect(returnString).toBe("command output");
    });

    it("Should return UNIX command output with --cwd option", async () => {
        (SubmitJobs.submitJclString as any) = mockedSubmitJclString;
        const cwd = "/";
        const returnString = await Shell.executeCommandCwd(fakeSession, "commandtest", cwd);
        expect(returnString).toBe("command output");
    });

    it("Should execute ssh command", async () => {
        const fakeSshSession = new Session({
            type: "basic",
            hostname: "localhost",
            user: "",
            password: ""
        });
        const mockClient: any = new EventEmitter();
        const mockConnect = jest.fn().mockImplementation(() => {
            mockClient.emit("ready");
        });
        const mockStreamEnd = jest.fn();
        const mockStream = {
            end: mockStreamEnd,
            on: jest.fn()
        };
        const mockShell = jest.fn().mockImplementation( (callback) => {
            callback(null, mockStream);
        });

        (Client as any).mockImplementation(() => {
            mockClient.connect = mockConnect;
            mockClient.shell = mockShell;
            return mockClient;
        });

        const mockExecuteSshCallback = jest.fn();

        Shell.executeSsh(fakeSshSession, "commandtest", mockExecuteSshCallback);

        expect(mockConnect).toBeCalled();
        expect(mockShell).toBeCalled();
        // Check the stream.end() fucntion is called with an argument containing the SSH command
        expect(mockStreamEnd.mock.calls[0][0]).toMatch("commandtest");
        expect(mockExecuteSshCallback).toBeCalled();
    });
});
