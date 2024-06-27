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

import { SetupTestEnvironment } from "../../../../__tests__/__src__/environment/SetupTestEnvironment";
import { ConfigUtils, EventCallback, EventOperator, EventProcessor, EventUtils, IEventJson, ZoweSharedEvents, ZoweUserEvents } from "../../..";
import * as fs from "fs";
import * as path from "path";
import { IExtendersJsonOpts } from "../../../config/src/doc/IExtenderOpts";

const zoweApp = "Zowe";
const sampleApps = ["firstSample", "secondSample"];
let testsEventDir: string;
let zoweCliHome: string;

describe("Event Operator and Processor", () => {
    const sharedEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
    const customUserEvent = "onCustomUserEvent";
    beforeAll(async () => {
        await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "ZOWE_CLI_HOME",
            testName: "event_operator_and_processor"
        });
        // have to reset because test environment doesn't add .zowe to ZOWE_CLI_HOME :(
        process.env.ZOWE_CLI_HOME = path.join(process.env.ZOWE_CLI_HOME || '', ".zowe");
        zoweCliHome  = process.env.ZOWE_CLI_HOME;
        EventUtils.ensureEventsDirExists(zoweCliHome);
        testsEventDir = path.join(zoweCliHome, '.events');
        const extJson: IExtendersJsonOpts = ConfigUtils.readExtendersJson();
        sampleApps.forEach(app => extJson.profileTypes[app] = { from: [app] });
        ConfigUtils.writeExtendersJson(extJson);
    });

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    // afterAll(() => {
    //     if (fs.existsSync(testsEventDir)) {
    //         fs.rmdirSync(testsEventDir, { recursive: true });
    //     }
// });
    describe("Zowe Events", () => {
        it("should create an event file upon first subscription if file does not exist", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const callback = jest.fn();
            const Watcher = EventOperator.getWatcher(zoweApp);
            const Emitter = EventOperator.getZoweProcessor();

            expect((Watcher as EventProcessor).subscribedEvents.get(sharedEvent)).toBeFalsy();

            // Subscribe to  event
            Watcher.subscribeShared(sharedEvent, callback);
            const eventDetails: IEventJson = (Watcher as any).subscribedEvents.get(sharedEvent).toJson();

            expect(callback).not.toHaveBeenCalled();
            expect(fs.existsSync(eventDetails.eventFilePath)).toBeTruthy();

            // Emit event and trigger callback
            Emitter.emitZoweEvent(sharedEvent);
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)()); // Mock event emission

            expect(eventDetails.eventName).toEqual(sharedEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();
            expect(callback).toHaveBeenCalled();
            EventOperator.deleteProcessor(zoweApp);
        });

        it("should trigger subscriptions for all instances watching for ZoweSharedEvent", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            // create two watchers watching the same app (Zowe)
            const firstWatcher = EventOperator.getWatcher();
            const secondWatcher = EventOperator.getWatcher();
            const Emitter = EventOperator.getZoweProcessor();

            const firstCallback: EventCallback = jest.fn() as EventCallback;
            const secondCallback: EventCallback = jest.fn() as EventCallback;

            expect((firstWatcher as EventProcessor).subscribedEvents.get(sharedEvent)).toBeFalsy();
            expect((secondWatcher as EventProcessor).subscribedEvents.get(sharedEvent)).toBeFalsy();

            // Subscribe to  event
            firstWatcher.subscribeShared(sharedEvent, firstCallback);
            secondWatcher.subscribeShared(sharedEvent, secondCallback);
            const firstEventDetails: IEventJson = (firstWatcher as any).subscribedEvents.get(sharedEvent).toJson();
            const secondEventDetails: IEventJson = (secondWatcher as any).subscribedEvents.get(sharedEvent).toJson();

            // Emit event and trigger callbacks
            Emitter.emitZoweEvent(sharedEvent);
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)());

            expect(firstEventDetails.eventName).toEqual(sharedEvent);
            expect(secondEventDetails.eventName).toEqual(sharedEvent);
            expect(EventUtils.isSharedEvent(firstEventDetails.eventName)).toBeTruthy();
            expect(EventUtils.isSharedEvent(secondEventDetails.eventName)).toBeTruthy();
            expect(firstCallback).toHaveBeenCalled();
            expect(secondCallback).toHaveBeenCalled();
            EventOperator.deleteProcessor(zoweApp);
        });

        it("should not affect subscriptions from another instance when unsubscribing from events", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            // create two watchers watching the same app (Zowe)
            // BUT because we are in the same process and can't actually simulate different processes,
            // need to fake out unsubscription of secondWatcher by watching for the same event on another app
            const firstWatcher = EventOperator.getWatcher();
            const secondWatcher = EventOperator.getWatcher(sampleApps[0]);
            const Emitter = EventOperator.getZoweProcessor();

            const firstCallback: EventCallback = jest.fn() as EventCallback;
            const secondCallback: EventCallback = jest.fn() as EventCallback;

            expect((firstWatcher as EventProcessor).subscribedEvents.get(sharedEvent)).toBeFalsy();
            expect((secondWatcher as EventProcessor).subscribedEvents.get(sharedEvent)).toBeFalsy();

            // Subscribe to  event
            firstWatcher.subscribeShared(sharedEvent, firstCallback);
            secondWatcher.subscribeShared(sharedEvent, secondCallback);
            const firstEventDetails: IEventJson = (firstWatcher as any).subscribedEvents.get(sharedEvent).toJson();
            const secondEventDetails: IEventJson = (secondWatcher as any).subscribedEvents.get(sharedEvent).toJson();

            secondWatcher.unsubscribe(sharedEvent);

            expect((firstWatcher as any).subscribedEvents.get(sharedEvent)).toBeTruthy();
            expect((secondWatcher as any).subscribedEvents.get(sharedEvent)).toBeFalsy();

            // Emit event and trigger callbacks
            Emitter.emitZoweEvent(sharedEvent);
            setupWatcherSpy.mock.calls.forEach(call => {
                if (call[0].appName === zoweApp) { (call[2] as Function)(); }
            });

            expect(firstCallback).toHaveBeenCalled();
            expect(secondCallback).not.toHaveBeenCalled();
            EventOperator.deleteProcessor(sampleApps[0]);
            EventOperator.deleteProcessor(zoweApp);
        });
    });

    describe("Custom Events ", () => {
        it("should create an event file upon first subscription if file does not exist - specific to CustomUserEvent directory structure", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const callback = jest.fn();
            const Watcher = EventOperator.getWatcher(sampleApps[1]);
            const Emitter = EventOperator.getEmitter(sampleApps[1]);
            const eventDir = path.join(zoweCliHome, ".events", sampleApps[1]); //corresponds to emitter's event file

            expect((Watcher as EventProcessor).subscribedEvents.get(customUserEvent)).toBeFalsy();

            // Subscribe to event
            Watcher.subscribeUser(customUserEvent, callback);
            const eventDetails: IEventJson = (Watcher as any).subscribedEvents.get(customUserEvent).toJson();
            expect(callback).not.toHaveBeenCalled();
            expect(fs.existsSync(eventDetails.eventFilePath)).toBeTruthy();

            // Emit event and trigger callback
            Emitter.emitEvent(customUserEvent);
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)());

            expect(eventDetails.eventName).toEqual(customUserEvent);
            expect(eventDetails.eventFilePath).toContain(eventDir);
            expect(callback).toHaveBeenCalled();
            expect(EventUtils.isUserEvent(eventDetails.eventName)).toBeFalsy(); //ensuring this custom event isnt a Zowe event
            EventOperator.deleteProcessor(sampleApps[1]);
        });
    });
});
