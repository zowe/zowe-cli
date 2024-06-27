/*
* This program and  accompanying materials are made available under  terms of 
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to  Zowe Project.
*
*/

import { SetupTestEnvironment } from "../../../../__tests__/__src__/environment/SetupTestEnvironment";
import { ConfigUtils, EventCallback, EventOperator, EventProcessor, EventUtils, IEventJson, ZoweSharedEvents, ZoweUserEvents } from "../../..";
import * as fs from "fs";
import * as path from "path";
import { IExtendersJsonOpts } from "../../../config/src/doc/IExtenderOpts";

const appName = "Zowe";
const sampleApps = ["sample1", "sample2"];
const userHome = require('os').homedir();
const userEventsDir = path.join(userHome, '.zowe', '.events');
let sharedEventsDir: string;
let zoweCliHome: string;

beforeAll(async () => {
    await SetupTestEnvironment.createTestEnv({
        cliHomeEnvVar: "ZOWE_CLI_HOME",
        testName: "event_operator_and_processor"
    });
    zoweCliHome = process.env.ZOWE_CLI_HOME || '';
    sharedEventsDir = path.join(zoweCliHome, '.events');
    const extJson: IExtendersJsonOpts = ConfigUtils.readExtendersJson();
    sampleApps.forEach(app => extJson.profileTypes[app] = { from: [app] });
    ConfigUtils.writeExtendersJson(extJson);
});

beforeEach(() => {
    jest.restoreAllMocks();
});

afterAll(() => {
    if (fs.existsSync(userEventsDir)) {
        fs.rmdirSync(userEventsDir, { recursive: true });
    }

    if (fs.existsSync(sharedEventsDir)) {
        fs.rmdirSync(sharedEventsDir, { recursive: true });
    }
});

