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

import { URL } from "url";
import { Session } from "../../../../src/rest/session/Session";

describe("Session tests", () => {

    it("should store cookie token requested", () => {
        const cookie: object = ["LtpaToken2=7KM/bf1sE4+4pE5mKgf+slWo9JO6laQF6OOi/POW0C+hRwscFOFjUijI2eWZrMY+jL4F9" +
        "nl1ubUvcK0hPgWmKH4xCOf1EoNafu40XaiLoO8wZnCo/rHmP2/h7MzSJV1te8dP4VM6NFdQCruuxtcgddTiDXU8gYZERFTnvtYhUu" +
        "vk1Nne8xwo++sDAmEFVwvJbyg6Z0zT1RAGPIXd6hx8YPNXydAifoQhqI9CaoyZNptByyx2H7uJ0vt0HTNqrdgZclOQkDNMm65ETpdo" +
        "1u4U7Vd6HPoshHJEQo7p40T9jJfgv7PJ6Bxhp1dAqF5zEkqE; path=/; domain=ca23; Secure; HttpOnly; Expires=Tue, 19" +
        " Jan 2038 03:14:07 GMT;"];
        const session = new Session({hostname: "localhost", type: "token", tokenType: "LtpaToken2", user: "user", password: "password"});
        session.storeCookie(cookie);
        expect(session.ISession).toMatchSnapshot();
    });

    it("should store partial/dynamic cookie token requested", () => {
        const cookieNameBase = "LtpaToken";
        const cookieNameFull = cookieNameBase + "74133";
        const cookieValue = "7KM/bf1sE4+4pE5mKgf+slWo9JO6laQF6OOi/POW0C+hRwscFOFjUijI2eWZrMY+jL4F9" +
        "nl1ubUvcK0hPgWmKH4xCOf1EoNafu40XaiLoO8wZnCo/rHmP2/h7MzSJV1te8dP4VM6NFdQCruuxtcgddTiDXU8gYZERFTnvtYhUu" +
        "vk1Nne8xwo++sDAmEFVwvJbyg6Z0zT1RAGPIXd6hx8YPNXydAifoQhqI9CaoyZNptByyx2H7uJ0vt0HTNqrdgZclOQkDNMm65ETpdo" +
        "1u4U7Vd6HPoshHJEQo7p40T9jJfgv7PJ6Bxhp1dAqF5zEkqE";
        const cookie: object = [cookieNameFull + "=" + cookieValue +
        "; path=/; domain=ca23; Secure; HttpOnly; Expires=Tue, 19 Jan 2038 03:14:07 GMT;"];
        const session = new Session({hostname: "localhost", type: "token", tokenType: cookieNameBase, user: "user", password: "password"});
        session.storeCookie(cookie);
        expect(session.ISession.tokenType).toBe(cookieNameFull);
        expect(session.ISession.tokenValue).toBe(cookieValue);
    });

    it("should initialize with basic type and required input data", () => {
        const session = new Session({hostname: "localhost", type: "basic", user: "ibmuser", password: "mypass"});
        expect(session.ISession).toMatchSnapshot();
    });

    it("should get user and password from an auth string", () => {
        const user = "myname";
        const password = "mypass";
        const auth = Session.getBase64Auth(user, password);
        expect(auth).toMatchSnapshot();
        expect(Session.getUsernameFromAuth(auth)).toBe(user);
        expect(Session.getPasswordFromAuth(auth)).toBe(password);
    });

    it("should require user for 'basic' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "basic"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow tokenType for 'basic' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "basic", user: "hey", password: "there", tokenType: "LtpaToken2"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow tokenValue for 'basic' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "basic", user: "hey", password: "there", tokenValue: "secretToken"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow cert for 'basic' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "basic", user: "hey", password: "there", cert: "/fake/cert"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow certKey for 'basic' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "basic", user: "hey", password: "there", certKey: "/fake/cert"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should require password for 'basic' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "basic", user: "somebody"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should require password for 'tokenType' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "token", user: "somebody", password: "secret"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not require user and password for 'token' type", () => {
        const session = new Session({hostname: "localhost", type: "token", tokenType: "LtpaToken2", tokenValue: "blahblahblah"});
        expect(session.ISession).toMatchSnapshot();
    });

    it("should not allow tokenType for 'bearer' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "bearer",
                tokenValue: "blahblahblah", user: "user", password: "pass", tokenType: "LtpaToken2"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow user for 'bearer' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "bearer", tokenValue: "blahblahblah", user: "user", password: "pass"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow password for 'bearer' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "bearer", tokenValue: "blahblahblah", password: "pass"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow cert for 'bearer' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "bearer", tokenValue: "blahblahblah", cert: "/fake/cert"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow certKey for 'bearer' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "bearer", tokenValue: "blahblahblah", certKey: "/fake/cert/key"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should require token for 'bearer' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "bearer"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not require user and password for 'bearer' type", () => {
        const session = new Session({hostname: "localhost", type: "bearer", tokenValue: "blahblahblah"});
        expect(session.ISession).toMatchSnapshot();
    });

    it("should require cert for 'cert-pem' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "cert-pem"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should require certKey for 'cert-pem' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "cert-pem", cert: "/fake/cert"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should allow tokenType for 'cert-pem' type for auth login", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "cert-pem",
                cert: "/fake/cert", certKey: "/fake/cert/key", tokenType: "LtpaToken2"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error).toBeUndefined();
    });

    it("should not allow tokenValue for 'cert-pem' type for auth login", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "cert-pem",
                cert: "/fake/cert", certKey: "/fake/cert/key", tokenType: "LtpaToken2",
                tokenValue: "FakeTokenValue"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow user for 'cert-pem' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "cert-pem", cert: "/fake/cert", certKey: "/fake/cert/key", user: "user"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not allow password for 'cert-pem' type", () => {
        let error;
        try {
            const session = new Session({hostname: "localhost", type: "cert-pem", cert: "/fake/cert", certKey: "/fake/cert/key", password: "pass"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should not fail to initialize with minimum data", () => {
        const session = new Session({hostname: "localhost"});
        expect(session.ISession).toMatchSnapshot();
    });

    it("should match non-default port, protocol, secure protocol, and host", () => {
        const session = new Session({hostname: "localhost", port: 123, protocol: "http", secureProtocol: "somethingNew"});
        expect(session.ISession).toMatchSnapshot();
    });

    it("should match other non-default values", () => {
        const session = new Session({hostname: "localhost", rejectUnauthorized: false, strictSSL: false, checkServerIdentity: () => undefined});
        expect(session.ISession).toMatchSnapshot();
    });

    it("should require proper type", () => {
        let error;
        try {
            // @ts-expect-error testing wrong argument type
            const session = new Session({hostname: "localhost", type: "madeThisUp"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should require proper protocol", () => {
        let error;
        try {
            // @ts-expect-error testing wrong argument type
            const session = new Session({hostname: "localhost", protocol: "ftp"});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    it("should fail to initialize without minimum data", () => {
        let error;
        try {
            const session = new Session({});
        } catch (thrownError) {
            error = thrownError;
        }
        expect(error.message).toMatchSnapshot();
    });

    describe("should create from URL", () => {
        it("builds an HTTP session", () => {
            const url = new URL("http://example.com");
            const session = Session.createFromUrl(url);
            expect(session.ISession).toMatchObject({
                hostname: "example.com",
                protocol: "http"
            });
        });

        it("builds an HTTPS session", () => {
            const url = new URL("https://example.com");
            const session = Session.createFromUrl(url);
            expect(session.ISession).toMatchObject({
                hostname: "example.com",
                protocol: "https"
            });
        });

        it("builds a session with port", () => {
            const url = new URL("http://example.com:1337");
            const session = Session.createFromUrl(url);
            expect(session.ISession).toMatchObject({
                hostname: "example.com",
                protocol: "http",
                port: 1337
            });
        });

        it("builds a session with base path when includePath is true", () => {
            const url = new URL("http://example.com/index.php");
            const session = Session.createFromUrl(url);
            expect(session.ISession).toMatchObject({
                hostname: "example.com",
                protocol: "http",
                basePath: "/index.php"
            });
        });

        it("builds a session without base path when includePath is false", () => {
            const url = new URL("http://example.com/index.php");
            const session = Session.createFromUrl(url, false);
            expect(session.ISession).toMatchObject({
                hostname: "example.com",
                protocol: "http"
            });
            expect(session.ISession.basePath).toBe("");
        });

        it("builds a session with basic authentication", () => {
            const url = new URL("http://user:pass@example.com");
            const session = Session.createFromUrl(url);
            expect(session.ISession).toMatchObject({
                hostname: "example.com",
                protocol: "http",
                user: "user",
                password: "pass",
                type: "basic"
            });
        });
    });
});
