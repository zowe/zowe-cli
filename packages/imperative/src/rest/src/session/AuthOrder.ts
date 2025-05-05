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

import { Censor } from "../../../censor";
import { ICommandArguments } from "../../../cmd";
import { ImperativeError } from "../../../error";
import { ISession } from "./doc/ISession";
import { Logger } from "../../../logger";
import * as SessConstants from "./SessConstants";

/**
 * The purpose of this class is to detect an authentication order property
 * supplied by a user in a profile, command line, or environment variable.
 * That authOrder is then used to place the correct set of credentials into
 * a session for authentication.
 *
 * To accomplish this behavior, we call AuthOrder.cacheCredsAndAuthOrder
 * early in the processing of a command (when both a session
 * configuration and command arguments are available). For example in:
 *      ConnectionPropsForSessCfg.addPropsOrPrompt or
 *      ProfileInfo.createSession
 *
 * Later, before we use the session, we call AuthOrder.putTopAuthInSession.
 * For example in:
 *      RestClient.constructor
 *      AbstractRestClient.constructor
 *      AbstractRestClient.request
 * AuthOrder.putTopAuthInSession ensures that the session only contains the
 * credentials for the desired type of authentication.
 */
export class AuthOrder {
    private static readonly SESS_CERT_NAME = "cert";
    private static readonly SESS_CERT_KEY_NAME = "certKey";
    private static readonly ARRAY_OF_CREDS = [
        "user", "password", "base64EncodedAuth", "tokenType", "tokenValue",
        AuthOrder.SESS_CERT_NAME, AuthOrder.SESS_CERT_KEY_NAME
    ];

    // ***********************************************************************
    /**
     * Cache all of the credentials that are available in either the supplied
     * sessCfg object or in the supplied command arguments. Also cache the
     * authOrder that is specified in the supplied command arguments. The
     * cache properties are stored into the sessCfg object itself.
     *
     * Downstream logic uses this cache to determine which auth type should be
     * used in the final session used by a client REST request.
     *
     * @param sessCfg - Modified.
     *      A session configuration object to which we place the cached creds.
     *
     * @param cmdArgs - Input.
     *      The set of arguments with which the calling function is operating.
     *      For CLI, the cmdArgs come from the command line, profile, or
     *      environment. Other apps can place relevant arguments into this
     *      object to be processed by this function.
     *
     *      If cmdArgs is not supplied, we only cache creds found in the sessCfg.
     */
    public static cacheCredsAndAuthOrder<SessCfgType extends ISession>(
        sessCfg: SessCfgType,
        cmdArgs: ICommandArguments = { "$0": "NameNotUsed", "_": [] }
        // when no cmdArgs are provided, use an empty set of cmdArgs
    ): void {
        // create a new auth cache (if needed) in the session config
        AuthOrder.findOrCreateAuthCache(sessCfg);

        // add any discovered authOrder to the cache
        AuthOrder.cacheAuthOrder(sessCfg, cmdArgs);

        // add every available cred to the cache
        for (const sessCredName of AuthOrder.ARRAY_OF_CREDS) {
            AuthOrder.cacheCred(sessCredName, sessCfg, cmdArgs);
        }
    }

