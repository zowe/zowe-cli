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

import { IHandlerParameters, ConnectionPropsForSessCfg } from "@zowe/imperative";
import { mockHandlerParameters } from "@zowe/cli-test-utils";
import { join, normalize } from "path";
import { Shell } from "../../src/Shell";
import { SshBaseHandler } from "../../src/SshBaseHandler";
import { SshSession } from "../../src/SshSession";
import { ZosUssMessages } from "../../src/constants/ZosUss.messages";
import * as fs from "fs";

process.env.FORCE_COLOR = "0";

const UNIT_TEST_SSH_PROF_OPTS = {
    host: "somewhere.com",
    port: "22",
    user: "someone",
    password: "somesecret"
};

const UNIT_TEST_SSH_PROF_OPTS_PRIVATE_KEY = {
    host: "somewhere.com",
    port: "22",
    user: "someone",
    privateKey: normalize(join(__dirname, "..", "..", "..", "..", "..", "..", "zosuss", "__tests__", "__unit__", "__resources__", "fake_id_rsa"))
};
const UNIT_TEST_SSH_PROF_OPTS_PRIVATE_KEY_WITH_PASSPHRASE = {
    host: "somewhere.com",
    port: "22",
    user: "someone",
    privateKey: normalize(join(__dirname, "..", "..", "..", "..", "..", "..", "zosuss", "__tests__", "__unit__", "__resources__", "fake_id_rsa")),
    keyPassPhrase: "dummyPassPhrase123"
};
const UNIT_TEST_SSH_PROF_OPTS_PRIVATE_KEY_WITH_PASSPHRASE_NO_USER = {
    host: "somewhere.com",
    port: "22",
    privateKey: normalize(join(__dirname, "..", "..", "..", "..", "..", "..", "zosuss", "__tests__", "__unit__", "__resources__", "fake_id_rsa")),
    keyPassPhrase: "dummyPassPhrase123"
};

// Mocked parameters for the unit tests
const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_SSH_PROF_OPTS,
    positionals: ["zos-uss", "issue", "ssh"],
    definition: {} as any
});

const DEFAULT_PARAMETERS_PRIVATE_KEY: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_SSH_PROF_OPTS_PRIVATE_KEY,
    positionals: ["zos-uss", "issue", "ssh"],
    definition: {} as any
});

const DEFAULT_PARAMETERS_KEY_PASSPHRASE: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_SSH_PROF_OPTS_PRIVATE_KEY_WITH_PASSPHRASE,
    positionals: ["zos-uss", "issue", "ssh"],
    definition: {} as any
});
const DEFAULT_PARAMETERS_KEY_PASSPHRASE_NO_USER: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_SSH_PROF_OPTS_PRIVATE_KEY_WITH_PASSPHRASE_NO_USER,
    positionals: ["zos-uss", "issue", "ssh"],
    definition: {} as any
});

class myHandler extends SshBaseHandler {
    public async processCmd(commandParameters: IHandlerParameters): Promise<void> {
        return await Shell.executeSsh(
            this.mSession,
            commandParameters.arguments.command,
            (data: any) => commandParameters.response.console.log(Buffer.from(data))
        );
    }
}
const testOutput = "TEST OUTPUT";

