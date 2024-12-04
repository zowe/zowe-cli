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
            // start over with an empty order.
            AuthOrder.m_authOrder = null;
        }

        if (cmdArgs.authOrder) {
            // validate each user-supplied type of authentication
            for (const nextUserAuth of cmdArgs.authOrder) {
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
                        /* todo: Remove diagnostic print statements
                       console.log("____ cacheAuthOrder: nextUserAuth = '" + nextUserAuth + "' is not valid and will be ignored.");
                       // end Remove todo: */
                }
            }
        }

        // the user supplied an authOrder
        if (AuthOrder.m_authOrder !== null) {
            /* todo: Remove diagnostic print statements
            console.log("____ cacheAuthOrder: cached authOrder = " + AuthOrder.m_authOrder);
            // end Remove todo: */
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
        /* todo: Remove diagnostic print statements
        console.log("____ cacheAuthOrder: cached authOrder = " + AuthOrder.m_authOrder);
        // end Remove todo: */
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

        /* todo: Remove diagnostic print statements
        sessCfg.tokenType = "apimlAuthenticationToken";
        sessCfg.tokenValue = "SomeTokenValue";
        sessCfg.cert = "./certFile.txt";
        sessCfg.certKey = "./certKeyFile.txt";
        sessCfg.authTypeOrder = [];
        sessCfg.authTypeOrder.push("bogusAuthType1");
        sessCfg.authTypeOrder.push("bogusAuthType2");
        sessCfg.authTypeOrder.push("bogusAuthType3");
        sessCfg.authTypeOrder.push("bogusAuthType4");
        console.log("____ putTopAuthInSession:\ncmdArgs = " + JSON.stringify(cmdArgs, null, 2));
        console.log("____ putTopAuthInSession:\nsessCfg before processing = " + JSON.stringify(sessCfg, null, 2));
        // end Remove todo: */

        // Detect the first auth type (from our auth order) provided in the session config or in command args.
        // Ensure that the auth properties are placed in the session config.
        // Record the detected auth type for use as the session type.
        let errMsg: string;
        for (const nextAuth of AuthOrder.m_authOrder) {
            switch (nextAuth) {
                case SessConstants.AUTH_TYPE_BASIC:
                    // todo: do we have to check for sessCfg.base64EncodedAuth ?
                    if (cmdArgs.user?.length > 0) {
                        sessCfg.user = cmdArgs.user;
                    }
                    if (cmdArgs.password?.length > 0) {
                        sessCfg.password = cmdArgs.password;
                    }
                    if (sessCfg.user?.length > 0 && sessCfg.password?.length > 0) {
                        // TODO: Confirm in ConnectionPropsForSessCfg that requestToken will work ok with sessTypeToUse
                        sessTypeToUse = SessConstants.AUTH_TYPE_BASIC;
                    }
                    break;
                case SessConstants.AUTH_TYPE_TOKEN:
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
                    if (cmdArgs.certFile?.length > 0) {
                        sessCfg.cert = cmdArgs.certFile;
                    }
                    if (cmdArgs.certKeyFile?.length > 0) {
                        sessCfg.certKey = cmdArgs.certKeyFile;
                    }
                    if (sessCfg.cert?.length > 0 && sessCfg.certKey?.length > 0) {
                        sessTypeToUse = SessConstants.AUTH_TYPE_CERT_PEM;
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

        // todo: Should we throw error if no creds are in the session, or let other functions throw the error?

        /* todo: Remove diagnostic print statements
        console.log("____ putTopAuthInSession:\nsessCfg after processing = " + JSON.stringify(sessCfg, null, 2));
        // end Remove todo: */
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

        // initially set all creds to be removed from the session. Later we delete the desired creds from this set
        const credsToRemove = new Set(["user", "password", "base64EncodedAuth", "tokenType", "tokenValue", "cert", "certKey"]);

        // Delete the selected creds from the set of creds that will be removed from our session config.
        let errMsg: string;
        switch (sessCfg.type) {
            case SessConstants.AUTH_TYPE_BASIC:
                credsToRemove.delete("user");
                credsToRemove.delete("password");
                credsToRemove.delete("base64EncodedAuth");
                break;
            case SessConstants.AUTH_TYPE_TOKEN:
                credsToRemove.delete("tokenType");
                credsToRemove.delete("tokenValue");
                break;
            case SessConstants.AUTH_TYPE_BEARER:
                credsToRemove.delete("tokenValue");
                break;
            case SessConstants.AUTH_TYPE_CERT_PEM:
                credsToRemove.delete("cert");
                credsToRemove.delete("certKey");
                break;
            case SessConstants.AUTH_TYPE_NONE:
                break;
            default:
                // authOrder was validated. A wrong value now is our programming error.
                errMsg = `Session an invalid type = ${sessCfg.type}.`;
                Logger.getImperativeLogger().error(errMsg);
                throw new ImperativeError({ msg: errMsg });
        }

        // remove all auth creds from the session, except the creds for the auth type that we chose to keep
        const credIter = credsToRemove.values();
        let nextCredToRemove = credIter.next();
        while (!nextCredToRemove.done) {
            /* todo: Remove diagnostic print statements
            console.log("____ removeExtraCredsFromSess: deleting  = 'sessCfg." + nextCredToRemove.value + "' from the session.");
            // end Remove todo: */

            delete (sessCfg as any)[nextCredToRemove.value];
            nextCredToRemove = credIter.next();
        }
    }
}