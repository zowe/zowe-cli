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

import { ICommandArguments } from "../../../cmd";
import { ImperativeError } from "../../../error";
import { ISession } from "./doc/ISession";
import { Logger } from "../../../logger";
import * as SessConstants from "./SessConstants";

/**
 * @internal - Cannot be used outside of the imperative package
 *
 * The purpose of this class is to detect an authentication order property
 * supplied by a user in a profile, command line, or environment variable.
 * That authOrder is then used to place the correct set of credentials into
 * a session for authentication.
 */
export class AuthOrder {

    /**
     * When a user does not supply an auth order, Zowe clients will use a
     * hard-coded default order. This property records whether AUTH_TYPE_BASIC
     * or AUTH_TYPE_TOKEN is the top auth choice in the order.
     */
    private static m_topDefaultAuth: string = SessConstants.AUTH_TYPE_BASIC;

    /**
     * This array of authentication types specifies the order of preferred
     * authentication. It contains the user-specified order, or a default order
     * if the user does not specify an order. m_authOrder[0] is the highest
     * preferred authentication.
     */
    private static m_authOrder: SessConstants.AUTH_TYPE_CHOICES[] = null;

    // ***********************************************************************
    /**
     * Set the top auth type when a default authOrder is used. Previously,
     * two different hard-coded orders were present in the Zowe clients.
     * Both hard-coded orders are now provided by this class. Zowe code,
     * that still sets a specific order for backward compatibility, now
     * calls this function to ensure that that the original behavior remains
     * the same and avoids a breaking change when a user has not specified
     * an authOrder property.
     *
     * @param topDefaultAuth - Input.
     *      The top authentication type that will be used when forming a
     *      default authOrder.
     */
    public static setTopDefaultAuth(
        topDefaultAuth: typeof SessConstants.AUTH_TYPE_BASIC | typeof SessConstants.AUTH_TYPE_TOKEN
    ): void {
        AuthOrder.m_topDefaultAuth = topDefaultAuth;
    }

    // ***********************************************************************
    /**
     * Cache the authOrder property from the supplied cmdArgs. If no authOrder exists
     * in cmdArgs, a default authOrder is created and cached.
     *
     * @param cmdArgs - Input.
     *      The set of arguments that the calling function is using.
     */
    private static cacheAuthOrder(cmdArgs: ICommandArguments): void {
        // have we already cached the authOrder?
        if (AuthOrder.m_authOrder !== null) {
            // start over with an empty auth order.
            AuthOrder.m_authOrder = null;
        }

        if (cmdArgs.authOrder) {
            if (typeof cmdArgs.authOrder === "string") {
                // convert user's comma-separated string into an array of auth types, and remove whitespace
                const userAuthOrder = cmdArgs.authOrder.split(',');
                for (let nextUserAuth of userAuthOrder) {
                    nextUserAuth = nextUserAuth.trim();

                    // validate each user-supplied type of authentication
                    switch (nextUserAuth) {
                        case SessConstants.AUTH_TYPE_BASIC:
                        case SessConstants.AUTH_TYPE_TOKEN:
                        case SessConstants.AUTH_TYPE_BEARER:
                        case SessConstants.AUTH_TYPE_CERT_PEM:
                        case SessConstants.AUTH_TYPE_NONE:
                            if (AuthOrder.m_authOrder === null) {
                                AuthOrder.m_authOrder = [];
                            }
                            AuthOrder.m_authOrder.push(nextUserAuth);
                            break;
                        default:
                            Logger.getImperativeLogger().error(
                                `The authentication = '${nextUserAuth}' is not valid and will be ignored.`
                            );
                            // todo: Remove diagnostic print statement below
                            console.log("____ cacheAuthOrder: nextUserAuth = '" + nextUserAuth + "' is not valid and will be ignored.");
                            break;
                    }
                }
            } else {
                Logger.getImperativeLogger().error(
                    `The authOrder option = '${cmdArgs.authOrder}' is not a string. A default authOrder will be used.`
                );
                // todo: Remove diagnostic print statement below
                console.log(`The authOrder option = '${cmdArgs.authOrder}' is not a string. A default authOrder will be used.`);
            }
        }

        if (AuthOrder.m_authOrder !== null) {
            // the user supplied an authOrder and we used it
            return;
        }

        // No authOrder was supplied by the user. Create a default order.
        AuthOrder.m_authOrder = [];
        if (AuthOrder.m_topDefaultAuth === SessConstants.AUTH_TYPE_BASIC) {
            // we want user & password auth as the top choice
            AuthOrder.m_authOrder.push(SessConstants.AUTH_TYPE_BASIC);
            AuthOrder.m_authOrder.push(SessConstants.AUTH_TYPE_TOKEN);
        } else {
            // we want token auth as the top choice
            AuthOrder.m_authOrder.push(SessConstants.AUTH_TYPE_TOKEN);
            AuthOrder.m_authOrder.push(SessConstants.AUTH_TYPE_BASIC);
        }
        // add remaining auth types. We do not include 'none' in our defaults.
        AuthOrder.m_authOrder.push(SessConstants.AUTH_TYPE_BEARER);
        AuthOrder.m_authOrder.push(SessConstants.AUTH_TYPE_CERT_PEM);
    }

