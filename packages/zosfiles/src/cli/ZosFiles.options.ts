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

import { ICommandOptionDefinition } from "@zowe/imperative";

import i18nTypings from "./-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("./-strings-/en").default as typeof i18nTypings).OPTIONS;

/**
 * Object containing all options to be used by the Download data set API
 */

export const ZosFilesOptions: { [key: string]: ICommandOptionDefinition } = {
    /**
     * The files timeout header value
     * @type {ICommandOptionDefinition}
     */
    responseTimeout: {
        name: "responseTimeout",
        aliases: ["rto"],
        description: strings.RESPONSETIMEOUT,
        type: "number",
        defaultValue: undefined,
        // tslint:disable-next-line: no-magic-numbers
        numericValueRange: [5, 600]
    }
}

export const ZosFilesOptionDefinitions: ICommandOptionDefinition[] = [
    ZosFilesOptions.responseTimeout
];
