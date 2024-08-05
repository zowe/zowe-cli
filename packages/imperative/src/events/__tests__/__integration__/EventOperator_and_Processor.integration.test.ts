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
import { ConfigUtils, EventCallback, EventOperator, EventProcessor, EventUtils, IEventJson, ZoweSharedEvents } from "../../..";
import * as fs from "fs";
import * as path from "path";
import { IExtendersJsonOpts } from "../../../config/src/doc/IExtenderOpts";

const zoweApp = "Zowe";
const sampleApps = ["firstApp", "secondApp"];
let zoweCliHome: string;

/**
 * ## Understanding Event Files
 * |  Zowe Event Dir  | <...>/.zowe/.events/Zowe/<zoweEventName>
 * | Custom Event Dir | <...>/.zowe/.events/custApp/<custEventName>
 *
 * ## Understanding Event Types
 * - **Shared Events**: Zowe events that when triggered, notify all subscribed users.
 * - **User Events**: Zowe events that are specific to a particular user or session.
 * - **Custom Events**: Applications can define their own shared and user events.
*/
describe("Event Operator and Processor", () => {
    const sharedZoweEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
    const customUserEvent = "onCustomUserEvent";
    beforeAll(async () => {
        await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "ZOWE_CLI_HOME",
            testName: "event_operator_and_processor"
        });
        // have to reset because test environment doesn't add .zowe to ZOWE_CLI_HOME :(
        process.env.ZOWE_CLI_HOME = path.join(process.env.ZOWE_CLI_HOME || '', ".zowe");
        zoweCliHome = process.env.ZOWE_CLI_HOME;
        EventUtils.ensureEventsDirExists(zoweCliHome);
        const extJson: IExtendersJsonOpts = ConfigUtils.readExtendersJson();
        sampleApps.forEach(app => {
            extJson.profileTypes[app] = { from: [app] };
        });
        ConfigUtils.writeExtendersJson(extJson);
    });

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe("Zowe Events", () => {
        it("should create an event file upon first subscription if file does not exist", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const callback = jest.fn();
            const Watcher = EventOperator.getWatcher(zoweApp);
            const Emitter = EventOperator.getZoweProcessor();

            expect((Watcher as EventProcessor).subscribedEvents.get(sharedZoweEvent)).toBeFalsy();

            // Subscribe to  event
            Watcher.subscribeShared(sharedZoweEvent, callback);
            const eventDetails: IEventJson = (Watcher as any).subscribedEvents.get(sharedZoweEvent).toJson();

            expect(callback).not.toHaveBeenCalled();
            expect(fs.existsSync(eventDetails.eventFilePath)).toBeTruthy();

            // Emit event and trigger callback
            Emitter.emitZoweEvent(sharedZoweEvent);
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)()); // Mock event emission

            expect(eventDetails.eventName).toEqual(sharedZoweEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();
            expect(callback).toHaveBeenCalled();
            EventOperator.deleteProcessor(zoweApp);
        });

        it("should trigger subscriptions for all instances watching for ZoweSharedEvent", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            // create two watchers watching the same app (Zowe - default)
            const firstWatcher = EventOperator.getWatcher();
            const secondWatcher = EventOperator.getWatcher();
            const Emitter = EventOperator.getZoweProcessor();

            const firstCallback: EventCallback = jest.fn() as EventCallback;
            const secondCallback: EventCallback = jest.fn() as EventCallback;

            // We expect no subscriptions yet
            expect((firstWatcher as EventProcessor).subscribedEvents.get(sharedZoweEvent)).toBeFalsy();
            expect((secondWatcher as EventProcessor).subscribedEvents.get(sharedZoweEvent)).toBeFalsy();

            // Subscribe to  event
            firstWatcher.subscribeShared(sharedZoweEvent, firstCallback);
            secondWatcher.subscribeShared(sharedZoweEvent, secondCallback);
            const firstEventDetails: IEventJson = (firstWatcher as any).subscribedEvents.get(sharedZoweEvent).toJson();
            const secondEventDetails: IEventJson = (secondWatcher as any).subscribedEvents.get(sharedZoweEvent).toJson();

            // Emit event and trigger callbacks
            Emitter.emitZoweEvent(sharedZoweEvent);
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)());

            expect(firstEventDetails.eventName).toEqual(sharedZoweEvent);
            expect(secondEventDetails.eventName).toEqual(sharedZoweEvent);
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

            expect((firstWatcher as EventProcessor).subscribedEvents.get(sharedZoweEvent)).toBeFalsy();
            expect((secondWatcher as EventProcessor).subscribedEvents.get(sharedZoweEvent)).toBeFalsy();

            // Subscribe to  event
            firstWatcher.subscribeShared(sharedZoweEvent, firstCallback);
            secondWatcher.subscribeShared(sharedZoweEvent, secondCallback);

            // unsubscribe!
            secondWatcher.unsubscribe(sharedZoweEvent);

            expect((firstWatcher as any).subscribedEvents.get(sharedZoweEvent)).toBeTruthy();
            expect((secondWatcher as any).subscribedEvents.get(sharedZoweEvent)).toBeFalsy();

            // Emit event and trigger callbacks
            Emitter.emitZoweEvent(sharedZoweEvent);
            setupWatcherSpy.mock.calls.forEach(call => {
                if (call[0].appName === zoweApp) { (call[2] as Function)(); }
            });

            expect(firstCallback).toHaveBeenCalled();
            expect(secondCallback).not.toHaveBeenCalled();
            EventOperator.deleteProcessor(sampleApps[0]);
            EventOperator.deleteProcessor(zoweApp);
        });
    });

    describe("Custom Events", () => {
        it("should create an event file upon first subscription if file does not exist - specific to CustomUserEvent directory structure",
            async () => {
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
