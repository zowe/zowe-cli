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

import * as SessConstants from "../SessConstants";

/**
 * A cache of authentication items that are created and maintained by
 * the Zowe client infrastructure within an ISession object.
 * Consuming applications should not modify the contents of an IAuthCache object.
 * @export
 * @interface IAuthCache
 */
export interface IAuthCache {
    /**
     * This property holds the set of all credentials that are available for
     * the REST request currently being processed.
     */
    availableCreds: {
        [credName: string]: string;
    }

    /**
     * Indicates whether the user has supplied the authentication order.
     */
    didUserSetAuthOrder: boolean;

    /**
     * Contains the authentication to be placed at the top of a default auth order.
     */
    topDefaultAuth: typeof SessConstants.AUTH_TYPE_BASIC | typeof SessConstants.AUTH_TYPE_TOKEN;

    /**
     * When present, authTypeToRequestToken indicates that we want to request a token.
     * It also tells us what type of authentication should be used to get that token.
     * AUTH_TYPE_NONE is an early placeholder (when needed), which Zowe API logic
     * automatically replaces with an appropriate value.
     * This property is only used during a login command. Otherwise, this property
     * is not placed into the cache.
     */
    authTypeToRequestToken?: typeof SessConstants.AUTH_TYPE_NONE |
    typeof SessConstants.AUTH_TYPE_BASIC |
    typeof SessConstants.AUTH_TYPE_CERT_PEM;
}
