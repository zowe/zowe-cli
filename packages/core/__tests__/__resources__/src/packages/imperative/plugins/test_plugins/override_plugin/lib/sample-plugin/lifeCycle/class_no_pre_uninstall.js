"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const imperative_1 = require("@zowe/core-for-zowe-sdk");

class PluginLifeCycle extends imperative_1.AbstractPluginLifeCycle {
    postInstall() {
        // postInstall is not used as part of this test class
    }

    // preUninstall is purposely missing
}

module.exports = PluginLifeCycle;