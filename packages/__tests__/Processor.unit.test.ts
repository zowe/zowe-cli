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

jest.mock("net");
import * as net from "net";
import Mock = jest.Mock;
import { Imperative } from "@zowe/imperative";
import { Processor } from "../Processor";
import { DaemonClient } from "../DaemonClient";
jest.mock("../DaemonClient");

describe("Processor tests", () => {

    it("should call normal parse method if no daemon keyword", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const on = jest.fn((event, func) => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toBe(undefined);
            expect(context).toBe(undefined);
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log
                }
            },
            parse
        }
        const fn = net.createServer as Mock<typeof net.createServer>;
        fn.mockImplementation((unusedclient, ...args: any[]) => {
            return {on}
        });

        const processor = new Processor(["--help"]);
        processor.init();
        expect(on).not.toHaveBeenCalled();
        processor.process();
        expect(parse).toHaveBeenCalled();
    });

    it("should start the server when daemon parm is passed", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const on = jest.fn((event, func) => {
            // do nothing
        });

        const listen = jest.fn((port, method) => {
            // do nothing
            method();
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toMatchSnapshot();
            expect(context).toMatchSnapshot();
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log,
                    error: log
                }
            },
            console: {
                info: log
            },
            parse
        }
        const fn = net.createServer as Mock<typeof net.createServer>;
        fn.mockImplementation((method, ...args: any[]) => {
            method("fakeClient", "fakeServer");
            return {on, listen}
        });

        const processor = new Processor(["some/file/path", "zowe", "--daemon"]);
        processor.init();
        expect(on).toHaveBeenCalledTimes(2);
        processor.process();
        expect(parse).not.toHaveBeenCalled();
        (processor as any).close();
        expect(log).toHaveBeenLastCalledWith("server closed");
        let err;
        try {
            (processor as any).error(new Error("data"));
        } catch (thrownError) {
            err = thrownError;
        }
        expect(err.message).toBe("data");
    });

    it("should set port based on env variable", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    debug: log
                }
            }
        }

        const processor = new Processor(["anything"]);

        const testPort = "1234";

        (processor as any).mParms = ["one", "two", "--daemon"];
        process.env.ZOWE_DAEMON = testPort;
        (processor as any).initialParse();
        expect((processor as any).mPort).toBe(parseInt(testPort, 10));

    });
});
