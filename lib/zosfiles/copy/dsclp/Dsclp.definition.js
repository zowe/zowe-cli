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
exports.DsclpDefinition = void 0;
const path_1 = require("path");
const imperative_1 = require("@zowe/imperative");
const zosmf_for_zowe_sdk_1 = require("@zowe/zosmf-for-zowe-sdk");
const ZosFiles_options_1 = require("../../ZosFiles.options");
// Does not use the import in anticipation of some internationalization work to be done later.
const strings = require("../../-strings-/en").default.COPY.ACTIONS.DATA_SET_CROSS_LPAR;
const TargetZosmfOptions = [
    {
        name: "target-host",
        aliases: ["th"],
        description: strings.OPTIONS.TARGETHOST,
        type: "string"
    },
    {
        name: "target-port",
        aliases: ["tp"],
        description: strings.OPTIONS.TARGETPORT,
        type: "number"
    },
    {
        name: "target-user",
        aliases: ["tu"],
        description: strings.OPTIONS.TARGETUSER,
        type: "string"
    },
    {
        name: "target-password",
        aliases: ["tpw"],
        description: strings.OPTIONS.TARGETPASS,
        type: "string"
    },
    {
        name: "target-token-type",
        aliases: ["ttt"],
        description: strings.OPTIONS.TARGETTOKENTYPE,
        type: "string"
    },
    {
        name: "target-token-value",
        aliases: ["ttv"],
        description: strings.OPTIONS.TARGETTOKENVAL,
        type: "string"
    },
    {
        name: "target-zosmf-profile",
        aliases: ["t-zosmf-p", "target-zosmf-p"],
        description: strings.OPTIONS.TARGETPROFILE,
        type: "string"
    }
];
const GeneralOptions = [
    {
        name: "replace",
        aliases: ["rep"],
        description: strings.OPTIONS.REPLACE,
        type: "boolean"
    },
    {
        name: "target-volume-serial",
        aliases: ["tvs", "target-volser"],
        description: strings.OPTIONS.TARGETVOLSER,
        type: "string"
    },
    {
        name: "target-management-class",
        aliases: ["tmc"],
        description: strings.OPTIONS.TARGETMGTCLS,
        type: "string"
    },
    {
        name: "target-data-class",
        aliases: ["tdc"],
        description: strings.OPTIONS.TARGETDATACLS,
        type: "string"
    },
    {
        name: "target-storage-class",
        aliases: ["tsc"],
        description: strings.OPTIONS.TARGETSTGCLS,
        type: "string"
    }
];
const Positionals = [
    {
        name: "fromDataSetName",
        type: "string",
        description: strings.POSITIONALS.FROMDSNAME,
        required: true
    },
    {
        name: "toDataSetName",
        type: "string",
        description: strings.POSITIONALS.TODSNAME,
        required: true
    }
];
function buildChainedHandlerArgMapping(optionDefs) {
    return optionDefs.map((optionDef) => ({
        from: optionDef.name,
        to: imperative_1.CliUtils.getOptionFormat(optionDef.name).camelCase,
        mapFromArguments: true,
        applyToHandlers: [0],
        optional: !optionDef.required
    }));
}
/**
 * This object defines the command for copy data-set within zosfiles. This is not
 * something that is intended to be used outside of the zosfiles package.
 *
 * @type {ICommandDefinition}
 */
exports.DsclpDefinition = {
    name: "data-set-cross-lpar",
    aliases: ["dsclp"],
    description: strings.DESCRIPTION,
    type: "command",
    chainedHandlers: [
        {
            handler: (0, path_1.join)(__dirname, "TargetProfile.handler"),
            mapping: [
                ...buildChainedHandlerArgMapping(zosmf_for_zowe_sdk_1.ZosmfSession.ZOSMF_CONNECTION_OPTIONS),
                ...buildChainedHandlerArgMapping(TargetZosmfOptions),
                {
                    from: "apiResponse.sessCfg",
                    to: "targetZosmfSession"
                }
            ]
        },
        {
            handler: (0, path_1.join)(__dirname, "Dsclp.handler"),
            mapping: [
                ...buildChainedHandlerArgMapping(Positionals),
                ...buildChainedHandlerArgMapping(zosmf_for_zowe_sdk_1.ZosmfSession.ZOSMF_CONNECTION_OPTIONS),
                ...buildChainedHandlerArgMapping(ZosFiles_options_1.ZosFilesOptionDefinitions),
                ...buildChainedHandlerArgMapping(GeneralOptions)
            ]
        }
    ],
    profile: {
        optional: ["zosmf"]
    },
    positionals: Positionals,
    options: [
        ...TargetZosmfOptions,
        ...GeneralOptions,
        {
            name: "target-zosmf-session",
            description: "Session configuration for target z/OSMF profile",
            type: "json",
            hidden: true
        }
    ].sort((a, b) => a.name.localeCompare(b.name)),
    examples: [
        {
            description: strings.EXAMPLES.EX1,
            options: `"USER.FROM.SET" "USER.TO.SET" --target-zosmf-p SYS1`
        },
        {
            description: strings.EXAMPLES.EX2,
            options: `"USER.FROM.SET(mem1)" "USER.TO.SET(mem2)" --target-zosmf-p SYS1`
        },
        {
            description: strings.EXAMPLES.EX3,
            options: `"USER.FROM.SET" "USER.TO.SET(mem2)" --target-zosmf-p SYS1`
        },
        {
            description: strings.EXAMPLES.EX4,
            options: `"USER.FROM.SET(mem1)" "USER.TO.SET" --target-host sys1.com --target-user user1 --target-password pass1`
        }
    ]
};
//# sourceMappingURL=Dsclp.definition.js.map