    // ***********************************************************************
    /**
     * Cache the default authentication order to be used when the user has NOT
     * specified an order. No action is performed if the end-user HAS defined
     * an authentication order in their zowe client configuration.
     *
     * For historical reason, we have 2 default orders. Thus, the caller can
     * specify which of 2 creds to use as the top cred in the authentication order:
     *     SessConstants.AUTH_TYPE_BASIC or SessConstants.AUTH_TYPE_TOKEN
     *
     * @internal - Cannot be used outside of the imperative package
     *
     * @param sessCfg - Modified.
     *      A session configuration object into which we place the default order.
     *
     * @param topDefaultAuth - Input.
     *      The authentication type that will be used first.
     *
     * @return True when the default order was cached.
     *         False when the user supplied an order, because you cannot
     *         override the user-supplied order with any default.
     */
    public static cacheDefaultAuthOrder<SessCfgType extends ISession>(
        sessCfg: SessCfgType,
        topDefaultAuth: typeof SessConstants.AUTH_TYPE_BASIC | typeof SessConstants.AUTH_TYPE_TOKEN
    ): boolean {
        // create a new auth cache (if needed) in the session config
        AuthOrder.findOrCreateAuthCache(sessCfg);

        if (sessCfg._authCache.didUserSetAuthOrder) {
            // nobody can change what the user specified
            Logger.getImperativeLogger().info(
                `Because user set authOrder, an attempt to put ${topDefaultAuth} at the top of the order was ignored.`
            );
            return false;
        }

        // record the top auth that was requested for use in the default order
        sessCfg._authCache.topDefaultAuth = topDefaultAuth;

        // start over with an empty auth order.
        sessCfg.authTypeOrder = [];

        if (sessCfg._authCache.topDefaultAuth === SessConstants.AUTH_TYPE_BASIC) {
            // we want user & password auth as the top choice
            sessCfg.authTypeOrder.push(SessConstants.AUTH_TYPE_BASIC);
            sessCfg.authTypeOrder.push(SessConstants.AUTH_TYPE_TOKEN);
        } else {
            // we want token auth as the top choice
            sessCfg.authTypeOrder.push(SessConstants.AUTH_TYPE_TOKEN);
            sessCfg.authTypeOrder.push(SessConstants.AUTH_TYPE_BASIC);
        }
        // add remaining auth types. We do not include 'none' in our defaults.
        sessCfg.authTypeOrder.push(SessConstants.AUTH_TYPE_BEARER);
        sessCfg.authTypeOrder.push(SessConstants.AUTH_TYPE_CERT_PEM);

        return true;
    }

