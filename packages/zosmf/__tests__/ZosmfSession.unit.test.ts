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

import { ZosmfSession } from "../src/api/ZosmfSession";
import { Session, ImperativeExpect, ICommandArguments } from "@zowe/imperative";

describe("zosmf utils", () => {
    it("should create a basic session object", () => {
        const session: Session = ZosmfSession.createBasicZosmfSession({
            host: "fake",
            port: "fake",
            user: "fake",
            password: "fake",
            auth: "fake",
            rejectUnauthorized: "fake"
        });
        expect(session.ISession).toMatchSnapshot();
    });
    it("Should create a session object when tokenValue and tokenType are present", () => {
        const args: ICommandArguments = {
            $0: "zowe",
            _: [""],
            host: "fake",
            port: "fake",
            rejectUnauthorized: false,
            basePath: "fake",
            tokenValue: "fake",
            tokenType: "fake"
        };
        const session: Session = ZosmfSession.createBasicZosmfSessionFromArguments(args);
        expect(session.ISession).toMatchSnapshot();
    });
    it("should fail to create a basic session object when username and password are not present", () => {
        let error;
        try {
            const session: Session = ZosmfSession.createBasicZosmfSession({
                host: "fake",
                port: "fake",
                rejectUnauthorized: "fake"
            });
        } catch (err) {
            error = err;
        }
        expect(error.toString()).toContain("Must have user & password OR base64 encoded credentials");
    });
    it("should fail to create a basic session object when host is not present", () => {
        let error;
        try {
            const session: Session = ZosmfSession.createBasicZosmfSession({
            port: "fake",
            user: "fake",
            password: "fake",
            auth: "fake",
            rejectUnauthorized: "fake"
            });
        } catch (err) {
            error = err;
        }
        expect(error.toString()).toContain("Required parameter 'hostname' must be defined");
    });
    it("should fail to create a session object when tokenValue and tokenType are undefined", () => {
        const args: ICommandArguments = {
            $0: "zowe",
            _: [""],
            host: "fake",
            port: "fake",
            rejectUnauthorized: false,
            basePath: undefined,
            tokenValue: undefined,
            tokenType: undefined
        };
        let error;
        try {
            const session: Session = ZosmfSession.createBasicZosmfSessionFromArguments(args);
        } catch (err) {
            error = err;
        }
        expect(error.toString()).toContain("Must have user & password OR base64 encoded credentials");
    });
});