describe("Event Operator and Processor", () => {
    const userEvent = ZoweUserEvents.ON_VAULT_CHANGED;
    const customEvent = "onCustomEvent";
    const sharedEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;

    describe("Zowe Events - Shared", () => {
        it("should create an event file upon first subscription if file does not exist", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const callback = jest.fn();
            const Watcher = EventOperator.getWatcher(appName);
            const Emitter = EventOperator.getZoweProcessor();

            expect((Watcher as EventProcessor).subscribedEvents.get(sharedEvent)).toBeFalsy();

            // Subscribe to  event
            Watcher.subscribeShared(sharedEvent, callback);
            const eventDetails: IEventJson = (Watcher as any).subscribedEvents.get(sharedEvent).toJson();

            expect(callback).not.toHaveBeenCalled();
            expect(fs.existsSync(eventDetails.eventFilePath)).toBeTruthy();

            // Emit event and trigger callback
            Emitter.emitZoweEvent(sharedEvent);
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)()); // Mock  event emission

            expect(eventDetails.eventName).toEqual(sharedEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();
            expect(callback).toHaveBeenCalled();
            EventOperator.deleteProcessor(appName);
        });

        it("should trigger subscriptions for all instances watching for ZoweSharedEvent", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const firstWatcher = EventOperator.getWatcher(sampleApps[0]);
            const secondWatcher = EventOperator.getWatcher(sampleApps[1]);
            const Emitter = EventOperator.getZoweProcessor();

            const FirstCallback: EventCallback = jest.fn() as EventCallback;
            const SecondCallback: EventCallback = jest.fn() as EventCallback;

            expect((firstWatcher as EventProcessor).subscribedEvents.get(sharedEvent)).toBeFalsy();
            expect((secondWatcher as EventProcessor).subscribedEvents.get(sharedEvent)).toBeFalsy();

            // Subscribe to  event
            firstWatcher.subscribeShared(sharedEvent, FirstCallback);
            secondWatcher.subscribeShared(sharedEvent, SecondCallback);
            const firstEventDetails: IEventJson = (firstWatcher as any).subscribedEvents.get(sharedEvent).toJson();
            const secondEventDetails: IEventJson = (secondWatcher as any).subscribedEvents.get(sharedEvent).toJson();

            // Emit event and trigger callbacks
            Emitter.emitZoweEvent(sharedEvent);

            // Adding a delay to ensure  callbacks have time to be called
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)()); // Mock  event emission

            expect(firstEventDetails.eventName).toEqual(sharedEvent);
            expect(secondEventDetails.eventName).toEqual(sharedEvent);
            expect(EventUtils.isSharedEvent(firstEventDetails.eventName)).toBeTruthy();
            expect(EventUtils.isSharedEvent(secondEventDetails.eventName)).toBeTruthy();
            expect(FirstCallback).toHaveBeenCalled();
            expect(SecondCallback).toHaveBeenCalled();
            EventOperator.deleteProcessor(sampleApps[0]);
            EventOperator.deleteProcessor(sampleApps[1]);
            EventOperator.deleteProcessor(appName);
        });

        it("should not affect subscriptions from another instance when unsubscribing from events", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const firstWatcher = EventOperator.getWatcher(sampleApps[0]);
            const secondProc = EventOperator.getZoweProcessor();

            const firstSubSpy = jest.fn();
            const secondSubSpy = jest.fn();

            firstWatcher.subscribeShared(sharedEvent, firstSubSpy);
            secondProc.subscribeShared(sharedEvent, secondSubSpy);

            firstWatcher.unsubscribe(sharedEvent);

            expect((firstWatcher as any).subscribedEvents.get(sharedEvent)).toBeFalsy();
            expect((secondProc as any).subscribedEvents.get(sharedEvent)).toBeTruthy();

            // Emit event and trigger callbacks
            secondProc.emitZoweEvent(sharedEvent);

            // Adding a delay to ensure  callbacks have time to be called
            setupWatcherSpy.mock.calls.forEach(call => {
                if (call[0].appName === appName) { (call[2] as Function)(); }
            }); // Mock  event emission

            expect(firstSubSpy).not.toHaveBeenCalled();
            expect(secondSubSpy).toHaveBeenCalled();

            EventOperator.deleteProcessor(sampleApps[0]);
            EventOperator.deleteProcessor(appName);
        });
    });

    describe("Zowe Events - User", () => {
        it("should create an event file upon first subscription if file does not exist - specific to user event directory structure", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const callback = jest.fn();
            const eventDir = path.join(zoweCliHome, ".events");
            const Watcher = EventOperator.getWatcher(sampleApps[0]);
            const Emitter = EventOperator.getZoweProcessor();

            expect((Watcher as EventProcessor).subscribedEvents.get(userEvent)).toBeFalsy();

            // Subscribe to  event
            Watcher.subscribeShared(userEvent, callback);
            const eventDetails: IEventJson = (Watcher as any).subscribedEvents.get(userEvent).toJson();

            expect(callback).not.toHaveBeenCalled();
            expect(fs.existsSync(eventDetails.eventFilePath)).toBeTruthy();

            // Emit event and trigger callback
            Emitter.emitZoweEvent(userEvent);
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)()); // Mock  event emission

            expect(eventDetails.eventName).toEqual(userEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();
            expect(callback).toHaveBeenCalled();
            EventOperator.deleteProcessor(appName);
        });
    });

    describe("Custom Events", () => {
        it("should create an event file upon first subscription if file does not exist - specific to custom event directory structure", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const callback = jest.fn();
            const Watcher = EventOperator.getWatcher(sampleApps[0]);
            const Emitter = EventOperator.getZoweProcessor();
            const eventDir = path.join(zoweCliHome, sampleApps[0], ".events");

            expect((Watcher as EventProcessor).subscribedEvents.get(customEvent)).toBeFalsy();

            // Subscribe to  event
            Watcher.subscribeShared(customEvent, callback);
            const eventDetails: IEventJson = (Watcher as any).subscribedEvents.get(customEvent).toJson();

            expect(callback).not.toHaveBeenCalled();
            expect(fs.existsSync(eventDetails.eventFilePath)).toBeTruthy();

            // Emit event and trigger callback
            Emitter.emitZoweEvent(customEvent);
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)()); // Mock  event emission

            expect(eventDetails.eventName).toEqual(customEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();
            expect(callback).toHaveBeenCalled();
            EventOperator.deleteProcessor("Zowe");
        });
    });
});
