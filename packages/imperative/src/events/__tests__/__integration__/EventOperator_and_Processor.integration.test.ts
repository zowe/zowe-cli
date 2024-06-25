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

import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../__tests__/__src__/environment/SetupTestEnvironment";
import { ConfigUtils, EventCallback, EventOperator, EventProcessor, EventUtils, IEventJson, ZoweSharedEvents } from "../../..";
import * as fs from "fs";
import * as path from "path";
import { IExtendersJsonOpts } from "../../../config/src/doc/IExtenderOpts";

const appName = "Zowe";
const sampleApps = ["sample1", "sample2"];
let zoweCliHome: string;

describe("Event Operator and Processor", () => {
    beforeAll(async () => {
        await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "ZOWE_CLI_HOME",
            testName: "event_operator_and_processor"
        });
        zoweCliHome = process.env.ZOWE_CLI_HOME || '';
        const extJson: IExtendersJsonOpts = ConfigUtils.readExtendersJson();
        sampleApps.forEach(app => extJson.profileTypes[app] = { from: [app] });
        ConfigUtils.writeExtendersJson(extJson);
    });
    afterEach(() => {
        const sharedEventsDir = path.join(zoweCliHome, '.events');
        if (fs.existsSync(sharedEventsDir)) {
            fs.rmSync(sharedEventsDir, { recursive: true, force: true });
        }
        jest.restoreAllMocks();
    });

    const doesEventFileExist = (eventDir: string, eventName: string) => {
        const eventFilePath = path.join(eventDir, eventName);
        return fs.existsSync(eventFilePath);
    };

    describe("Shared Events", () => {
        it("should create an event file upon first subscription if the file does not exist - ZOWE EVENT", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const theEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
            const theCallback = jest.fn();
            const theWatcher = EventOperator.getWatcher(appName);
            const theEmitter = EventOperator.getZoweProcessor();
            const eventDir = path.join(zoweCliHome, ".events");

            expect((theWatcher as EventProcessor).subscribedEvents.get(theEvent)).toBeFalsy();

            // Subscribe to the event
            theWatcher.subscribeShared(theEvent, theCallback);
            const eventDetails: IEventJson = (theWatcher as any).subscribedEvents.get(theEvent).toJson();

            expect(theCallback).not.toHaveBeenCalled();
            expect(doesEventFileExist(path.join(eventDir, "Zowe"), theEvent)).toBeTruthy();

            // Emit event and trigger callback
            theEmitter.emitZoweEvent(theEvent);
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)()); // Mock the event emission 

            // Adding a delay to ensure the callback has time to be called
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(eventDetails.eventName).toEqual(theEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();
            expect(theCallback).toHaveBeenCalled();
            EventOperator.deleteProcessor(appName);
        });

        it("should trigger subscriptions for all instances watching for onCredentialManagerChanged", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const theEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
            const firstWatcher = EventOperator.getWatcher(sampleApps[0]);
            const secondWatcher = EventOperator.getWatcher(sampleApps[1]);
            const theEmitter = EventOperator.getZoweProcessor();

            const theFirstCallback: EventCallback = jest.fn() as EventCallback;
            const theSecondCallback: EventCallback = jest.fn() as EventCallback;

            expect((firstWatcher as EventProcessor).subscribedEvents.get(theEvent)).toBeFalsy();
            expect((secondWatcher as EventProcessor).subscribedEvents.get(theEvent)).toBeFalsy();

            // Subscribe to the event
            firstWatcher.subscribeShared(theEvent, theFirstCallback);
            secondWatcher.subscribeShared(theEvent, theSecondCallback);
            const firstEventDetails: IEventJson = (firstWatcher as any).subscribedEvents.get(theEvent).toJson();
            const secondEventDetails: IEventJson = (secondWatcher as any).subscribedEvents.get(theEvent).toJson();

            // Emit event and trigger callbacks
            theEmitter.emitZoweEvent(theEvent);

            // Adding a delay to ensure the callbacks have time to be called
            // await new Promise(resolve => setTimeout(resolve, 1000));
            setupWatcherSpy.mock.calls.forEach(call => (call[2] as Function)()); // Mock the event emission 

            expect(firstEventDetails.eventName).toEqual(theEvent);
            expect(secondEventDetails.eventName).toEqual(theEvent);
            expect(EventUtils.isSharedEvent(firstEventDetails.eventName)).toBeTruthy();
            expect(EventUtils.isSharedEvent(secondEventDetails.eventName)).toBeTruthy();
            expect(theFirstCallback).toHaveBeenCalled();
            expect(theSecondCallback).toHaveBeenCalled();
            EventOperator.deleteProcessor(sampleApps[0]);
            EventOperator.deleteProcessor(sampleApps[1]);
            EventOperator.deleteProcessor(appName);
        });

        it("should not affect subscriptions from another instance when unsubscribing from events", async () => {
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");
            const theEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
            const firstProc = EventOperator.getProcessor(sampleApps[0]);
            const secondProc = EventOperator.getZoweProcessor();

            const firstSubSpy = jest.fn();
            const secondSubSpy = jest.fn();

            firstProc.subscribeShared(theEvent, firstSubSpy);
            secondProc.subscribeShared(theEvent, secondSubSpy);

            firstProc.unsubscribe(theEvent);

            expect((firstProc as any).subscribedEvents.get(theEvent)).toBeFalsy();
            expect((secondProc as any).subscribedEvents.get(theEvent)).toBeTruthy();

            // Emit event and trigger callbacks
            secondProc.emitZoweEvent(theEvent);

            // Adding a delay to ensure the callbacks have time to be called
            // await new Promise(resolve => setTimeout(resolve, 1000));
            setupWatcherSpy.mock.calls.forEach(call => {
                if (call[0].appName === appName) { (call[2] as Function)(); }
            }); // Mock the event emission 

            expect(firstSubSpy).not.toHaveBeenCalled();
            expect(secondSubSpy).toHaveBeenCalled();

            EventOperator.deleteProcessor(sampleApps[0]);
            EventOperator.deleteProcessor(appName);
        });
    });

    // describe("User Events", () => {
    //     it("should create an event file upon first subscription if the file does not exist", () => {
    //         const theEvent = ZoweUserEvents.ON_VAULT_CHANGED;
    //         const processor = EventOperator.getZoweProcessor();

    //         expect(doesEventFileExist(zoweCliHome, theEvent)).toBeFalsy();
    //         expect((processor as any).subscribedEvents.get(theEvent)).toBeFalsy();

    //         const subSpy = jest.fn();
    //         processor.subscribeUser(theEvent, subSpy);

    //         expect(subSpy).not.toHaveBeenCalled();
    //         expect(doesEventFileExist(zoweCliHome, theEvent)).toBeTruthy();

    //         processor.emitZoweEvent(theEvent);

    //         (processor as any).subscribedEvents.get(theEvent).subscriptions.forEach((sub: any) => sub()); // simulate FSWatcher called

    //         expect(doesEventFileExist(zoweCliHome, theEvent)).toBeTruthy();
    //         const eventDetails: IEventJson = (processor as any).subscribedEvents.get(theEvent).toJson();
    //         expect(eventDetails.eventName).toEqual(theEvent);
    //         expect(EventUtils.isUserEvent(eventDetails.eventName)).toBeTruthy();

    //         expect(subSpy).toHaveBeenCalled();

    //         EventOperator.deleteProcessor(appName);
    //     });

    //     it("should trigger subscriptions for all instances watching for onVaultChanged", () => {
    //         const theEvent = ZoweUserEvents.ON_VAULT_CHANGED;
    //         const firstProc = EventOperator.getZoweProcessor();
    //         const secondProc = EventOperator.getZoweProcessor();

    //         const firstSubSpy = jest.fn();
    //         const secondSubSpy = jest.fn();

    //         firstProc.subscribeUser(theEvent, firstSubSpy);
    //         secondProc.subscribeUser(theEvent, secondSubSpy);

    //         firstProc.emitZoweEvent(theEvent);

    //         (firstProc as any).subscribedEvents.get(theEvent).subscriptions.forEach((sub: any) => sub()); // simulate FSWatcher called

    //         expect(firstSubSpy).toHaveBeenCalled();
    //         expect(secondSubSpy).toHaveBeenCalled();

    //         EventOperator.deleteProcessor(appName);
    //     });

    //     it("should not affect subscriptions from another instance when unsubscribing from events", () => {
    //         const theEvent = ZoweUserEvents.ON_VAULT_CHANGED;
    //         const firstProc = EventOperator.getZoweProcessor();
    //         const secondProc = EventOperator.getZoweProcessor();

    //         const firstSubSpy = jest.fn();
    //         const secondSubSpy = jest.fn();

    //         firstProc.subscribeUser(theEvent, firstSubSpy);
    //         secondProc.subscribeUser(theEvent, secondSubSpy);

    //         firstProc.unsubscribe(theEvent);

    //         expect((firstProc as any).subscribedEvents.get(theEvent)).toBeFalsy();
    //         expect((secondProc as any).subscribedEvents.get(theEvent)).toBeTruthy();

    //         secondProc.emitZoweEvent(theEvent);

    //         (secondProc as any).subscribedEvents.get(theEvent).subscriptions.forEach((sub: any) => sub()); // simulate FSWatcher called

    //         expect(firstSubSpy).not.toHaveBeenCalled();
    //         expect(secondSubSpy).toHaveBeenCalled();

    //         EventOperator.deleteProcessor(appName);
    //     });
    // });

    // describe("Custom Events", () => {
    //     const customEvent = "onMyCustomEvent";

    //     it("should create an event file upon first subscription if the file does not exist", () => {
    //         const processor = EventOperator.getProcessor(appName);

    //         expect(doesEventFileExist(zoweCliHome, customEvent)).toBeFalsy();
    //         expect((processor as any).subscribedEvents.get(customEvent)).toBeFalsy();

    //         const subSpy = jest.fn();
    //         processor.subscribeShared(customEvent, subSpy);

    //         expect(subSpy).not.toHaveBeenCalled();
    //         expect(doesEventFileExist(zoweCliHome, customEvent)).toBeTruthy();

    //         processor.emitEvent(customEvent);

    //         (processor as any).subscribedEvents.get(customEvent).subscriptions.forEach((sub: any) => sub()); // simulate FSWatcher called

    //         expect(doesEventFileExist(zoweCliHome, customEvent)).toBeTruthy();
    //         const eventDetails: IEventJson = (processor as any).subscribedEvents.get(customEvent).toJson();
    //         expect(eventDetails.eventName).toEqual(customEvent);

    //         expect(subSpy).toHaveBeenCalled();

    //         EventOperator.deleteProcessor(appName);
    //     });
    // });
});