    // ***********************************************************************
    /**
     * Clears the authentication cache.
     *
     * To get the right creds and auth order in your session after calling this
     * function you must once again call the appropriate combination of:
     *      AuthOrder.cacheCredsAndAuthOrder
     *      AuthOrder.cacheDefaultAuthOrder
     *      AuthOrder.putTopAuthInSession
     *
     * @internal - Cannot be used outside of the imperative package
     */
    public static clearAuthCache<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): void {
        delete sessCfg._authCache;
        AuthOrder.findOrCreateAuthCache(sessCfg);
    }

    // ***********************************************************************
    /**
     * Returns the cached authentication order.
     * If no auth order exists, we create and return a default auth order.
     *
     * @internal - Cannot be used outside of the imperative package
     *
     * @param sessCfg - Modified.
     *      The session config from which we retrieve the cached auth order.
     *      When no auth order exists in the sessCfg, a default auth order
     *      is stored in the sessCfg, before returning that newly created value.
     *
     * @return {SessConstants.AUTH_TYPE_CHOICES[]} The cached authentication order.
     */
    public static getAuthOrder<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): SessConstants.AUTH_TYPE_CHOICES[] {
        if (!sessCfg.authTypeOrder || sessCfg.authTypeOrder.length === 0) {
            // we have no auth order, so create a default authOrder that we can return
            sessCfg._authCache.didUserSetAuthOrder = false;
            AuthOrder.chooseDefaultAuthOrder(sessCfg);
        }
        return sessCfg.authTypeOrder;
    }

    // ***********************************************************************
    /**
     * Record that the session is being used to make a request for a token
     * (ie logging into APIML).
     *
     * @param sessCfg - Modified.
     *      The session config into which we record that we are requesting a token.
     */
    public static makingRequestForToken<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): void {
        // create a new auth cache (if needed) in the session config
        AuthOrder.findOrCreateAuthCache(sessCfg);

        // Just create the property with a placeholder value.
        // putTopAuthInSession() will later place the correct value into this property
        sessCfg._authCache.authTypeToRequestToken = SessConstants.AUTH_TYPE_NONE;
    }

    // ***********************************************************************
    /**
     * Remove any request-for-token from the session config.
     *
     * @internal - Cannot be used outside of the imperative package
     *
     * @param sessCfg - Modified.
     *      The session config from which we remove a request-for-token.
     */
    public static removeRequestForToken<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): void {
        if (sessCfg?._authCache?.authTypeToRequestToken) {
            delete sessCfg._authCache.authTypeToRequestToken;
        }
    }

    // ***********************************************************************
    /**
     * Find the highest auth type (according to the authOrder) that exists
     * in availableCreds within the supplied session config.
     * Then place the credentials associated with that auth type into the
     * top-level of the session config. Finally, remove credentials
     * for all other auth types from the top-level of session config.
     *
     * @internal - Cannot be used outside of the imperative package
     *
     * @param sessCfg - Modified.
     *      Authentication properties are added to and removed from this
     *      session configuration, which can already have properties in
     *      this object when passed to this function.
     *
     * @throws {ImperativeError} If an invalid auth type is encountered.
     */
    public static putTopAuthInSession<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): void {
        // If our caller did not follow best practices in their use of imperative functions,
        // then cacheCredsAndAuthOrder may not have been called, and availableCreds may be empty.
        if (!sessCfg._authCache?.availableCreds || Object.keys(sessCfg._authCache.availableCreds).length === 0) {
            // As a last resort, cache our creds now with an empty set of command args.
            // This will cache any creds from the sessCfg and use a default auth order.
            AuthOrder.cacheCredsAndAuthOrder(sessCfg, { "$0": "NameNotUsed", "_": [] });
        }
        Logger.getImperativeLogger().debug("Starting sessCfg = " + Censor.censorSession(sessCfg));

        // Detect the first auth type (from our auth order) within our available credentials.
        // Ensure that the auth properties are placed in the session config.
        // Record the detected auth type for use as the session type.
        let sessTypeToUse: SessConstants.AUTH_TYPE_CHOICES = null;
        let errMsg: string;
        for (const nextAuth of sessCfg.authTypeOrder) {
            switch (nextAuth) {
                case SessConstants.AUTH_TYPE_BASIC:
                    if (sessCfg._authCache.availableCreds.user && sessCfg._authCache.availableCreds.password) {
                        sessCfg.user = sessCfg._authCache.availableCreds.user;
                        sessCfg.password = sessCfg._authCache.availableCreds.password;
                        // always regenerate b64Auth in case it is out-of date with user & password
                        sessCfg.base64EncodedAuth = Buffer.from(sessCfg.user + ":" + sessCfg.password).toString("base64");
                        sessTypeToUse = SessConstants.AUTH_TYPE_BASIC;
                    } else if (sessCfg._authCache.availableCreds.base64EncodedAuth) {
                        sessCfg.base64EncodedAuth = sessCfg._authCache.availableCreds.base64EncodedAuth;
                        sessTypeToUse = SessConstants.AUTH_TYPE_BASIC;
                    }
                    if (sessTypeToUse === SessConstants.AUTH_TYPE_BASIC && sessCfg._authCache.authTypeToRequestToken) {
                        // The existence of authTypeToRequestToken indicates that we want
                        // to request a token. We record how we will authenticate,
                        // but we change the session type to token (old requirement).
                        sessCfg._authCache.authTypeToRequestToken = SessConstants.AUTH_TYPE_BASIC;
                        sessTypeToUse = SessConstants.AUTH_TYPE_TOKEN;
                    }
                    break;
                case SessConstants.AUTH_TYPE_TOKEN:
                    if (sessCfg._authCache.authTypeToRequestToken) {
                        // you cannot use a token to retrieve a new token
                        continue;
                    }
                    if (sessCfg._authCache.availableCreds.tokenType) {
                        sessCfg.tokenType = sessCfg._authCache.availableCreds.tokenType;
                    }
                    if (sessCfg._authCache.availableCreds.tokenValue) {
                        sessCfg.tokenValue = sessCfg._authCache.availableCreds.tokenValue;
                    }
                    if (sessCfg.tokenType && sessCfg.tokenValue) {
                        sessTypeToUse = SessConstants.AUTH_TYPE_TOKEN;
                    }
                    break;
                case SessConstants.AUTH_TYPE_BEARER:
                    if (sessCfg._authCache.authTypeToRequestToken) {
                        // you cannot use a token to retrieve a new token
                        continue;
                    }
                    if (sessCfg._authCache.availableCreds.tokenType) {
                        sessCfg.tokenType = sessCfg._authCache.availableCreds.tokenType;
                    }
                    if (sessCfg._authCache.availableCreds.tokenValue) {
                        sessCfg.tokenValue = sessCfg._authCache.availableCreds.tokenValue;
                    }
                    // a tokenValue with no tokenType implies a bearer token
                    if (!sessCfg.tokenType && sessCfg.tokenValue) {
                        sessTypeToUse = SessConstants.AUTH_TYPE_BEARER;
                    }
                    break;
                case SessConstants.AUTH_TYPE_CERT_PEM:
                    if (sessCfg._authCache.availableCreds[AuthOrder.SESS_CERT_NAME] &&
                        sessCfg._authCache.availableCreds[AuthOrder.SESS_CERT_KEY_NAME])
                    {
                        sessCfg[AuthOrder.SESS_CERT_NAME] = sessCfg._authCache.availableCreds[AuthOrder.SESS_CERT_NAME];
                        sessCfg[AuthOrder.SESS_CERT_KEY_NAME] = sessCfg._authCache.availableCreds[AuthOrder.SESS_CERT_KEY_NAME];
                        if (sessCfg._authCache.authTypeToRequestToken) {
                            // The existence of authTypeToRequestToken indicates that we want
                            // to request a token. We record how we will authenticate,
                            // but we still record the session type as token (old requirements).
                            sessCfg._authCache.authTypeToRequestToken = SessConstants.AUTH_TYPE_CERT_PEM;
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
                    errMsg = `sessCfg.authTypeOrder contains an invalid authentication = ${nextAuth}.`;
                    Logger.getImperativeLogger().error(errMsg);
                    throw new ImperativeError({ msg: errMsg });
            }
            if (sessTypeToUse !== null) {
                // stop looking for auth types after we find the first one
                break;
            }
        }

        if (sessTypeToUse === null) {
            // When no creds are in the session, record the auth type as none.
            sessCfg.type = SessConstants.AUTH_TYPE_NONE;

        } else {
            sessCfg.type = sessTypeToUse;
        }

        // remove all extra auth creds from the session
        AuthOrder.removeExtraCredsFromSess(sessCfg);
        Logger.getImperativeLogger().debug("Ending sessCfg = " + Censor.censorSession(sessCfg));
    }

    // ***********************************************************************
    /**
     * Cache the authOrder property from the supplied cmdArgs. If no authOrder exists
     * in cmdArgs, a default authOrder is created and cached.
     *
     * @param sessCfg - Modified.
     *      A session configuration object into which we store the auth cache.
     *
     * @param cmdArgs - Input.
     *      The set of arguments that the calling function is using.
     */
    private static cacheAuthOrder<SessCfgType extends ISession>(
        sessCfg: SessCfgType,
        cmdArgs: ICommandArguments
    ): void {
        // have we already cached an authOrder?
        if (sessCfg.authTypeOrder.length > 0) {
            // start over with an empty auth order.
            sessCfg.authTypeOrder = [];
        }

        sessCfg._authCache.didUserSetAuthOrder = false;
        if (cmdArgs.authOrder) {
            if (typeof cmdArgs.authOrder === "string") {
                if (cmdArgs.authOrder.length > 0) {
                    // user supplied an authOrder
                    // convert user's comma-separated string into an array of auth types, and remove whitespace
                    const userAuthOrder = cmdArgs.authOrder.split(',');
                    for (let nextUserAuth of userAuthOrder.map((val) => val.trim())) {
                        // validate each user-supplied type of authentication
                        switch (nextUserAuth) {
                            case SessConstants.AUTH_TYPE_BASIC:
                            case SessConstants.AUTH_TYPE_TOKEN:
                            case SessConstants.AUTH_TYPE_BEARER:
                            case SessConstants.AUTH_TYPE_CERT_PEM:
                            case SessConstants.AUTH_TYPE_NONE:
                                sessCfg.authTypeOrder.push(nextUserAuth);

                                // The user supplied an authOrder. Record that we used it.
                                sessCfg._authCache.didUserSetAuthOrder = true;
                                break;
                            default:
                                Logger.getImperativeLogger().error(
                                    `The authentication = '${nextUserAuth}' is not valid and will be ignored.`
                                );
                                break;
                        }
                    }
                }
            } else {
                Logger.getImperativeLogger().error(
                    `The authOrder option = '${cmdArgs.authOrder}' is not a valid authOrder string. A default authOrder will be used.`
                );
            }
        }

        if (sessCfg._authCache.didUserSetAuthOrder) {
            // remove any duplicates
            sessCfg.authTypeOrder = Array.from(new Set(sessCfg.authTypeOrder));
        } else {
            // fall back to a default authOrder
            AuthOrder.chooseDefaultAuthOrder(sessCfg);
        }
    }

    // ***********************************************************************
    /**
     * Cache the named credential into our cache of available credentials.
     *
     * @param sessCredName - Input.
     *      The name of a cred to be cached in a session.
     *
     * @param sessCfg - Modified.
     *      A session configuration object.
     *
     * @param cmdArgs - Input.
     *      The set of arguments with which the calling function is operating.
     */
    private static cacheCred<SessCfgType extends ISession>(
        sessCredName: string,
        sessCfg: SessCfgType,
        cmdArgs: ICommandArguments
    ): void {
        // cert-related properties have different names in command args and in a session
        const CMD_ARGS_CERT_NAME = "certFile";
        const CMD_ARGS_CERT_KEY_NAME = "certKeyFile";
        let cmdArgsCredName;

        if (sessCredName === AuthOrder.SESS_CERT_NAME) {
            cmdArgsCredName = CMD_ARGS_CERT_NAME;
        } else if (sessCredName === AuthOrder.SESS_CERT_KEY_NAME) {
            cmdArgsCredName = CMD_ARGS_CERT_KEY_NAME;
        } else {
            cmdArgsCredName = sessCredName;
        }

        if ((sessCfg as any)[sessCredName]) {
            sessCfg._authCache.availableCreds[sessCredName] = (sessCfg as any)[sessCredName];
        } else if (cmdArgs[cmdArgsCredName]) {
            sessCfg._authCache.availableCreds[sessCredName] = cmdArgs[cmdArgsCredName];
        }
    }

    // ***********************************************************************
    /**
     * Choose a default authentication order and place it into the session sessCfg.
     *
     * Other classes in the Zowe client API (like AbstractRestClient) call
     * cacheDefaultAuthOrder to specify the top default authentication type.
     * If so, we keep any topDefaultAuth that has already been set.
     *
     * If topDefaultAuth has NOT been set, we set basic authentication as the
     * topDefaultAuth.
     *
     * @param sessCfg - Modified.
     *      A session configuration object.
     */
    private static chooseDefaultAuthOrder<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): void {
        // when a user sets the auth order, we do not override that choice with a default.
        if (sessCfg._authCache.didUserSetAuthOrder) {
            return;
        }
        if (sessCfg._authCache.topDefaultAuth === undefined) {
            AuthOrder.cacheDefaultAuthOrder(sessCfg, SessConstants.AUTH_TYPE_BASIC);
        } else {
            AuthOrder.cacheDefaultAuthOrder(sessCfg, sessCfg._authCache.topDefaultAuth);
        }
    }

    // ***********************************************************************
    /**
     * Find the auth cache in the session config. If there is no cache
     * recorded in the session config, create a new auth cache entry.
     *
     * @param sessCfg - Input.
     *      A session configuration object into which we record any newly created cache.
     */
    private static findOrCreateAuthCache<SessCfgType extends ISession>(
        sessCfg: SessCfgType,
    ): void {
        // When the session config has no auth cache, we must create a
        // new auth cache in the session config.
        if (!sessCfg._authCache) {
            sessCfg._authCache = {
                availableCreds: {},
                didUserSetAuthOrder : false,
                topDefaultAuth: undefined
                // We purposely did not create authTypeToRequestToken.
                // That property is only set when a consumer of this class
                // calls makingRequestForToken().
            };
        }

        // if we do not have an auth order array, create an empty one.
        if (!sessCfg.authTypeOrder) {
            sessCfg.authTypeOrder = [];
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

    // ***********************************************************************
    /**
     * Remove all credential properties from the supplied session except for the
     * creds related to the session type specified within the sessCfg argument.
     *
     * @param sessCfg - Modified.
     *      Authentication credentials are removed from this session configuration.
     *
     * @throws {ImperativeError}
     *      If an invalid session type or an invalid authTypeToRequestToken is encountered.
     */
    private static removeExtraCredsFromSess<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): void {
        if (!sessCfg) {
            const errMsg = "The supplied session is null or undefined.";
            Logger.getImperativeLogger().error(errMsg);
            throw new ImperativeError({ msg: errMsg });
        }

        // Initially set all creds to be removed from the session.
        // Then delete from this set the creds that we want to keep.
        const credsToRemove = new Set(AuthOrder.ARRAY_OF_CREDS);

        // Select the creds that we want to keep.
        // If we have no type, it is because no creds were provided,
        // so we we have no creds to keep or remove.
        let errMsg: string;
        if (sessCfg.type) {
            switch (sessCfg.type) {
                case SessConstants.AUTH_TYPE_BASIC:
                    if (sessCfg.base64EncodedAuth) {
                        AuthOrder.keepCred("base64EncodedAuth", credsToRemove);
                        AuthOrder.keepCred("user", credsToRemove);
                        AuthOrder.keepCred("password", credsToRemove);
                    }
                    break;
                case SessConstants.AUTH_TYPE_TOKEN:
                    // in all cases we keep the supplied token type
                    AuthOrder.keepCred("tokenType", credsToRemove);

                    if (!sessCfg._authCache.authTypeToRequestToken) {
                        // we want to actually use the token, so keep its value
                        AuthOrder.keepCred("tokenValue", credsToRemove);
                    } else if (sessCfg._authCache.authTypeToRequestToken == SessConstants.AUTH_TYPE_BASIC) {
                        // We are requesting a token using basic creds.
                        // Keep our basic creds and allow tokenValue to be removed.
                        AuthOrder.keepCred("base64EncodedAuth", credsToRemove);
                        AuthOrder.keepCred("user", credsToRemove);
                        AuthOrder.keepCred("password", credsToRemove);
                    } else if (sessCfg._authCache.authTypeToRequestToken == SessConstants.AUTH_TYPE_CERT_PEM) {
                        // We are requesting a token using a cert.
                        // Keep the cert creds and allow tokenValue to be removed
                        AuthOrder.keepCred(AuthOrder.SESS_CERT_NAME, credsToRemove);
                        AuthOrder.keepCred(AuthOrder.SESS_CERT_KEY_NAME, credsToRemove);
                    } else {
                        // Our own code supplied a bad value for authTypeToRequestToken.
                        errMsg = "The requested session contains an invalid value for " +
                            `'authTypeToRequestToken' = ${sessCfg._authCache.authTypeToRequestToken}.`;
                        Logger.getImperativeLogger().error(errMsg);
                        throw new ImperativeError({ msg: errMsg });
                    }
                    break;
                case SessConstants.AUTH_TYPE_BEARER:
                    AuthOrder.keepCred("tokenValue", credsToRemove);
                    break;
                case SessConstants.AUTH_TYPE_CERT_PEM:
                    AuthOrder.keepCred(AuthOrder.SESS_CERT_NAME, credsToRemove);
                    AuthOrder.keepCred(AuthOrder.SESS_CERT_KEY_NAME, credsToRemove);
                    break;
                case SessConstants.AUTH_TYPE_NONE:
                    break;
                default:
                    // User's authOrder was validated. A wrong value now is due to our programming error.
                    errMsg = `The requested session contains an invalid value for 'type' = ${sessCfg.type}.`;
                    Logger.getImperativeLogger().error(errMsg);
                    throw new ImperativeError({ msg: errMsg });
            } // end switch

            // remove all auth creds from the session, except the creds related to the selected auth type
            const credIter = credsToRemove.values();
            let nextCredToRemove = credIter.next();
            while (!nextCredToRemove.done) {
                delete (sessCfg as any)[nextCredToRemove.value];
                nextCredToRemove = credIter.next();
            }
        } // end if we have a sessCfg.type
    }
}