describe("issue ssh handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to get stdout", async () => {
        Shell.executeSsh = jest.fn(async (session, command, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        const handler = new myHandler();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.command = "pwd";
        await handler.process(params);
        expect(Shell.executeSsh).toHaveBeenCalledTimes(1);
        expect(testOutput).toMatchSnapshot();
    });

    it("should be able to get stdout with private key and key passphrase", async () => {
        Shell.executeSsh = jest.fn(async (session, command, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        const handler = new myHandler();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS_KEY_PASSPHRASE]);
        params.arguments.command = "echo test";
        await handler.process(params);
        expect(Shell.executeSsh).toHaveBeenCalledTimes(1);
        expect(testOutput).toMatchSnapshot();
    });
    it("should prompt user for keyPassphrase if none is stored and privateKey requires one", async () => {
        Shell.executeSsh = jest.fn(async (session, command, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        jest.spyOn(fs,"readFileSync").mockReturnValue("dummyPrivateKey");
        const handler = new myHandler();
        jest.spyOn(handler,"processCmd").mockImplementationOnce(() => {throw new Error("but no passphrase given");});
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS_KEY_PASSPHRASE]);
        params.arguments.command = "echo test";
        jest.spyOn(ConnectionPropsForSessCfg as any,"getValuesBack").mockReturnValue(() => ({
            keyPassphrase: "validPassword"
        }));
        await handler.process(params);
        expect(Shell.executeSsh).toHaveBeenCalledTimes(1);
        expect(testOutput).toMatchSnapshot();
    });
    it("should reprompt user for keyPassphrase up to 3 times if stored passphrase failed", async () => {
        Shell.executeSsh = jest.fn(async (session, command, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        jest.spyOn(fs,"readFileSync").mockReturnValue("dummyPrivateKey");
        const handler = new myHandler();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS_KEY_PASSPHRASE]);
        params.arguments.command = "echo test";
        jest.spyOn(handler,"processCmd").mockImplementationOnce(() => {throw new Error("bad passphrase?");});
        jest.spyOn(ConnectionPropsForSessCfg as any,"getValuesBack").mockReturnValue(() => ({
            keyPassphrase: "validPassword"
        }));
        await handler.process(params);
        expect(Shell.executeSsh).toHaveBeenCalledTimes(1);
        expect(testOutput).toMatchSnapshot();
    });
    it("should fail if user fails to enter incorrect key passphrase in 3 attempts", async () => {
        const testOutput = "Maximum retry attempts reached. Authentication failed.";
        Shell.executeSsh = jest.fn(async (session, command, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        const handler = new myHandler();
        const params = { ...DEFAULT_PARAMETERS_KEY_PASSPHRASE };
        params.arguments.command = "echo test";
        jest.spyOn(handler, "processCmd").mockImplementation(() => {
            throw new Error("bad passphrase?");
        });
        await expect(handler.process(params)).rejects.toThrow("Maximum retry attempts reached. Authentication failed.");
        expect(handler.processCmd).toHaveBeenCalledTimes(4);
        expect(testOutput).toMatchSnapshot();
    });
    it("should prompt for user and keyPassphrase if neither is stored", async () => {
        const testOutput = "test";
        Shell.executeSsh = jest.fn(async (session, command, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        const handler = new myHandler();
        const params = { ...DEFAULT_PARAMETERS_KEY_PASSPHRASE_NO_USER };
        params.arguments.command = "echo test";
        jest.spyOn(ConnectionPropsForSessCfg as any,"getValuesBack").mockReturnValue(() => ({
            user: "someone",
            keyPassphrase: "validPassword"
        }));
        await handler.process(params);
        expect(Shell.executeSsh).toHaveBeenCalledTimes(1);
        expect(testOutput).toMatchSnapshot();
    });
    it("should be able to get stdout with privateKey", async () => {
        Shell.executeSsh = jest.fn(async (session, command, stdoutHandler) => {
            stdoutHandler(testOutput);
        });
        const handler = new myHandler();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS_PRIVATE_KEY]);
        params.arguments.command = "pwd";
        await handler.process(params);
        expect(Shell.executeSsh).toHaveBeenCalledTimes(1);
        expect(testOutput).toMatchSnapshot();
    });
});

describe("SshBaseHandler host key verification", () => {
    const originalCI = process.env.CI;
    const fakeKeyInfo = { fingerprint: "SHA256:testfingerprint", key: "presented-key-base64", changed: false };

    // Build a handler with persistHostKey stubbed so the config layer is not exercised here.
    function newHandler(persistImpl?: () => Promise<void>): SshBaseHandler {
        const handler = new class extends SshBaseHandler {
            public async processCmd(): Promise<void> { /* no-op */ }
        }();
        jest.spyOn(handler as any, "persistHostKey").mockImplementation(persistImpl ?? (async () => undefined));
        return handler;
    }

    function attach(handler: SshBaseHandler, session: SshSession, params: IHandlerParameters): void {
        (handler as any).mHandlerParams = params;
        (handler as any).attachHostKeyVerifier(session, params);
    }

    function newParams(promptAnswer?: string): IHandlerParameters {
        const params = mockHandlerParameters({
            arguments: { ...UNIT_TEST_SSH_PROF_OPTS },
            positionals: ["zos-uss", "issue", "ssh"],
            definition: {} as any
        });
        params.response.console.prompt = jest.fn(async () => promptAnswer ?? null) as any;
        return params;
    }

    beforeEach(() => {
        delete process.env.CI;
        jest.restoreAllMocks();
    });

    afterEach(() => {
        if (originalCI === undefined) { delete process.env.CI; } else { process.env.CI = originalCI; }
        jest.restoreAllMocks();
    });

    it("should not set a verifier and should warn when --insecure is specified", () => {
        const handler = newHandler();
        const params = newParams();
        const session = new SshSession({ hostname: "somewhere.com", insecure: true });
        attach(handler, session, params);
        expect(session.hostKeyVerifier).toBeUndefined();
        expect(params.response.console.error).toHaveBeenCalledWith(expect.stringContaining("verification is disabled"));
    });

    it("should trust a new key on first use and persist it (yes)", async () => {
        const handler = newHandler();
        const params = newParams("yes");
        const session = new SshSession({ hostname: "somewhere.com" });
        attach(handler, session, params);

        const trusted = await session.hostKeyVerifier(fakeKeyInfo);

        expect(trusted).toBe(true);
        expect(session.ISshSession.hostKey).toBe("presented-key-base64");
        expect((handler as any).persistHostKey).toHaveBeenCalledWith(params, "presented-key-base64");
    });

    it("should reject a new key when the user declines (no)", async () => {
        const handler = newHandler();
        const params = newParams("no");
        const session = new SshSession({ hostname: "somewhere.com" });
        attach(handler, session, params);

        const trusted = await session.hostKeyVerifier(fakeKeyInfo);

        expect(trusted).toBe(false);
        expect(session.ISshSession.hostKey).toBeUndefined();
        expect((handler as any).persistHostKey).not.toHaveBeenCalled();
    });

    it("should warn loudly and still allow trusting a changed key", async () => {
        const handler = newHandler();
        const params = newParams("yes");
        const session = new SshSession({ hostname: "somewhere.com", hostKey: "old-key" });
        attach(handler, session, params);

        const trusted = await session.hostKeyVerifier({ ...fakeKeyInfo, changed: true });

        expect(trusted).toBe(true);
        expect(params.response.console.error).toHaveBeenCalledWith(expect.stringContaining("HOST KEY HAS CHANGED"));
    });

    it("should not prompt in a CI environment and should reject with an error", async () => {
        process.env.CI = "true";
        const handler = newHandler();
        const params = newParams("yes"); // even if a prompt were attempted, it should not be used
        const session = new SshSession({ hostname: "somewhere.com" });
        attach(handler, session, params);

        const trusted = await session.hostKeyVerifier(fakeKeyInfo);

        expect(trusted).toBe(false);
        expect(params.response.console.prompt).not.toHaveBeenCalled();
        expect(params.response.console.error).toHaveBeenCalledWith(
            expect.stringContaining(ZosUssMessages.hostKeyVerificationFailed.message));
        expect((handler as any).persistHostKey).not.toHaveBeenCalled();
    });

    it("should still trust the key even if persistence fails", async () => {
        const handler = newHandler(async () => { throw new Error("cannot save"); });
        const params = newParams("yes");
        const session = new SshSession({ hostname: "somewhere.com" });
        attach(handler, session, params);

        const trusted = await session.hostKeyVerifier(fakeKeyInfo);

        expect(trusted).toBe(true);
        expect(params.response.console.error).toHaveBeenCalledWith(expect.stringContaining("Could not save"));
    });
});