    // ***********************************************************************
    /**
     * Find the highest auth type (according to the authOrder) which exists
     * in either the supplied session config or command line arguments.
     * Then place the credentials associated with that auth type into the
     * supplied session config. Credentials for all other auth types are
     * removed from the session config.
     *
     * @param sessCfg - Modified.
     *      Authentication properties are added to and removed from this
     *      session configuration, which can already have properties in
     *      this object when passed to this function.
     *
     * @param cmdArgs - Input.
     *      The set of arguments with which the calling function is operating.
     *      For CLI, the cmdArgs come from the command line, profile, or
     *      environment. Other apps can place relevant arguments into this
     *      object to be processed by this function.
     */
    public static putTopAuthInSession<SessCfgType extends ISession>(
        sessCfg: SessCfgType,
        cmdArgs: ICommandArguments
    ): void {
        let sessTypeToUse: SessConstants.AUTH_TYPE_CHOICES = null;

        // cache the correct authOrder to use
        AuthOrder.cacheAuthOrder(cmdArgs);

        // Detect the first auth type (from our auth order) provided in the session config or in command args.
        // Ensure that the auth properties are placed in the session config.
        // Record the detected auth type for use as the session type.
        let errMsg: string;
        for (const nextAuth of AuthOrder.m_authOrder) {
            switch (nextAuth) {
                case SessConstants.AUTH_TYPE_BASIC:
                    if (cmdArgs.base64EncodedAuth?.length > 0) {
                        // When we have base64EncodedAuth, place it in the session.
                        // We then do not need or want user and password in the session.
                        sessCfg.base64EncodedAuth = cmdArgs.base64EncodedAuth;
                        sessTypeToUse = SessConstants.AUTH_TYPE_BASIC;
                    } else if (sessCfg.user?.length > 0 && sessCfg.password?.length > 0) {
                        // Since both user and password are available, place them in the session.
                        // Remove an existing base64EncodedAuth from the session. It will be
                        // recreated later with this user and password.
                        sessCfg.user = cmdArgs.user;
                        sessCfg.password = cmdArgs.password;
                        sessTypeToUse = SessConstants.AUTH_TYPE_BASIC;
                    }
                    if (sessTypeToUse === SessConstants.AUTH_TYPE_BASIC && sessCfg.authTypeToRequestToken) {
                        // The existence of authTypeToRequestToken indicates that we want
                        // to request a token. We record how we will authenticate,
                        // but we change the session type to token (old requirement).
                        sessCfg.authTypeToRequestToken = SessConstants.AUTH_TYPE_BASIC;
                        sessTypeToUse = SessConstants.AUTH_TYPE_TOKEN;
                    }
                    break;
                case SessConstants.AUTH_TYPE_TOKEN:
                    if (sessCfg.authTypeToRequestToken) {
                        // you cannot use a token to retrieve a new token
                        continue;
                    }
                    if (cmdArgs.tokenType?.length > 0) {
                        sessCfg.tokenType = cmdArgs.tokenType;
                    }
                    if (cmdArgs.tokenValue?.length > 0) {
                        sessCfg.tokenValue = cmdArgs.tokenValue;
                    }
                    if (sessCfg.tokenType?.length > 0 && sessCfg.tokenValue?.length > 0) {
                        sessTypeToUse = SessConstants.AUTH_TYPE_TOKEN;
                    }
                    break;
                case SessConstants.AUTH_TYPE_BEARER:
                    if (sessCfg.authTypeToRequestToken) {
                        // you cannot use a token to retrieve a new token
                        continue;
                    }
                    if (cmdArgs.tokenType?.length > 0) {
                        sessCfg.tokenType = cmdArgs.tokenType;
                    }
                    if (cmdArgs.tokenValue?.length > 0) {
                        sessCfg.tokenValue = cmdArgs.tokenValue;
                    }
                    // a tokenValue with no tokenType implies a bearer token
                    if (!(sessCfg.tokenType?.length > 0) && sessCfg.tokenValue?.length > 0) {
                        sessTypeToUse = SessConstants.AUTH_TYPE_BEARER;
                    }
                    break;
                case SessConstants.AUTH_TYPE_CERT_PEM:
                    if (sessCfg.cert?.length > 0 && sessCfg.certKey?.length > 0) {
                        sessCfg.cert = cmdArgs.certFile;
                        sessCfg.certKey = cmdArgs.certKeyFile;
                        if (sessCfg.authTypeToRequestToken) {
                            // The existence of authTypeToRequestToken indicates that we want
                            // to request a token. We record how we will authenticate,
                            // but we still record the session type as token (old requirements).
                            sessCfg.authTypeToRequestToken = SessConstants.AUTH_TYPE_CERT_PEM;
                            sessTypeToUse = SessConstants.AUTH_TYPE_TOKEN;
                        } else {
                            sessTypeToUse = SessConstants.AUTH_TYPE_CERT_PEM;
                        }
                    }
                    break;
                case SessConstants.AUTH_TYPE_NONE:
                    sessTypeToUse = SessConstants.AUTH_TYPE_NONE;
                    break;
                default:
                    // authOrder was validated. A wrong value now is our programming error.
                    errMsg = `authOrder contains an invalid authentication = ${nextAuth}.`;
                    Logger.getImperativeLogger().error(errMsg);
                    throw new ImperativeError({ msg: errMsg });
            }
            if (sessTypeToUse !== null) {
                // stop looking for auth types after we find the first one
                break;
            }
        }

        // When no creds are in the session and AUTH_TYPE_NONE is not in the user's authOrder,
        // remove the session type from the session. Otherwise set the type that we found.
        if (sessTypeToUse === null) {
            delete sessCfg.type;
        } else {
            sessCfg.type = sessTypeToUse;
        }

        // remove all extra auth creds from the session
        AuthOrder.removeExtraCredsFromSess(sessCfg);

        // copy our authOrder into the session object
        sessCfg.authTypeOrder = [...AuthOrder.m_authOrder];

        // todo: Remove diagnostic print statement below
        console.log("____ putTopAuthInSession:\nsessCfg after processing = " + JSON.stringify(sessCfg, null, 2));
    }

