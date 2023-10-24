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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const imperative_1 = require("@zowe/imperative");
const ZosFilesBase_handler_1 = require("../../ZosFilesBase.handler");
/**
 * Handler to load a target profile.
 *
 * TODO Consider migrating code for loading target profiles to Imperative
 */
class TargetProfileHandler extends ZosFilesBase_handler_1.ZosFilesBaseHandler {
    /**
     * Build target z/OSMF session from profiles and command arguments.
     */
    process(params) {
        const _super = Object.create(null, {
            process: { get: () => super.process }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const targetProfileName = params.arguments.targetZosmfProfile;
            let targetCmdArgs = {};
            try {
                if (targetProfileName != null) {
                    if ((_a = imperative_1.ImperativeConfig.instance.config) === null || _a === void 0 ? void 0 : _a.exists) {
                        targetCmdArgs = imperative_1.ImperativeConfig.instance.config.api.profiles.get(targetProfileName);
                    }
                    else {
                        targetCmdArgs = params.profiles.get("zosmf", false, targetProfileName);
                    }
                }
                const targetPrefix = "target";
                for (const [k, v] of Object.entries(params.arguments)) {
                    if (k.startsWith(targetPrefix) && v != null) {
                        const normalizedOptName = k.charAt(targetPrefix.length).toLowerCase() + k.slice(targetPrefix.length + 1);
                        targetCmdArgs[normalizedOptName] = v;
                    }
                }
            }
            catch (err) {
                throw new imperative_1.ImperativeError({
                    msg: `Failed to load target z/OSMF profile: ${err.message}`,
                    causeErrors: err
                });
            }
            yield _super.process.call(this, Object.assign(Object.assign({}, params), { arguments: Object.assign(Object.assign({}, params.arguments), targetCmdArgs) }));
        });
    }
    /**
     * Return session config for target profile to pass on to the next handler.
     */
    processWithSession(_params, session) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                success: true,
                commandResponse: undefined,
                apiResponse: { sessCfg: session.ISession }
            };
        });
    }
}
exports.default = TargetProfileHandler;
//# sourceMappingURL=TargetProfile.handler.js.map