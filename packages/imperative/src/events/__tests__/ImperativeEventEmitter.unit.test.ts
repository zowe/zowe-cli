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
    let spyFsWriteFileSync: jest.SpyInstance;
    let allCallbacks: Function[];
    let removeAllListeners: jest.SpyInstance;
    let closeWatcher = jest.fn();

    beforeEach(() => {
        jest.restoreAllMocks();
        (iee as any).initialized = undefined;
        process.env["ZOWE_CLI_HOME"] = join(__dirname, ".zowe");
        jest.spyOn(fs, "existsSync").mockImplementation(jest.fn());
        jest.spyOn(fs, "mkdirSync").mockImplementation(jest.fn());
        jest.spyOn(fs, "openSync").mockImplementation(jest.fn());
        jest.spyOn(fs, "closeSync").mockImplementation(jest.fn());
        jest.spyOn(fs, "openSync").mockImplementation(jest.fn());
        spyFsWriteFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation(jest.fn());
        allCallbacks = [];
        removeAllListeners = jest.fn().mockReturnValue({ close: closeWatcher });
        jest.spyOn(fs, "watch").mockImplementation((_event: string | any, cb: Function | any) => {
            allCallbacks.push(cb);
            return { close: jest.fn(), removeAllListeners } as any;
        });
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
                } catch (err) {
                    caughtError = err;
                }
                expect(caughtError).toBeDefined();
                expect(caughtError.message).toContain(msg);
            };

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
                // Emit the event
                iee.instance[(isCustomEvent ? "emitCustomEvent" : "emitEvent")](theEvent);

                const dir = isUser ? userDir : sharedDir;
                expect(fs.existsSync).toHaveBeenCalledWith(dir);
                expect(fs.mkdirSync).toHaveBeenCalledWith(dir);
                expect(spyFsWriteFileSync.mock.calls[0][0]).toEqual(join(dir, theEvent));
                expect(JSON.parse(spyFsWriteFileSync.mock.calls[0][1])).toMatchObject({
                    type: theEvent,
                    user: isUser,
                    loc: dir,
                });
                spyFsWriteFileSync.mockClear();
            };

            processEvent(ImperativeUserEvents.ON_VAULT_CHANGED, true);
            processEvent(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED, false);
            processEvent("onSuperCustomEvent", false, true);
        });

        it("should fail to emit, subscribe or unsubscribe if the emitter has not been initialized", () => {
            const getError = (shouldThrow: any) => {
                let caughtError: any;
                try {
                    shouldThrow();
                } catch (err) {
                    caughtError = err;
                }
                return caughtError ?? { message: "THIS METHOD DID NOT THROW AN ERROR" };
            };

            const cbs = [
                // Emitting should fail if IEE is not initialized
                () => { iee.instance.emitEvent("dummy" as any); },
                () => { iee.instance.emitEvent(ImperativeUserEvents.ON_VAULT_CHANGED); },
                () => { iee.instance.emitEvent(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED); },
                () => { iee.instance.emitCustomEvent("dummy"); },
                () => { iee.instance.emitCustomEvent(ImperativeUserEvents.ON_VAULT_CHANGED); },
                () => { iee.instance.emitCustomEvent(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED); },

                // Subscribing should fail if IEE is not initialized
                () => { iee.instance.subscribe("dummy", jest.fn); },
                () => { iee.instance.subscribe(ImperativeUserEvents.ON_VAULT_CHANGED, jest.fn); },
                () => { iee.instance.subscribe(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED, jest.fn); },
                () => { iee.instance.unsubscribe("dummy"); },
                () => { iee.instance.unsubscribe(ImperativeUserEvents.ON_VAULT_CHANGED); },
                () => { iee.instance.unsubscribe(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED); },
            ];
            cbs.forEach(cb => {
                expect((getError(cb)).message).toContain("You must initialize the instance");
            });
        });

        it("should surface errors if unable to create event files or directories", () => {
            iee.initialize("zowe");

            jest.spyOn(fs, "mkdirSync").mockImplementationOnce(() => { throw "DIR"; });

            const theEvent = ImperativeUserEvents.ON_VAULT_CHANGED;
            try {
                iee.instance.subscribe(theEvent, jest.fn);
            } catch (err) {
                expect(err.message).toContain("Unable to create '.events' directory.");
            }
            expect(fs.existsSync).toHaveBeenCalledWith(userDir);
            expect(fs.mkdirSync).toHaveBeenCalledWith(userDir);

            jest.spyOn(fs, "closeSync").mockImplementation(() => { throw "FILE"; });

            try {
                iee.instance.subscribe(theEvent, jest.fn);
            } catch (err) {
                expect(err.message).toContain("Unable to create event file.");
            }
            expect(fs.existsSync).toHaveBeenCalledWith(join(userDir, theEvent));
            expect(fs.openSync).toHaveBeenCalledWith(join(userDir, theEvent), "w");
            expect(fs.closeSync).toHaveBeenCalled();
        });

        it("should subscribe even when the onEventFile or the events directory do not exist", () => {
            iee.initialize("zowe");
            expect(iee.instance.appName).toEqual("zowe");

            const processSubcription = (theEvent: any, isUser: boolean) => {
                const dir = isUser ? userDir : sharedDir;
                const cbSpy = jest.fn();
                iee.instance.subscribe(theEvent, cbSpy);

                // Ensure the directory is created
                expect(fs.existsSync).toHaveBeenCalledWith(dir);
                expect(fs.mkdirSync).toHaveBeenCalledWith(dir);

                // Ensure the file is created
                expect(fs.existsSync).toHaveBeenCalledWith(join(dir, theEvent));
                expect(fs.openSync).toHaveBeenCalledWith(join(dir, theEvent), "w");
                expect(fs.closeSync).toHaveBeenCalled();
            };

            processSubcription(ImperativeUserEvents.ON_VAULT_CHANGED, true);
            processSubcription(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED, false);
        });

        it("should trigger all callbacks when subscribed event is emitted", () => {
            jest.spyOn(ImperativeEventEmitter.prototype, "emitEvent").mockImplementation((theEvent: any) => {
                (iee.instance as any).subscriptions.get(theEvent)[1].forEach((cb: any) => cb());
            });
            jest.spyOn(fs, "readFileSync").mockReturnValue("{\"time\":\"123456\"}");

            iee.initialize("zowe");
            expect(iee.instance.appName).toEqual("zowe");

            const processEmission = (theEvent: any, isCustomEvent = false) => {
                const cbSpy = jest.fn().mockReturnValue("test");
                const numberOfCalls = Math.floor(Math.random() * 20);
                let i = numberOfCalls;
                while(i-- > 0) {
                    iee.instance.subscribe(theEvent, cbSpy);
                }

                iee.instance[(isCustomEvent ? "emitCustomEvent" : "emitEvent")](theEvent);
                expect(cbSpy).toHaveBeenCalledTimes(numberOfCalls);
            };

            processEmission(ImperativeUserEvents.ON_VAULT_CHANGED);
            processEmission(ImperativeSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED);
        });

        it("should unsubscribe from events successfully", () => {
            iee.initialize("zowe");

            const dummyMap = {
                has: () => (true),
                delete: jest.fn(),
                get: () => ([{ removeAllListeners }, jest.fn()])
            };
            // Mocked map of subscriptions
            (iee.instance as any).subscriptions = dummyMap;
            (iee.instance as any).eventTimes = dummyMap;

            iee.instance.unsubscribe("dummy");
            expect(closeWatcher).toHaveBeenCalled();
        });
    });
});
