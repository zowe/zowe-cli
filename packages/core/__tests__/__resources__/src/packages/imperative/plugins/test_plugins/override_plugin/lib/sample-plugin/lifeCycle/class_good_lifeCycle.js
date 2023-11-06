"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const imperative_1 = require("@zowe/imperative");

const knownCredMgr = imperative_1.CredentialManagerOverride.getKnownCredMgrs()[1];
const credMgrDisplayName = knownCredMgr.credMgrDisplayName;

class PluginLifeCycle extends imperative_1.AbstractPluginLifeCycle {
    async postInstall() {
        return __awaiter(this, void 0, void 0, function* () {
            imperative_1.CredentialManagerOverride.recordCredMgrInConfig(credMgrDisplayName);
            imperative_1.Logger.getImperativeLogger().debug("The plugin did a post-install action");
        });
    }
    async preUninstall() {
        return __awaiter(this, void 0, void 0, function* () {
            imperative_1.CredentialManagerOverride.recordDefaultCredMgrInConfig(credMgrDisplayName);
            imperative_1.Logger.getImperativeLogger().debug("The plugin did a pre-uninstall action");
        });
    }
}

module.exports = PluginLifeCycle;