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

import * as fs from "fs";
import { join } from "path";
import { homedir } from "os";
import { ImperativeEventEmitter, ImperativeSharedEvents, ImperativeUserEvents, Logger } from "../..";

describe("Event Emitter", () => {
    const iee = ImperativeEventEmitter;
    const sharedDir = join(__dirname, ".zowe", ".events");
    const userDir = join(homedir(), ".zowe", ".events");
    let fsWriteFileSync: jest.SpyInstance;

    beforeEach(() => {
        jest.restoreAllMocks();
        (iee as any).initialized = undefined;
        process.env["ZOWE_CLI_HOME"] = join(__dirname, ".zowe");
        jest.spyOn(fs, "existsSync").mockImplementation(jest.fn());
        jest.spyOn(fs, "mkdirSync").mockImplementation(jest.fn());
        fsWriteFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation(jest.fn());
    });

    describe("Base structure and emission", () => {
        it("should only allow for one instance of the event emitter", () => {
            jest.spyOn(Logger, "getImperativeLogger").mockReturnValue("the logger" as any);
            iee.initialize("test");
            let caughtError: any;
            try {
               iee.initialize("dummy");
            } catch (err) {
                caughtError = err;
            }
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain("Only one instance");
            expect(iee.instance.appName).toEqual("test");
            expect(iee.instance.logger).toEqual("the logger");
        });

        it("should determine the type of event", () => {
            iee.initialize("test");
            expect(iee.instance.isUserEvent("dummy")).toBe(false);
            expect(iee.instance.isUserEvent(ImperativeUserEvents.ON_VAULT_CHANGED)).toBe(true);
            expect(iee.instance.isSharedEvent("dummy")).toBe(false);
            expect(iee.instance.isSharedEvent(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED)).toBe(true);

            expect(iee.instance.isCustomEvent(ImperativeUserEvents.ON_VAULT_CHANGED)).toBe(false);
            expect(iee.instance.isCustomEvent(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED)).toBe(false);
            expect(iee.instance.isCustomEvent("dummy")).toBe(true);
        });

        it("should determine the correct directory based on the event", () => {
            iee.initialize("test");
            expect(iee.instance.getEventDir("dummy")).toEqual(sharedDir);
            expect(iee.instance.getEventDir(ImperativeUserEvents.ON_VAULT_CHANGED)).toEqual(userDir);
            expect(iee.instance.getEventDir(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED)).toEqual(sharedDir);
            delete process.env["ZOWE_CLI_HOME"];
        });

        it("should not allow all kinds of events to be emitted", () => {
            iee.initialize("zowe");
            expect(iee.instance.appName).toEqual("zowe");

            const processError = (eventType: string, msg: string, isCustomEvent = true) => {
                let caughtError: any;
                try {
                    iee.instance[(isCustomEvent ? "emitCustomEvent" : "emitEvent")](eventType as any);
                } catch(err) {
                    caughtError = err;
                }
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(msg);
            }

            const aMsg = "Unable to determine the type of event.";
            const bMsg = "Operation not allowed. Event is considered protected";

            // Application developers shouldn't be able to emit custom events from emitEvent, even though it is an internal method
            processError("dummy", aMsg, false);
            processError(ImperativeUserEvents.ON_VAULT_CHANGED, bMsg);
            processError(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED, bMsg);
        });

        it("should write to a file with all required properties in IImperativeEventJson to the correct location", () => {
            iee.initialize("zowe");
            expect(iee.instance.appName).toEqual("zowe");

            const processEvent = (theEvent: any, isUser: boolean, isCustomEvent = false) => {
                iee.instance[(isCustomEvent ? "emitCustomEvent" : "emitEvent")](theEvent);
                const dir = isUser ? userDir : sharedDir;
                expect(fs.existsSync).toHaveBeenCalledWith(dir);
                expect(fs.mkdirSync).toHaveBeenCalledWith(dir);
                expect(fsWriteFileSync.mock.calls[0][0]).toEqual(join(dir, theEvent));
                expect(JSON.parse(fsWriteFileSync.mock.calls[0][1])).toMatchObject({
                    type: theEvent,
                    user: isUser,
                    loc: dir,
                });
                fsWriteFileSync.mockClear();
            }

            processEvent(ImperativeUserEvents.ON_VAULT_CHANGED, true);
            processEvent(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED, false);
            processEvent("onSuperCustomEvent", false, true);
        });

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
