"use strict";
/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const imperative_1 = require("@zowe/core-for-zowe-sdk");
module.exports = class CredentialManagerOverrides extends imperative_1.AbstractCredentialManager {
    constructor(service, displayName) {
        super(service, displayName);
        this.consoleLog = imperative_1.Logger.getConsoleLogger();
        this.consoleLog.level = "info";
    }
    deleteCredentials(account) {
        return __awaiter(this, void 0, void 0, function* () {
            this.consoleLog.info("CredentialManager in sample-plugin is deleting:\n" +
                `    service = ${this.service}\n` +
                `    account = ${account}`);
        });
    }
    loadCredentials(account) {
        return __awaiter(this, void 0, void 0, function* () {
            this.consoleLog.info("CredentialManager in sample-plugin is loading:\n" +
                `    service = ${this.service}\n` +
                `    account = ${account}`);
            const loadedProfResult = {
                message: "Creds loaded from sample-plugin",
                type: "SomeTypeOfProfile",
                failNotFound: true
            };
            const loadResultString = JSON.stringify(loadedProfResult, null, 2);
            return Buffer.from(loadResultString).toString("base64");
        });
    }
    saveCredentials(account, credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            this.consoleLog.info("CredentialManager in sample-plugin is saving these creds:\n" +
                `    service     = ${this.service}\n` +
                `    account     = ${account}\n` +
                `    credentials = ${credentials.length * Math.random()}`);
        });
    }
};
//# sourceMappingURL=CredentialManager.override.js.map
