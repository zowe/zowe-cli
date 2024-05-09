"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const imperative_1 = require("@zowe/imperative");

class PluginLifeCycle extends imperative_1.AbstractPluginLifeCycle {
    // postInstall is purposely missing

    preUninstall() {
        // preUninstall is not used as part of this test class
    }
}

module.exports = PluginLifeCycle;