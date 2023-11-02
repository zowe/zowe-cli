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

import { IProfileManagerFactory } from "../../../../profiles/doc/api/IProfileManagerFactory";
import { Logger } from "../../../../logger/Logger";
import { ICommandDefinition } from "../../ICommandDefinition";
import { ICommandProfileTypeConfiguration } from "../definition/ICommandProfileTypeConfiguration";

/**
 * Control parameters for the command profile loader.
 * @export
 * @interface ICommandProfileLoaderParms
 */
export interface ICommandProfileLoaderParms {
    /**
     * The command definition document which contains the profile specifications for the command.
     * @type {ICommandDefinition}
     * @memberof ICommandProfileLoaderParms
     */
    commandDefinition: ICommandDefinition;
    /**
     * The profile Manager factory to create profile manager instances depending on the profile types required
     * by the command.
     * @type {IProfileManagerFactory<ICommandProfileTypeConfiguration>}
     * @memberof ICommandProfileLoaderParms
     */
    profileManagerFactory: IProfileManagerFactory<ICommandProfileTypeConfiguration>;
    /**
     * Optional logger instance - if not supplied, then Logger.getImperativeLogger() is used.
     * @type {Logger}
     * @memberof ICommandProfileLoaderParms
     */
    logger?: Logger;
}
