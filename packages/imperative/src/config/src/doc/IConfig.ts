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

import { IConfigProfile } from "./IConfigProfile";
import { ICredentialManagerOptions } from "../../../security/src/doc/ICredentialManagerOptions";

export interface IConfig {
    $schema?: string;
    defaults: { [key: string]: string };
    profiles: { [key: string]: IConfigProfile };
    autoStore?: boolean;
    plugins?: string[];
    /**
     * Options to pass to the credential manager when it is initialized.
     * Allows configuration of credential manager behavior without relying on environment variables.
     * The structure of options depends on the specific credential manager being used.
     * @type {ICredentialManagerOptions}
     */
    credentialManagerOptions?: ICredentialManagerOptions;
}
