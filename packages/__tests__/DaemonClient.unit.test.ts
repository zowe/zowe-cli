import Mock = jest.Mock;
jest.mock("net")
jest.mock("@zowe/imperative")
import * as net from "net";
import { Imperative } from "@zowe/imperative";
import { DaemonClient } from "../DaemonClient";

describe("DaemonClient tests", () => {

    it("should process data when received", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toMatchSnapshot();
            expect(context).toMatchSnapshot();
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log
                }
            },
            commandLine: "n/a",
            parse
        }

        const fn = net.createServer as Mock<typeof net.createServer>;
        let server: net.Server;
        let client: net.Socket;
        (client as any) = {
            on: jest.fn()
        };
        fn.mockImplementation((unusedclient, ...args: any[]) => {
            //
        });

        const daemonClient = new DaemonClient(client, server);

        daemonClient.run();
        // force `data` call and verify input is from instantiation of DaemonClient
        // is what is passed to mocked Imperative.parse via snapshot
        (daemonClient as any).data("some data", {whatever: "context I want"});
    });

    it("should shutdown when keyword is specified", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toMatchSnapshot();
            expect(context).toMatchSnapshot();
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log
                }
            },
            commandLine: "n/a",
            parse
        }

        const fn = net.createServer as Mock<typeof net.createServer>;
        let server: net.Server;
        let client: net.Socket;
        const write = jest.fn((someWriteMessage) => {
            expect(someWriteMessage).toMatchSnapshot();
        });
        (client as any) = {
            on: jest.fn(),
            write,
            end: jest.fn()
        };
        (server as any) = {
            close: jest.fn()
        }
        fn.mockImplementation((unusedclient, ...args: any[]) => {
            //
        });

        const daemonClient = new DaemonClient(client, server);
        daemonClient.run();
        // force `data` call and verify write method is called with termination message
        (daemonClient as any).data(Buffer.from("--shutdown"), {whatever: "context I want"});
    });

    it("should call the end method", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        (Imperative as any).api = {
            appLogger: {
                trace: log
            }
        }

        const fn = net.createServer as Mock<typeof net.createServer>;
        let server: net.Server;
        let client: net.Socket;
        (client as any) = {
            on: jest.fn()
        };
        fn.mockImplementation((unusedclient, ...args: any[]) => {
            //
        });

        const daemonClient = new DaemonClient(client, server);
        daemonClient.run();
        (daemonClient as any).end();
        expect(log).toHaveBeenLastCalledWith('daemon client disconnected');
    });

    it("should call the close method", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        (Imperative as any).api = {
            appLogger: {
                trace: log
            }
        }

        const fn = net.createServer as Mock<typeof net.createServer>;
        let server: net.Server;
        let client: net.Socket;
        (client as any) = {
            on: jest.fn()
        };
        fn.mockImplementation((unusedclient, ...args: any[]) => {
            //
        });

        const daemonClient = new DaemonClient(client, server);
        daemonClient.run();
        (daemonClient as any).close();
        expect(log).toHaveBeenLastCalledWith('client closed');
    });

});
