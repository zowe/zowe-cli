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

import { ISession } from "./doc/ISession";
import { Logger } from "../../../logger";
import { ImperativeError } from "../../../error";
import { ImperativeExpect } from "../../../expect";
import * as SessConstants from "./SessConstants";

/**
 * The API session object, serves as the base for sessions and contains the fields that are required by
 * most API calls (hostname, port, credentials, etc).
 * @export
 * @abstract
 * @class AbstractSession
 */
export abstract class AbstractSession {

    /**
     * Basic auth prefix
     * @static
     * @type {string}
     * @memberof AbstractSession
     */
    public static readonly BASIC_PREFIX: string = "Basic ";

    /**
     * Bearer auth prefix
     * @static
     * @type {string}
     * @memberof AbstractSession
     */
    public static readonly BEARER_PREFIX: string = "Bearer ";

    /**
     * Default protocol
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_PROTOCOL = SessConstants.HTTPS_PROTOCOL;

    /**
     * Default session type
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_TYPE = SessConstants.AUTH_TYPE_NONE;

    /**
     * Default http port 80
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_HTTP_PORT = 80;

    /**
     * Default https port 443
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_HTTPS_PORT = 443;

    /**
     * Default https port
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_PORT = AbstractSession.DEFAULT_HTTPS_PORT;

    /**
     * Default base path.
     * Our empty string means that we do **not** use an API mediation layer
     * base path at the beginning of every resource URL.
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_BASE_PATH = "";

    /**
     * Default reject unauthorized
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_REJECT_UNAUTHORIZED_SETTING = true;

    /**
     * Default strict ssl setting
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_STRICT_SSL = true;

    /**
     * Default SSL method
     * @static
     * @memberof AbstractSession
     */
    public static readonly DEFAULT_SECURE_PROTOCOL = "SSLv23_method";
    // TODO: Investigate - this does not seem to do anything, and Node defaults to TLS_method w/ TLS 1.3 support

    /**
     * Regex to extract basic from base64 encoded auth
     * @static
     * @type {RegExp}
     * @memberof AbstractSession
     */
    public static readonly BASIC: RegExp = /^Basic/ig;

    /**
     * Obtain user name from a base 64 credential
     * @static
     * @param {string} auth - base 64 encoded credentials
     * @returns {string} - user name
     * @memberof AbstractSession
     */
    public static getUsernameFromAuth(auth: string): string {
        auth = auth.replace(AbstractSession.BASIC, "");
        const decoding = Buffer.from(auth, "base64").toString();
        return decoding.substring(0, decoding.lastIndexOf(":"));
    }

    /**
     * Obtain password from a base 64 credential
     * @static
     * @param {string} auth - base 64 encoded credentials
     * @returns {string} - password
     * @memberof AbstractSession
     */
    public static getPasswordFromAuth(auth: string): string {
        auth = auth.replace(AbstractSession.BASIC, "");
        const decoding = Buffer.from(auth, "base64").toString();
        return decoding.substring(decoding.lastIndexOf(":") + 1);
    }

    /**
     * Create base 64 encoded representation of user and password
     * @static
     * @param user - plain text user
     * @param password - plain text password
     * @returns {string} - base 64 encoded auth
     * @memberof AbstractSession
     */
    public static getBase64Auth(user: string, password: string) {
        return Buffer.from(user + ":" + password).toString("base64");
    }

    /**
     * Logging object
     */
    private mLog: Logger;

    /**
     * Creates an instance of AbstractSession.
     * @param {ISession} session: Session parameter object
     * @memberof AbstractSession
     */
    constructor(private mISession: ISession) {
        this.mLog = Logger.getImperativeLogger();
        mISession = this.buildSession(mISession);
    }

