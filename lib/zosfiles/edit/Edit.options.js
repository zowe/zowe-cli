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
exports.EditOptions = void 0;
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.EDIT.OPTIONS;
/**
 * Object containing all options to be used by the Edit API
 */
exports.EditOptions = {
    /**
     * The option to set a default editor
     * @type {ICommandOptionDefinition}
     */
    editor: {
        name: "editor",
        aliases: ["ed"],
        description: strings.EDITOR,
        type: "string",
        required: false
    },
    extension: {
        name: "extension",
        aliases: ["ext"],
        description: strings.EXTENSION,
        type: "string",
        required: false
    },
};
//# sourceMappingURL=Edit.options.js.map