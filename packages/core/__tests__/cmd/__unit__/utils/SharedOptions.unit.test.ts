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

// jest.mock("process");
import { Socket } from "net";
import { CommandResponse, SharedOptions, Constants, ImperativeError } from "../../../../src";


jest.mock("../../../../src/cmd/response/CommandResponse");

const intervalNum = 1000;
describe("Shared Options", () => {

    it("should not perform any reads if the arguments do not indicate to read from stdin", async () => {
        const response = new CommandResponse({silent: true});
        const args: any = {_: undefined, $0: undefined};
        await SharedOptions.readStdinIfRequested(args, response, "command");
        expect(args[Constants.STDIN_CONTENT_KEY]).toBeUndefined();
    });

    it("should be able to return stdin as part of the arguments", async () => {
        const response = new CommandResponse({silent: true});
        const stream: any = new Socket();
        const interval = setInterval(() => {
            stream.emit("data", Buffer.from("tasty"));
            stream.emit("end");
        }, intervalNum);
        const args: any = {_: undefined, $0: undefined, stdin: true};
        await SharedOptions.readStdinIfRequested(args, response, "command", stream);
        clearInterval(interval);
        stream.removeAllListeners("on");
        stream.removeAllListeners("once");
        stream.removeAllListeners("end");
        stream.destroy();
        expect(args[Constants.STDIN_CONTENT_KEY]).toMatchSnapshot();
    });

    it("should not read stdin if the type is not command", async () => {
        const response = new CommandResponse({silent: true});
        const stream: any = new Socket();
        const args: any = {_: undefined, $0: undefined, stdin: true};
        const stdinWasRead = await SharedOptions.readStdinIfRequested(args, response, "group", stream);
        stream.removeAllListeners("on");
        stream.removeAllListeners("once");
        stream.removeAllListeners("end");
        stream.destroy();
        expect(stdinWasRead).toEqual(false);
    });

    it("should be able to handle a stdin read error", async () => {
        const response = new CommandResponse({silent: true});
        const stream: any = new Socket();
        const interval = setInterval(() => {
            stream.emit("error");
        }, intervalNum);
        let error;
        try {
            await SharedOptions.readStdinIfRequested({_: undefined, $0: undefined, stdin: true} as any, response, "command", stream);
        } catch (e) {
            error = e;
        }
        clearInterval(interval);
        stream.removeAllListeners("on");
        stream.removeAllListeners("once");
        stream.removeAllListeners("end");
        stream.destroy();
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
        expect(error.details).toMatchSnapshot();
    });
});
