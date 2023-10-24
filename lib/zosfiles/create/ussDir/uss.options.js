"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UssCreateOptions = void 0;
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.CREATE.ACTIONS.USSDIR.OPTIONS;
/**
 * Specifies the file or directory permission bits to be used in creating the file or directory.
 */
exports.UssCreateOptions = {
    /**
     * The permission bits for owner, group, and world users of the directory
     * @type {ICommandOptionDefinition}
     */
    mode: {
        name: "mode",
        aliases: ["m"],
        description: strings.MODE,
        type: "string",
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        stringLengthRange: [9, 9]
    }
};
//# sourceMappingURL=uss.options.js.map