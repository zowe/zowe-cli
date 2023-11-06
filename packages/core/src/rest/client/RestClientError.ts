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

import { ImperativeError } from "../../error/ImperativeError";
import { IRestClientError } from "./doc/IRestClientError";
import { IImperativeErrorParms } from "../../error/doc/IImperativeErrorParms";

export class RestClientError extends ImperativeError {
    /**
     * Creates an instance of RestClientError.
     * @param {IRestClientError} mDetails - The IRestClientError details provided by the rest client. Contains
     *                                      "relevant" diagnostic information such as host/port/request details, etc.
     * @param {IImperativeErrorParms} [parms] - Imperative error parameters.
     */
    constructor(public mDetails: IRestClientError, parms?: IImperativeErrorParms) {
        super(mDetails, parms);
    }

    /**
     * Accessor for IRestClientError error details.
     * @type {IRestClientError}
     */
    public get details(): IRestClientError {
        return this.mDetails;
    }
}
