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
exports.CopyDefinition = void 0;
const Ds_definition_1 = require("./ds/Ds.definition");
const Dsclp_definition_1 = require("./dsclp/Dsclp.definition");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../-strings-/en").default.COPY;
/**
 * This object defines the command for the copy group within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @private
 */
exports.CopyDefinition = {
    name: "copy",
    aliases: ["cp"],
    type: "group",
    description: strings.DESCRIPTION,
    children: [
        Ds_definition_1.DsDefinition,
        Dsclp_definition_1.DsclpDefinition
    ]
};
//# sourceMappingURL=Copy.definition.js.map