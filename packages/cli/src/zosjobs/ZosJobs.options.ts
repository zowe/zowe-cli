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

import { ICommandOptionDefinition } from "@zowe/core-for-zowe-sdk";
import i18nTypings from "./-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const options = (require("./-strings-/en").default as typeof i18nTypings).OPTIONS;

export const ZosJobsOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The files timeout header value
     * @type {ICommandOptionDefinition}
     */

    modifyVersion: {
        name: "modify-version",
        description: options.MODIFY_VERSION,
        type: "string",
        required: false,
        defaultValue: "2.0"
    }
};