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

// using __mocks__/fs.ts
jest.mock("fs");
const fs = require("fs");

jest.mock("net");
jest.mock("@zowe/imperative");
import * as net from "net";
import * as os from "os";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Imperative, IO } from "@zowe/imperative";  // eslint-disable-line unused-imports/no-unused-imports
import { DaemonDecider } from "../../../src/daemon/DaemonDecider";

jest.mock("../../../src/daemon/DaemonClient");

describe("DaemonDecider tests", () => {
    let log: jest.Mock;
    let on: jest.Mock;
    let listen: jest.Mock;
    let parse: jest.Mock;
    let createServerMock: jest.Mock;

    beforeEach(() => {
        log = jest.fn();
        on = jest.fn();
        listen = jest.fn();
        parse = jest.fn((data, context) => {
            expect(data).toBe(undefined);
            expect(context).toBe(undefined);
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
        };

        createServerMock = jest.mocked(net.createServer);
        createServerMock.mockImplementation(() => {
            return { on, listen };
        });
    });

    afterEach(() => {
        delete process.env.ZOWE_DAEMON_DIR;
        delete process.env.ZOWE_DAEMON_PIPE;
        jest.resetAllMocks();
    });

    it("should call normal parse method if no daemon keyword", () => {
        const daemonDecider = new DaemonDecider(["--help"]);
        daemonDecider.init();
        expect(on).not.toHaveBeenCalled();
        daemonDecider.runOrUseDaemon();
        expect(parse).toHaveBeenCalled();
    });

    it("should start the server when daemon parm is passed", () => {
        listen.mockImplementation((socket, method) => {
            method();
        });

        parse.mockImplementation((data, context) => {
            expect(data).toMatchSnapshot();
            expect(context).toMatchSnapshot();
        });

        createServerMock.mockImplementation((method: any) => {
            method("fakeClient", "fakeServer");
            return { on, listen };
        });

        const daemonDecider = new DaemonDecider(["some/file/path", "zowe", "--daemon"]);
        daemonDecider.init();
        expect(on).toHaveBeenCalledTimes(2);
        daemonDecider.runOrUseDaemon();
        expect(parse).not.toHaveBeenCalled();
        (daemonDecider as any).close();
        expect(log).toHaveBeenLastCalledWith("server closed");
        let err;
        try {
            (daemonDecider as any).error(new Error("data"));
        } catch (thrownError) {
            err = thrownError;
        }
        expect(err.message).toBe("data");
    });

    it("should set comm channel based on env variable", () => {
        const daemonDecider = new DaemonDecider(["anything"]);

        const envWinPipeName = "MyWinPipeName";
        const envDaemonDir = path.normalize("./testOutput/daemonDir");
        let expectedCommChannel: string;

        if (process.platform === "win32") {
            process.env.ZOWE_DAEMON_PIPE = envWinPipeName;
            expectedCommChannel = "\\\\.\\pipe\\" + envWinPipeName;
        } else {
            process.env.ZOWE_DAEMON_DIR = envDaemonDir;
            expectedCommChannel = envDaemonDir + "/daemon.sock";
        }

        (daemonDecider as any).mParms = ["one", "two", "--daemon"];
        (daemonDecider as any).initialParse();
        expect((daemonDecider as any).mSocket).toBe(expectedCommChannel);
    });

    it("should not start a daemon", () => {
        const daemonDecider = new DaemonDecider(["node", "zowe", "--help"]);
        daemonDecider.init();

        expect((daemonDecider as any).mSocket).toBeUndefined();
        expect((daemonDecider as any).startServer).toBeUndefined();
    });

    it("should use the default comm channel location", () => {
        const daemonDecider = new DaemonDecider(["node", "zowe", "--daemon"]);
        daemonDecider.init();

        let expectedCommChannel: string;
        if (process.platform === "win32") {
            expectedCommChannel = `\\\\.\\pipe\\${os.userInfo().username.toLocaleLowerCase()}\\ZoweDaemon`;
        } else {
            expectedCommChannel = path.join(os.homedir(), ".zowe/daemon/daemon.sock");
        }

        expect((daemonDecider as any).mSocket).toEqual(expectedCommChannel);
    });

    it("should try to delete an existing socket on Posix", () => {
        process.env.ZOWE_DAEMON_DIR = path.normalize("./testOutput/daemonDir");
        const daemonDecider = new DaemonDecider(["node", "zowe", "--daemon"]);

        // setup data for __mocks__/fs.ts
        const pathToDaemonDir = "./path/to/daemonDir";
        const contents = "Contents for a directory is just used to confirm existence";
        const MOCK_FILE_INFO = {
            [pathToDaemonDir]: contents
        };
        fs.__setMockFiles(MOCK_FILE_INFO);
        const writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");

        const existsSyncSpy = jest.spyOn(IO, "existsSync");
        const deleteSyncSpy = jest.spyOn(IO, "deleteFile").mockImplementation(() => {return;});

        daemonDecider.init();

        // fool our function into thinking we are linux
        const realPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
            value: 'Linux'
        });

        // fool our function into thinking that a socket file exists
        existsSyncSpy.mockImplementation(() => {return true;});

        // call our function that will try to delete the socket file
        daemonDecider.runOrUseDaemon();

        // restore our real platform
        Object.defineProperty(process, 'platform', {
            value: realPlatform
        });

        let existTimes;
        if (process.platform === "win32") {
            existTimes = 2;
        } else {
            existTimes = 3;
        }

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(existsSyncSpy).toHaveBeenCalledTimes(existTimes);
        expect(deleteSyncSpy).toHaveBeenCalledTimes(1);
        writeFileSyncSpy.mockClear();
    });

    it("should restrict access to the pid file and socket to the owner on Posix", () => {
        // invoke the listen callback so the socket-restriction logic runs
        listen.mockImplementation((_socket, method) => {
            method();
        });

        parse.mockImplementation(() => {});

        createServerMock.mockImplementation((method: any) => {
            method("fakeClient", "fakeServer");
            return { on, listen };
        });

        const daemonDir = path.normalize("./testOutput/daemonDir");
        process.env.ZOWE_DAEMON_DIR = daemonDir;

        // fool our function into thinking we are on a Posix system
        const realPlatform = process.platform;
        Object.defineProperty(process, "platform", { value: "linux" });

        const giveAccessSpy = jest.spyOn(IO, "giveAccessOnlyToOwner").mockImplementation(() => {
            return;
        });
        jest.spyOn(IO, "existsSync").mockReturnValue(false);

        const daemonDecider = new DaemonDecider(["node", "zowe", "--daemon"]);
        daemonDecider.init();
        daemonDecider.runOrUseDaemon();

        // restore our real platform
        Object.defineProperty(process, "platform", { value: realPlatform });

        const restrictedPaths = giveAccessSpy.mock.calls.map((call) => call[0]);
        expect(restrictedPaths).toContain(path.join(daemonDir, "daemon_pid.json"));
        expect(restrictedPaths).toContain(path.join(daemonDir, "daemon.sock"));
    });

    it("should write a random token into the pid file and pass it to each client", () => {
        process.env.ZOWE_DAEMON_DIR = path.normalize("./testOutput/daemonDir");

        let capturedClientToken: string;
        const DaemonClientMock = require("../../../src/daemon/DaemonClient").DaemonClient;
        DaemonClientMock.mockImplementation((_client: any, _server: any, _owner: string, token: string) => {
            capturedClientToken = token;
            return { run: jest.fn() };
        });

        // capture the contents written to the pid file
        let pidFileContents = "";
        const writeFileSyncSpy = jest.spyOn(fs, "writeFileSync").mockImplementation((_path: any, contents: any) => {
            pidFileContents = contents;
        });
        jest.spyOn(IO, "giveAccessOnlyToOwner").mockImplementation(() => { return; });

        // invoke the createServer callback so a DaemonClient is constructed
        createServerMock.mockImplementation((method: any) => {
            method("fakeClient", "fakeServer");
            return { on, listen };
        });

        const daemonDecider = new DaemonDecider(["some/file/path", "zowe", "--daemon"]);
        daemonDecider.init();

        const writtenPid = JSON.parse(pidFileContents);
        // the token must exist, be a 64-char hex string (32 random bytes), and
        // match the token handed to the DaemonClient
        expect(writtenPid.token).toMatch(/^[0-9a-f]{64}$/);
        expect(capturedClientToken).toBe(writtenPid.token);

        writeFileSyncSpy.mockRestore();
    });

    it("should generate a different token on each daemon start", () => {
        process.env.ZOWE_DAEMON_DIR = path.normalize("./testOutput/daemonDir");

        const tokens: string[] = [];
        jest.spyOn(fs, "writeFileSync").mockImplementation((_path: any, contents: any) => {
            tokens.push(JSON.parse(contents).token);
        });
        jest.spyOn(IO, "giveAccessOnlyToOwner").mockImplementation(() => { return; });

        new DaemonDecider(["some/file/path", "zowe", "--daemon"]).init();
        new DaemonDecider(["some/file/path", "zowe", "--daemon"]).init();

        expect(tokens).toHaveLength(2);
        expect(tokens[0]).not.toBe(tokens[1]);
    });

    it("should throw an error when it cannot write the process ID file", () => {
        process.env.ZOWE_DAEMON_DIR = path.normalize("./testOutput/daemonDir");
        const daemonDecider = new DaemonDecider(["node", "zowe", "--daemon"]);

        // make the write function fail
        const badStuffMsg = "Some bad stuff happened";
        const writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        writeFileSyncSpy.mockImplementation(() => {
            throw new Error(badStuffMsg);
        });

        let error: Error;
        try {
            // call the function that will try to write the process ID file
            daemonDecider.init();
        } catch (e) {
            error = e;
        }

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error.message).toContain("Failed to write file");
        expect(error.message).toContain("daemon_pid.json");
        expect(error.message).toContain(badStuffMsg);
        writeFileSyncSpy.mockClear();
    });

    it("should throw an error when it cannot restrict access to the process ID file", () => {
        process.env.ZOWE_DAEMON_DIR = path.normalize("./testOutput/daemonDir");
        const daemonDecider = new DaemonDecider(["node", "zowe", "--daemon"]);

        const writeFileSyncSpy = jest.spyOn(fs, "writeFileSync").mockImplementation(() => { return; });
        writeFileSyncSpy.mockClear();

        const badStuffMsg = "Some bad stuff happened";
        const giveAccessSpy = jest.spyOn(IO, "giveAccessOnlyToOwner");
        giveAccessSpy.mockImplementation((filePath: string) => {
            if (filePath.endsWith("daemon_pid.json")) {
                throw new Error(badStuffMsg);
            }
        });

        let error: Error;
        try {
            daemonDecider.init();
        } catch (e) {
            error = e;
        }

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(giveAccessSpy).toHaveBeenCalled();
        expect(error).toBeDefined();
        expect(error.message).toContain("Failed to write file");
        expect(error.message).toContain("daemon_pid.json");
        expect(error.message).toContain(badStuffMsg);
        writeFileSyncSpy.mockRestore();
        giveAccessSpy.mockRestore();
    });

    it("should log an error when it cannot restrict access to the socket on Posix", () => {
        let errorLogMsg = "";
        const errorLog = jest.fn((msg) => {
            errorLogMsg += msg;
        });
        (Imperative as any).api.appLogger.error = errorLog;

        // invoke the listen callback so the socket-restriction logic runs
        listen.mockImplementation((_socket, method) => {
            method();
        });

        parse.mockImplementation(() => {});

        createServerMock.mockImplementation((method: any) => {
            method("fakeClient", "fakeServer");
            return { on, listen };
        });

        const daemonDir = path.normalize("./testOutput/daemonDir");
        process.env.ZOWE_DAEMON_DIR = daemonDir;

        // fool our function into thinking we are on a Posix system
        const realPlatform = process.platform;
        Object.defineProperty(process, "platform", { value: "linux" });

        const badStuffMsg = "Some bad stuff happened";
        const giveAccessSpy = jest.spyOn(IO, "giveAccessOnlyToOwner").mockImplementation((filePath) => {
            if (filePath.endsWith("daemon.sock")) {
                throw new Error(badStuffMsg);
            }
            return;
        });
        jest.spyOn(IO, "existsSync").mockReturnValue(false);

        const daemonDecider = new DaemonDecider(["node", "zowe", "--daemon"]);
        daemonDecider.init();
        daemonDecider.runOrUseDaemon();

        // restore our real platform
        Object.defineProperty(process, "platform", { value: realPlatform });

        expect(errorLog).toHaveBeenCalled();
        expect(errorLogMsg).toContain("Unable to restrict access to daemon socket");
        expect(errorLogMsg).toContain(badStuffMsg);
        giveAccessSpy.mockRestore();
    });

    it("should form the path to a pipe on windows", () => {
        let recordedLogMsg = "";
        log.mockImplementation((logMsg) => {
            if (logMsg) recordedLogMsg += logMsg;
        });

        process.env.ZOWE_DAEMON_DIR = path.normalize("./testOutput/daemonDir");
        const daemonDecider = new DaemonDecider(["node", "zowe", "--daemon"]);
        const initialParseSpy = jest.spyOn(DaemonDecider.prototype as any, "initialParse");

        // fool our function into thinking we are windows
        const realPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
            value: 'win32'
        });

        // call the function that will indirectly form the default pipe name
        daemonDecider.init();

        expect(initialParseSpy).toHaveBeenCalledTimes(1);
        expect(recordedLogMsg).toContain(`daemon server will listen on \\\\.\\pipe\\${os.userInfo().username.toLocaleLowerCase()}\\ZoweDaemon`);

        // use a custom pipe name
        const envWinPipeName = "MyWinPipeName";
        process.env.ZOWE_DAEMON_PIPE = envWinPipeName;
        recordedLogMsg = "";

        // call init again to form the pipe name again
        daemonDecider.init();

        expect(initialParseSpy).toHaveBeenCalledTimes(2);
        expect(recordedLogMsg).toContain("daemon server will listen on \\\\.\\pipe\\" + envWinPipeName);

        // restore our real platform
        Object.defineProperty(process, 'platform', {
            value: realPlatform
        });
    });
});
