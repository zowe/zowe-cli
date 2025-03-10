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
 * Structure for a cache of the available credentials and the authentication order
 * which are applicable for a given session.
 *
 * The combination of profile and command arguments provide the set of creds
 * and authentication order to be cached.
 */
interface AuthForSession {
    /**
     * This property holds the set of all credentials that are available for
     * the REST request currently being processed.
     */
    availableCreds: {
        [credName: string]: string;
    }

    /**
     * This array of authentication types specifies the order of preferred
     * authentication. It contains the user-specified order, or a default order
     * if the user does not specify an order. authOrder[0] is the highest
     * preferred authentication.
     */
    authOrder: SessConstants.AUTH_TYPE_CHOICES[];

    /**
     * Indicates whether the user has supplied the authentication order.
     */
    didUserSetAuthOrder: boolean;

    /**
     * Contains the authentication to be placed at the top of a default auth order.
     */
    topDefaultAuth: typeof SessConstants.AUTH_TYPE_BASIC | typeof SessConstants.AUTH_TYPE_TOKEN;
}

/**
 * The set of creds and authentication order for each created session.
 * The key for each cached item is the time at which the item was cached.
 * Time is used to differentiate among asynchronous operations that may
 * be performed against different profiles.
 */
interface AuthCache {
    [timeCached: number]: AuthForSession
}

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

    /**
     * Our cache of creds and authentication orders.
     */
    private static m_authCache: AuthCache = {};


    // ***********************************************************************
    /**
     * Cache all of the credentials that are available in either the supplied
     * sessCfg object or in the supplied command arguments. Also cache the
     * authOrder that is specified in the supplied command arguments.
     *
     * Downstream logic uses this cache to determine which auth type should be
     * used in the final session used by a client REST request.
     *
     * @internal - Cannot be used outside of the imperative package
     *
     * @param sessCfg - Input.
     *      A session configuration object to which we associate the cached creds.
     *
     * @param cmdArgs - Input.
     *      The set of arguments with which the calling function is operating.
     *      For CLI, the cmdArgs come from the command line, profile, or
     *      environment. Other apps can place relevant arguments into this
     *      object to be processed by this function.
     */
    public static cacheCredsAndAuthOrder<SessCfgType extends ISession>(
        sessCfg: SessCfgType,
        cmdArgs: ICommandArguments
    ): void {
        // create a new item in the cache (as needed) and record its key into the session config
        AuthOrder.findOrCreateAuthCacheItem(sessCfg);

        // add any discovered authOrder to the cache
        AuthOrder.cacheAuthOrder(sessCfg, cmdArgs);

        // add every available cred to the cache
        AuthOrder.cacheCred("user", sessCfg, cmdArgs);
        AuthOrder.cacheCred("password", sessCfg, cmdArgs);
        AuthOrder.cacheCred("base64EncodedAuth", sessCfg, cmdArgs);
        AuthOrder.cacheCred("tokenType", sessCfg, cmdArgs);
        AuthOrder.cacheCred("tokenValue", sessCfg, cmdArgs);
        AuthOrder.cacheCred("certFile", sessCfg, cmdArgs);
        AuthOrder.cacheCred("certKeyFile", sessCfg, cmdArgs);

        Logger.getImperativeLogger().debug(`Newly defined auth cache at ${sessCfg.timeOfAuthCacheItem} = ` +
            JSON.stringify(AuthOrder.m_authCache[sessCfg.timeOfAuthCacheItem], null, 2)
        );
    }

    // ***********************************************************************
    /**
     * Cache the default authentication order to be used when the user has not
     * specified the order.
     *
     * For historical reason, we have 2 default orders. Thus, the caller can
     * specify which of 2 creds to use as the top cred in the authentication order:
     *     SessConstants.AUTH_TYPE_BASIC or SessConstants.AUTH_TYPE_TOKEN
     *
     * @internal - Cannot be used outside of the imperative package
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
        // create a new item in the cache (as needed) and record its key into the session config
        AuthOrder.findOrCreateAuthCacheItem(sessCfg);

        const authForSession: AuthForSession = AuthOrder.m_authCache[sessCfg.timeOfAuthCacheItem];
        if (authForSession.didUserSetAuthOrder) {
            // nobody can change what the user specified
            Logger.getImperativeLogger().info(
                `Because user set authOrder, an attempt to put ${topDefaultAuth} at the top of the order was ignored.`
            );
            return false;
        }

        // record the top auth that was requested for use in the default order
        authForSession.topDefaultAuth = topDefaultAuth;

        // start over with an empty auth order.
        authForSession.authOrder = [];

        if (authForSession.topDefaultAuth === SessConstants.AUTH_TYPE_BASIC) {
            // we want user & password auth as the top choice
            authForSession.authOrder.push(SessConstants.AUTH_TYPE_BASIC);
            authForSession.authOrder.push(SessConstants.AUTH_TYPE_TOKEN);
        } else {
            // we want token auth as the top choice
            authForSession.authOrder.push(SessConstants.AUTH_TYPE_TOKEN);
            authForSession.authOrder.push(SessConstants.AUTH_TYPE_BASIC);
        }
        // add remaining auth types. We do not include 'none' in our defaults.
        authForSession.authOrder.push(SessConstants.AUTH_TYPE_BEARER);
        authForSession.authOrder.push(SessConstants.AUTH_TYPE_CERT_PEM);

        return true;
    }

    // ***********************************************************************
    /**
     * Clears the authentication cache.
     *
     * To get the right creds and auth order in your session after calling this
     * function you must once again call the appropriate sequence of:
     *      AuthOrder.cacheCredsAndAuthOrder
     *      AuthOrder.cacheDefaultAuthOrder
     *      AuthOrder.putTopAuthInSession
     *
     * @internal - Cannot be used outside of the imperative package
     */
    public static clearAuthCache(): void {
        AuthOrder.m_authCache = {};
    }

    // ***********************************************************************
    /**
     * Returns the cached authentication order.
     *
     * @internal - Cannot be used outside of the imperative package
     *
     * @return {SessConstants.AUTH_TYPE_CHOICES[]} The cached authentication order.
     * @throws {ImperativeError} If the authentication order has not been cached yet.
     */
    public static getAuthOrder<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): SessConstants.AUTH_TYPE_CHOICES[] {
        // find auth item in the cache for the supplied session config
        AuthOrder.findOrCreateAuthCacheItem(sessCfg);

        const authForSession: AuthForSession = AuthOrder.m_authCache[sessCfg.timeOfAuthCacheItem];
        if (authForSession.authOrder.length === 0) {
            const errMsg = "cacheAuthOrder() must be called before calling getAuthOrder().";
            Logger.getImperativeLogger().error(errMsg);
            throw new ImperativeError({ msg: errMsg });
        }

        return authForSession.authOrder;
    }

    // ***********************************************************************
    /**
     * Find the highest auth type (according to the authOrder) which exists
     * in either the supplied session config or command line arguments.
     * Then place the credentials associated with that auth type into the
     * supplied session config. Credentials for all other auth types are
     * removed from the session config.
     *
     * @internal - Cannot be used outside of the imperative package
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
        sessCfg: SessCfgType
    ): void {
        // find auth item in the cache for the supplied session config
        AuthOrder.findOrCreateAuthCacheItem(sessCfg);

        const authForSession: AuthForSession = AuthOrder.m_authCache[sessCfg.timeOfAuthCacheItem];
        if (authForSession.authOrder.length === 0) {
            const errMsg = "cacheAuthOrder() must be called before calling putTopAuthInSession().";
            Logger.getImperativeLogger().error(errMsg);
            throw new ImperativeError({ msg: errMsg });
        }

        let sessTypeToUse: SessConstants.AUTH_TYPE_CHOICES = null;

        Logger.getImperativeLogger().debug("AuthOrder.m_availableCreds = " +
            JSON.stringify(authForSession.availableCreds, null, 2)
        );
        Logger.getImperativeLogger().debug("Starting sessCfg = " + JSON.stringify(sessCfg, null, 2));

        // Detect the first auth type (from our auth order) from our cache of credentials.
        // Ensure that the auth properties are placed in the session config.
        // Record the detected auth type for use as the session type.
        let errMsg: string;
        for (const nextAuth of authForSession.authOrder) {
            switch (nextAuth) {
                case SessConstants.AUTH_TYPE_BASIC:
                    if (authForSession.availableCreds.user && authForSession.availableCreds.password) {
                        sessCfg.user = authForSession.availableCreds.user;
                        sessCfg.password = authForSession.availableCreds.password;
                        // always regenerate b64Auth in case it is out-of date with user & password
                        sessCfg.base64EncodedAuth = Buffer.from(sessCfg.user + ":" + sessCfg.password).toString("base64")
                        sessTypeToUse = SessConstants.AUTH_TYPE_BASIC;
                    } else if (authForSession.availableCreds.base64EncodedAuth) {
                        sessCfg.base64EncodedAuth = authForSession.availableCreds.base64EncodedAuth;
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
                    if (authForSession.availableCreds.tokenType) {
                        sessCfg.tokenType = authForSession.availableCreds.tokenType;
                    }
                    if (authForSession.availableCreds.tokenValue) {
                        sessCfg.tokenValue = authForSession.availableCreds.tokenValue;
                    }
                    if (sessCfg.tokenType && sessCfg.tokenValue) {
                        sessTypeToUse = SessConstants.AUTH_TYPE_TOKEN;
                    }
                    break;
                case SessConstants.AUTH_TYPE_BEARER:
                    if (sessCfg.authTypeToRequestToken) {
                        // you cannot use a token to retrieve a new token
                        continue;
                    }
                    if (authForSession.availableCreds.tokenType) {
                        sessCfg.tokenType = authForSession.availableCreds.tokenType;
                    }
                    if (authForSession.availableCreds.tokenValue) {
                        sessCfg.tokenValue = authForSession.availableCreds.tokenValue;
                    }
                    // a tokenValue with no tokenType implies a bearer token
                    if (!sessCfg.tokenType && sessCfg.tokenValue) {
                        sessTypeToUse = SessConstants.AUTH_TYPE_BEARER;
                    }
                    break;
                case SessConstants.AUTH_TYPE_CERT_PEM:
                    if (authForSession.availableCreds.certFile && authForSession.availableCreds.certKeyFile) {
                        sessCfg.cert = authForSession.availableCreds.certFile;
                        sessCfg.certKey = authForSession.availableCreds.certKeyFile;
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
        sessCfg.authTypeOrder = [...authForSession.authOrder];

        Logger.getImperativeLogger().debug("Ending sessCfg = " + JSON.stringify(sessCfg, null, 2));
    }

    // ***********************************************************************
    /**
     * Cache the authOrder property from the supplied cmdArgs. If no authOrder exists
     * in cmdArgs, a default authOrder is created and cached.
     *
     * @param sessCfg - Input.
     *      A session configuration object containing a timeOfNewAuthCacheItem,
     *      which is the key into the auth cache.
     *
     * @param cmdArgs - Input.
     *      The set of arguments that the calling function is using.
     */
    private static cacheAuthOrder<SessCfgType extends ISession>(
        sessCfg: SessCfgType,
        cmdArgs: ICommandArguments
    ): void {
        // have we already cached the authOrder?
        const authForSession: AuthForSession = AuthOrder.m_authCache[sessCfg.timeOfAuthCacheItem];
        if (authForSession.authOrder.length > 0) {
            // start over with an empty auth order.
            authForSession.authOrder = [];
        }

        authForSession.didUserSetAuthOrder = false;
        if (cmdArgs.authOrder) {
            if (typeof cmdArgs.authOrder === "string") {
                if (cmdArgs.authOrder.length > 0) {
                    // user supplied an authOrder
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
                                authForSession.authOrder.push(nextUserAuth);
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
                    `The authOrder option = '${cmdArgs.authOrder}' is not a a valid authOrder string. A default authOrder will be used.`
                );
            }
        }

        if (authForSession.authOrder.length === 0) {
            // fall back to a default authOrder
            AuthOrder.cacheDefaultAuthOrder(sessCfg, authForSession.topDefaultAuth);
            return;
        }

        // The user supplied an authOrder. Record that we used it.
        authForSession.didUserSetAuthOrder = true;

        // remove any duplicates
        authForSession.authOrder = Array.from(new Set(authForSession.authOrder));
    }

    // ***********************************************************************
    /**
     * Cache the named credential into our cache of available credentials.
     *
     * @param credName - Input.
     *
     * @param sessCfg - Input.
     *      A session configuration object.
     *
     * @param cmdArgs - Input.
     *      The set of arguments with which the calling function is operating.
     *      For CLI, the cmdArgs come from the command line, profile, or
     *      environment. Other apps can place relevant arguments into this
     *      object to be processed by this function.
     */
    private static cacheCred<SessCfgType extends ISession>(
        credName: string,
        sessCfg: SessCfgType,
        cmdArgs: ICommandArguments
    ): void {
        const authForSession: AuthForSession = AuthOrder.m_authCache[sessCfg.timeOfAuthCacheItem];

        if ((sessCfg as any)[credName]) {
            authForSession.availableCreds[credName] = (sessCfg as any)[credName];
        } else if (cmdArgs[credName]) {
            authForSession.availableCreds[credName] = cmdArgs[credName];
        }
    }

    // ***********************************************************************
    /**
     * Find the auth cache item associated with an existing entry in the
     * session config. If there is no item recorded in the session config,
     * create a new auth cache entry and record it in the session. The
     * property within the session to identify the auth cache item is the
     * time at which the new auth cache item is created.
     *
     * @param sessCfg - Input.
     *      A session configuration object into which we record any newly created cache.
     */
    private static findOrCreateAuthCacheItem<SessCfgType extends ISession>(
        sessCfg: SessCfgType,
    ): void {
        // When the session config has no timestamp key into the cache,
        // or that key does not exist in the cache, then we must create a
        // new item in the cache and store its key into the session.
        if (!sessCfg.timeOfAuthCacheItem || !AuthOrder.m_authCache[sessCfg.timeOfAuthCacheItem]) {
            // create a new item in the cache
            const timeOfNewAuthCacheItem = new Date().getTime();
            AuthOrder.m_authCache[timeOfNewAuthCacheItem] = {
                availableCreds: {},
                authOrder: [],
                didUserSetAuthOrder : false,
                topDefaultAuth: SessConstants.AUTH_TYPE_BASIC
            }

            // record the key for the cached item into the session config
            sessCfg.timeOfAuthCacheItem = timeOfNewAuthCacheItem;
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
     */
    private static removeExtraCredsFromSess<SessCfgType extends ISession>(
        sessCfg: SessCfgType
    ): void {
        if (AuthOrder.m_authCache[sessCfg.timeOfAuthCacheItem].authOrder.length === 0) {
            const errMsg = "AuthOrder.cacheAuthOrder must be called before AuthOrder.removeExtraCredsFromSess";
            Logger.getImperativeLogger().error(errMsg);
            throw new ImperativeError({ msg: errMsg });
        }

        // Initially set all creds to be removed from the session.
        // Then delete from this set the creds that we want to keep.
        const credsToRemove = new Set(["user", "password", "base64EncodedAuth", "tokenType", "tokenValue", "cert", "certKey"]);

        // Select the creds that we want to keep.
        // If we have no type, it is because we had no creds,
        // so we we have no creds to keep or remove.
        let errMsg: string;
        if (sessCfg?.type) {
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

                    if (!sessCfg.authTypeToRequestToken) {
                        // we want to actually use the token, so keep its value
                        AuthOrder.keepCred("tokenValue", credsToRemove);
                    } else if (sessCfg.authTypeToRequestToken == SessConstants.AUTH_TYPE_BASIC) {
                        // We are requesting a token using basic creds.
                        // Keep our basic creds and allow tokenValue to be removed.
                        AuthOrder.keepCred("base64EncodedAuth", credsToRemove);
                        AuthOrder.keepCred("user", credsToRemove);
                        AuthOrder.keepCred("password", credsToRemove);
                    } else if (sessCfg.authTypeToRequestToken == SessConstants.AUTH_TYPE_CERT_PEM) {
                        // We are requesting a token using a cert.
                        // Keep the cert creds and allow tokenValue to be removed
                        AuthOrder.keepCred("cert", credsToRemove);
                        AuthOrder.keepCred("certKey", credsToRemove);
                    } else {
                        // Our own code supplied a bad value for authTypeToRequestToken.
                        errMsg = "The requested session contains an invalid value for " +
                            `'authTypeToRequestToken' = ${sessCfg.authTypeToRequestToken}.`;
                        Logger.getImperativeLogger().error(errMsg);
                        throw new ImperativeError({ msg: errMsg });
                    }
                    break;
                case SessConstants.AUTH_TYPE_BEARER:
                    AuthOrder.keepCred("tokenValue", credsToRemove);
                    break;
                case SessConstants.AUTH_TYPE_CERT_PEM:
                    AuthOrder.keepCred("cert", credsToRemove);
                    AuthOrder.keepCred("certKey", credsToRemove);
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