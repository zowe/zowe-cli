"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const imperative_1 = require("@zowe/imperative");

const unknownCredMgrDisplayName = "A CredMgr name that is not known";

class PluginLifeCycle extends imperative_1.AbstractPluginLifeCycle {
    postInstall() {
        imperative_1.CredentialManagerOverride.recordCredMgrInConfig(unknownCredMgrDisplayName);
    }
    preUninstall() {
        imperative_1.CredentialManagerOverride.recordDefaultCredMgrInConfig(unknownCredMgrDisplayName);
    }
}

module.exports = PluginLifeCycle;