    /**
     * Method to parse the requested token type
     * @param {*} cookie - cookie object from http(s) response
     * @memberof AbstractSession
     */
    public storeCookie(cookie: any) {

        const headerKeys: string[] = Object.keys(cookie);
        headerKeys.forEach((key) => {
            const auth = cookie[key] as string;
            const authArr = auth.split(";");
            // see each field in the cookie, e/g. Path=/; Secure; HttpOnly; LtpaToken2=...
            authArr.forEach((element: string) => {
                // if element begins with tokenType, extract full tokenType and tokenValue.
                if (element.indexOf(this.ISession.tokenType) === 0) {
                    // parse off token value, splitting element at first "=".
                    const split = element.indexOf("=");
                    if (split >= 0) {
                        this.ISession.tokenType  = element.substring(0, split);
                        this.ISession.tokenValue = element.substring(split + 1);
                    }
                }
            });
        });
    }

    /**
     * Builds an ISession so all required pieces are filled in
     * @private
     * @param {ISession} session - the fully populated session
     * @memberof AbstractSession
     */
    private buildSession(session: ISession): ISession {
        const populatedSession = session;

        // set protocol if not set
        if (populatedSession.protocol === undefined || populatedSession.protocol === null) {
            populatedSession.protocol = AbstractSession.DEFAULT_PROTOCOL;
        }

        // set rejectUnauthorized
        if (populatedSession.rejectUnauthorized === undefined || populatedSession.rejectUnauthorized === null) {
            populatedSession.rejectUnauthorized = AbstractSession.DEFAULT_REJECT_UNAUTHORIZED_SETTING;
        }

        // set strictSSL
        if (populatedSession.strictSSL === undefined || populatedSession.strictSSL === null || populatedSession?.proxy.proxy_strict_ssl) {
            populatedSession.strictSSL = AbstractSession.DEFAULT_STRICT_SSL;
        }

        // set port if not set
        if (populatedSession.port === undefined || populatedSession.port === null) {
            if (populatedSession.protocol === SessConstants.HTTP_PROTOCOL) {
                populatedSession.port = AbstractSession.DEFAULT_HTTP_PORT;
            } else if (populatedSession.protocol === SessConstants.HTTPS_PROTOCOL) {
                populatedSession.port = AbstractSession.DEFAULT_HTTPS_PORT;
            }
        }

        // set protocol if not set
        if (populatedSession.secureProtocol === undefined || populatedSession.secureProtocol === null) {
            populatedSession.secureProtocol = AbstractSession.DEFAULT_SECURE_PROTOCOL;
        }

        // set basePath if not set
        if (populatedSession.basePath === undefined || populatedSession.basePath === null) {
            populatedSession.basePath = AbstractSession.DEFAULT_BASE_PATH;
        }

        // set type if not set
        if (populatedSession.type === undefined || populatedSession.type === null) {
            populatedSession.type = AbstractSession.DEFAULT_TYPE;
        }
        // populatedSession.type = populatedSession.type.toLocaleLowerCase();
        ImperativeExpect.keysToBeDefinedAndNonBlank(populatedSession, ["hostname"]);
        ImperativeExpect.toBeOneOf(populatedSession.type,
            [SessConstants.AUTH_TYPE_NONE, SessConstants.AUTH_TYPE_BASIC, SessConstants.AUTH_TYPE_TOKEN,
                SessConstants.AUTH_TYPE_BEARER, SessConstants.AUTH_TYPE_CERT_PEM]); // , SessConstants.AUTH_TYPE_CERT_PFX]);
        ImperativeExpect.toBeOneOf(populatedSession.protocol, [SessConstants.HTTPS_PROTOCOL, SessConstants.HTTP_PROTOCOL]);

        // if basic auth, must have user and password OR base 64 encoded credentials
        if (session.type === SessConstants.AUTH_TYPE_BASIC) {
            if (session.user     !== undefined && session.user     !== null &&
                session.password !== undefined && session.password !== null)
            {
                // ok
            } else if (session.base64EncodedAuth !== undefined && session.base64EncodedAuth !== null) {
                // ok
            } else {
                throw new ImperativeError({
                    msg: "Must have user & password OR base64 encoded credentials",
                    additionalDetails: "For CLI usage, see '<your-cli> auth login <service> --help'"
                });
            }
            ImperativeExpect.keysToBeUndefined(populatedSession, ["tokenType", "tokenValue", "cert", "certKey"]);
        }

        // if bearer auth, must have token
        if (session.type === SessConstants.AUTH_TYPE_BEARER) {
            ImperativeExpect.keysToBeDefinedAndNonBlank(populatedSession, ["tokenValue"] );
            ImperativeExpect.keysToBeUndefined(populatedSession, ["tokenType", "user", "password", "cert", "certKey"] );
        }

        if (session.type === SessConstants.AUTH_TYPE_TOKEN) {
            ImperativeExpect.keysToBeDefinedAndNonBlank(session, ["tokenType"], "You must provide a token type to use cookie authentication");

            if (populatedSession.tokenValue === undefined || populatedSession.tokenValue === null) {
                if (session.user     !== undefined && session.user     !== null &&
                    session.password !== undefined && session.password !== null)
                {
                    // ok
                } else if (session.base64EncodedAuth !== undefined && session.base64EncodedAuth !== null) {
                    // ok
                } else {
                    throw new ImperativeError({
                        // msg: "Must have user & password OR tokenType & tokenValue OR cert & certKey OR cert & passphrase",
                        msg: "Must have user & password OR tokenType & tokenValue OR cert & certKey.",
                        additionalDetails: "For CLI usage, see '<your-cli> auth login <service> --help'"
                    });
                }
            }
        }

        if (session.type === SessConstants.AUTH_TYPE_CERT_PEM) {
            ImperativeExpect.keysToBeDefinedAndNonBlank(populatedSession, ["cert", "certKey"]);
            ImperativeExpect.keysToBeUndefined(populatedSession, ["tokenValue", "user", "password"] );
            ImperativeExpect.toNotBeEqual(populatedSession.protocol, SessConstants.HTTP_PROTOCOL,
                "Certificate based authentication cannot be used over HTTP. Please set protocol to HTTPS to use certificate authentication.");
        }

        // if (session.type === SessConstants.AUTH_TYPE_CERT_PFX) {
        //     ImperativeExpect.keysToBeDefinedAndNonBlank(populatedSession, ["cert", "passphrase"]);
        //     ImperativeExpect.toNotBeEqual(populatedSession.protocol, SessConstants.HTTP_PROTOCOL,
        //         "Certificate based authentication cannot be used over HTTP. Please set protocol to HTTPS to use certificate authentication.");
        // }

        // if basic auth
        if (populatedSession.type === SessConstants.AUTH_TYPE_BASIC || populatedSession.type === SessConstants.AUTH_TYPE_TOKEN) {

            // get base 64 encoded auth if not provided
            if (populatedSession.base64EncodedAuth === undefined || populatedSession.base64EncodedAuth === null) {
                if (populatedSession.user     !== undefined && populatedSession.user     !== null &&
                    populatedSession.password !== undefined && populatedSession.password !== null)
                {
                    populatedSession.base64EncodedAuth = AbstractSession.getBase64Auth(populatedSession.user, populatedSession.password);
                }
            } else {
                if (populatedSession.user === undefined || populatedSession.user === null) {
                    populatedSession.user = AbstractSession.getUsernameFromAuth(populatedSession.base64EncodedAuth);
                }
                if (populatedSession.password === undefined || populatedSession.password === null) {
                    populatedSession.password = AbstractSession.getPasswordFromAuth(populatedSession.base64EncodedAuth);
                }
            }
        }

        return populatedSession;
    }

    /**
     * Obtain session info and defaults
     * @readonly
     * @type {ISession}
     * @memberof AbstractSession
     */
    get ISession(): ISession {
        return this.mISession;
    }
}
