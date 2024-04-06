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

describe("Event Emitter", () => {
    describe("Base structure and emission", () => {
        it("should be written to a file with all required properties in IImperativeEventJson", () => {});
        it("should write details to the correct event file", () => {});
        it("should not delete event files when unsubscribing", () => {});
    });

    describe("Shared Events", () => {
        it("should create an event file upon first subscription if the file does not exist", () => {});
        it("should trigger subscriptions for all instances watching for onCredentialManagerChanged", () => {});
        it("should not affect subscriptions from another instance when unsubscribing from events", () => {});
    });

    describe("User Events", () => {
        it("should create an event file upon first subscription if the file does not exist", () => {});
        it("should trigger subscriptions for all instances watching for onVaultChanged", () => {});
        it("should not affect subscriptions from another instance when unsubscribing from events", () => {});
    });

    describe("Custom Events", () => {
        it("should create an event file upon first subscription if the file does not exist", () => {});
        it("should trigger subscriptions for all instances watching for onMyCustomEvent", () => {});
        it("should not affect subscriptions from another instance when unsubscribing from events", () => {});
    });
});