    // ***********************************************************************
    /**
     * Remove all credential properties from the supplied session except for the
     * creds related to the session type specified within the sessCfg argument.
     *
     * @param sessCfg - Modified.
     *      Authentication credentials are removed from this session configuration.
     */
    private static removeExtraCredsFromSess<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): void {
        if (AuthOrder.cacheAuthOrder == null) {
            const errMsg = "AuthOrder.cacheAuthOrder must be called before AuthOrder.removeExtraCredsFromSess";
            Logger.getImperativeLogger().error(errMsg);
            throw new ImperativeError({ msg: errMsg });
        }
        if (!sessCfg?.type) {
            const errMsg = "Session type must exist in the supplied session.";
            Logger.getImperativeLogger().error(errMsg);
            throw new ImperativeError({ msg: errMsg });
        }

        // Initially set all creds to be removed from the session.
        // Then delete from this set the creds that we want to keep.
        const credsToRemove = new Set(["user", "password", "base64EncodedAuth", "tokenType", "tokenValue", "cert", "certKey"]);

        // Select the creds that we want to keep.
        let errMsg: string;
        switch (sessCfg.type) {
            case SessConstants.AUTH_TYPE_BASIC:
                // only keep one of our basic creds
                if (sessCfg.base64EncodedAuth) {
                    this.keepCred("base64EncodedAuth", credsToRemove);
                } else {
                    this.keepCred("user", credsToRemove);
                    this.keepCred("password", credsToRemove);
                }
                break;
            case SessConstants.AUTH_TYPE_TOKEN:
                // in all cases we keep the supplied token type
                this.keepCred("tokenType", credsToRemove);

                if (!sessCfg.authTypeToRequestToken) {
                    // we want to actually use the token, so keep its value
                    this.keepCred("tokenValue", credsToRemove);
                } else if (sessCfg.authTypeToRequestToken == SessConstants.AUTH_TYPE_BASIC) {
                    // We are requesting a token using basic creds.
                    // Keep only one of our basic creds and allow tokenValue to be removed.
                    if (sessCfg.base64EncodedAuth) {
                        this.keepCred("base64EncodedAuth", credsToRemove);
                    } else {
                        this.keepCred("user", credsToRemove);
                        this.keepCred("password", credsToRemove);
                    }
                } else if (sessCfg.authTypeToRequestToken == SessConstants.AUTH_TYPE_CERT_PEM) {
                    // We are requesting a token using a cert.
                    // Keep the cert creds and allow tokenValue to be removed
                    this.keepCred("cert", credsToRemove);
                    this.keepCred("certKey", credsToRemove);
                } else {
                    // Our own code supplied a bad value for authTypeToRequestToken.
                    errMsg = "The requested session contains an invalid value for " +
                        `'authTypeToRequestToken' = ${sessCfg.authTypeToRequestToken}.`;
                    Logger.getImperativeLogger().error(errMsg);
                    throw new ImperativeError({ msg: errMsg });
                }
                break;
            case SessConstants.AUTH_TYPE_BEARER:
                this.keepCred("tokenValue", credsToRemove);
                break;
            case SessConstants.AUTH_TYPE_CERT_PEM:
                this.keepCred("cert", credsToRemove);
                this.keepCred("certKey", credsToRemove);
                break;
            case SessConstants.AUTH_TYPE_NONE:
                break;
            default:
                // authOrder was validated. A wrong value now is our programming error.
                errMsg = `The requested session contains an invalid value for 'type' = ${sessCfg.type}.`;
                Logger.getImperativeLogger().error(errMsg);
                throw new ImperativeError({ msg: errMsg });
        }

        // remove all auth creds from the session, except the creds for the auth type that we chose to keep
        const credIter = credsToRemove.values();
        let nextCredToRemove = credIter.next();
        while (!nextCredToRemove.done) {
            delete (sessCfg as any)[nextCredToRemove.value];
            nextCredToRemove = credIter.next();
        }
    }

    // ***********************************************************************
    /**
     * Keep the specified credential by deleting it from the set of
     * credentials to remove.
     *
     * @param credToKeep - Input.
     *      The credential that we want to keep.
     *
     * @param credsToRemove - Modified.
     *      The set of credentials that will be removed.
     */
    private static keepCred(credToKeep: string, credsToRemove: Set<string>): void {
        credsToRemove.delete(credToKeep);
    }

}