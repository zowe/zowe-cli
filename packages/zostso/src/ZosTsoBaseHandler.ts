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

import { ZosmfBaseHandler } from "../../zosmf/src/ZosmfBaseHandler";
import { IHandlerParameters } from "@zowe/imperative";
import { IStartTsoParms } from "./doc/input/IStartTsoParms";

export abstract class ZosTsoBaseHandler extends ZosmfBaseHandler {
    /**
     * The parameter object required to issue start commands
     * @type {IStartTsoParms}
     */
    protected mTsoStart: IStartTsoParms;

    /**
     * This will grab the arguments and create the tso parameter object for APIs before
     * invoking the actual TSO handler.
     * {@link ZosmfBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} params Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(params: IHandlerParameters) {

        // Populate the start parameters from the arguments
        this.mTsoStart = {
            logonProcedure: params.arguments.logonProcedure,
            characterSet: params.arguments.characterSet,
            codePage: params.arguments.codePage,
            rows: params.arguments.rows,
            columns: params.arguments.columns,
            account: params.arguments.account,
            regionSize: params.arguments.regionSize
        };

        // Call the super to invoke the handler and setup a zosmf session
        await super.process(params);
    }
}
