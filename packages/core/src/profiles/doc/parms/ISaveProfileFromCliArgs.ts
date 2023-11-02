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

import { Arguments } from "yargs";

import { ISaveProfile } from "./ISaveProfile";

/**
 * Parameters for creating a profile from command line arguments - normally invoked from a command handler that
 * is pre-built by imperative.
 * @export
 * @interface ICreateProfileFromArgs
 */
export interface ISaveProfileFromCliArgs extends ISaveProfile {
    /**
     * The Yargs style arguments - supplied from the command invocation.
     * @type {Arguments}
     * @memberof ISaveProfileFromCliArgs
     */
    args?: Arguments;
}
