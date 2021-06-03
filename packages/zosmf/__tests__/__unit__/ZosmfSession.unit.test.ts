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

import { ZosmfSession } from "../../src/ZosmfSession";
import { ConnectionPropsForSessCfg, Session, ISession, ICommandArguments } from "@zowe/imperative";

describe("zosmf utils", () => {
    it("should create a session config from cmd args",  () => {
        const args: ICommandArguments = {
            $0: "zowe",
            _: [""],
            host: "fake",
            port: "fake",
            rejectUnauthorized: false,
            basePath: "fakeBasePath",
            tokenValue: "fake",
            tokenType: "fake"
        };
        const sessIntface: ISession = ZosmfSession.createSessCfgFromArgs(args);
        expect(sessIntface.basePath).toBe("fakeBasePath");
        expect(sessIntface.rejectUnauthorized).toBe(false);
        expect(sessIntface.protocol).toBe("https");
    });

    it("Should create a session object when tokenValue and tokenType are present", async () => {
        const args: ICommandArguments = {
            $0: "zowe",
            _: [""],
            host: "fakeHost",
            port: "fakePort",
            rejectUnauthorized: false,
            basePath: "fakeBasePath",
            tokenValue: "fakeTokenValue",
            tokenType: "fakeTokenType"
        };
        const sessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            ZosmfSession.createSessCfgFromArgs(args),
            args
        );
        const session: Session = new Session(sessCfg);

        expect(session.ISession.hostname).toBe("fakeHost");
        expect(session.ISession.port).toBe("fakePort");
        expect(session.ISession.rejectUnauthorized).toBe(false);
        expect(session.ISession.basePath).toBe("fakeBasePath");
        expect(session.ISession.tokenValue).toBe("fakeTokenValue");
        expect(session.ISession.tokenType).toBe("fakeTokenType");
        expect(session.ISession.protocol).toBe("https");
        expect(session.ISession.user).toBe(undefined);
        expect(session.ISession.password).toBe(undefined);
    });

    it("should fail to create a session when username, password, and token are not present", async () => {
        const args: ICommandArguments = {
            $0: "zowe",
            _: [""],
            host: "fakeHost",
            port: "fakePort",
            rejectUnauthorized: false,
            basePath: "fakeBasePath",
        };
        const sessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            ZosmfSession.createSessCfgFromArgs(args),
            args, {doPrompting: false}
        );

        let error;
        try {
            const session: Session = new Session(sessCfg);
        } catch (err) {
            error = err;
        }
        expect(error.toString()).toContain("Must have user & password OR base64 encoded credentials");
    });

    it("should fail to create a session when host is not present", async () => {
        const args: ICommandArguments = {
            $0: "zowe",
            _: [""],
            port: "fakePort",
            user: "fakeUser",
            password: "fakePassword",
            rejectUnauthorized: false,
            basePath: "fakeBasePath",
        };
        const sessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            ZosmfSession.createSessCfgFromArgs(args),
            args, {doPrompting: false}
        );

        let error;
        try {
            const session: Session = new Session(sessCfg);
        } catch (err) {
            error = err;
        }
        expect(error.toString()).toContain("Required parameter 'hostname' must be defined");
    });

    it("should fail to create a session when tokenValue and tokenType are undefined", async () => {
        const args: ICommandArguments = {
            $0: "zowe",
            _: [""],
            host: "fakeHost",
            port: "fakePort",
            rejectUnauthorized: false,
            basePath: undefined,
            tokenValue: undefined,
            tokenType: undefined
        };
        const sessCfg = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            ZosmfSession.createSessCfgFromArgs(args),
            args, {doPrompting: false}
        );

        let error;
        try {
            const session: Session = new Session(sessCfg);
        } catch (err) {
            error = err;
        }
        expect(error.toString()).toContain("Must have user & password OR base64 encoded credentials");
    });
});
