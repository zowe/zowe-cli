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
exports.VsamCreateOptions = void 0;
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.CREATE.ACTIONS.VSAM.OPTIONS;
/**
 * Object containing all extra options to be used by the Create API
 */
exports.VsamCreateOptions = {
    /**
     * The volumes on which to allocate a VSAM cluster
     * @type {ICommandOptionDefinition}
     */
    volumes: {
        name: "volumes",
        aliases: ["v"],
        description: strings.VOLUMES,
        type: "string"
    },
    /**
     * The number of days for which the VSAM cluster will be retained.
     * @type {ICommandOptionDefinition}
     */
    retainFor: {
        name: "retain-for",
        aliases: ["rf"],
        description: strings.RETAINFOR,
        type: "number",
        conflictsWith: ["retain-to"]
    },
    /**
     * The number of days for which the VSAM cluster will be retained.
     * @type {ICommandOptionDefinition}
     */
    retainTo: {
        name: "retain-to",
        aliases: ["rt"],
        description: strings.RETAINTO,
        type: "string",
        conflictsWith: ["retain-for"]
    }
};
//# sourceMappingURL=vsam.options.js.map