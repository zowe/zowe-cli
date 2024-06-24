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
import { EventCallback, EventOperator, EventProcessor, EventUtils, IEventJson, IWatcher, ZoweSharedEvents, ZoweUserEvents } from "../../..";
import * as fs from "fs";
import * as path from "path";

let TEST_ENVIRONMENT: ITestEnvironment;
const appName = "Zowe"; //the only guarenteed app name in the plugins list
const app1 = "Zowe";//"FakeWatcherApp1";
const app2 = "Zowe";//"FakeWatcherApp2";
const userHome = require('os').homedir();
let zoweCliHome: string;
let eventDir: string;

describe("Event Operator and Processor", () => {
    const doesEventFileExist = (eventDir: string, eventName: string) => {
        const eventFilePath = path.join(eventDir, eventName);
        return fs.existsSync(eventFilePath);
    };

    const cleanupDirectories = () => {
        const userEventsDir = path.join(userHome, '.zowe', '.events');
        if (fs.existsSync(userEventsDir)) {
            fs.rmSync(userEventsDir, { recursive: true, force: true });
        }

        const sharedEventsDir = path.join(zoweCliHome, 'Zowe', '.events');
        if (fs.existsSync(sharedEventsDir)) {
            fs.rmSync(sharedEventsDir, { recursive: true, force: true });
        }
    };

    beforeEach(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "ZOWE_CLI_HOME",
            testName: "event_operator_and_processor"
        });
        zoweCliHome = process.env.ZOWE_CLI_HOME || '';
    });

    afterEach(cleanupDirectories);

    describe("Shared Events", () => {
        const theEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
        let theWatcher: IWatcher;
        let secondWatcher: IWatcher;
        let theEmitter: any;
        let theCallback: EventCallback;
        let theSecondCallback: EventCallback;

        beforeEach(() => {
            theWatcher = EventOperator.getWatcher(app1);
            secondWatcher = EventOperator.getWatcher(app2);
            theEmitter = EventOperator.getZoweProcessor();
            theCallback = jest.fn() as EventCallback;
            theSecondCallback = jest.fn() as EventCallback;
        });

        it("should create an event file upon first subscription if the file does not exist - ZOWE EVENT", async () => {
            expect((theWatcher as EventProcessor).subscribedEvents.get(theEvent)).toBeFalsy();

            // Subscribe to the event
            theWatcher.subscribeShared(theEvent, theCallback);
            const eventDetails: IEventJson = (theWatcher as any).subscribedEvents.get(theEvent).toJson();

            // Check for subscription evidence
            expect(fs.existsSync(eventDetails.eventFilePath)).toBeTruthy();

            // Emit event and trigger callback
            theEmitter.emitZoweEvent(theEvent);

            // Adding a delay to ensure the callback has time to be called
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(eventDetails.eventName).toEqual(theEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();
            expect(theCallback).toHaveBeenCalled();
            EventOperator.deleteProcessor(appName);
        });

        // it("should trigger subscriptions for all instances watching for onCredentialManagerChanged", async () => {
        //     expect((theWatcher as EventProcessor).subscribedEvents.get(theEvent)).toBeFalsy();
        //     expect((secondWatcher as EventProcessor).subscribedEvents.get(theEvent)).toBeFalsy();

        //     // Subscribe to the event
        //     theWatcher.subscribeShared(theEvent, theCallback);
        //     secondWatcher.subscribeShared(theEvent, theSecondCallback);
        //     const firstEventDetails: IEventJson = (theWatcher as any).subscribedEvents.get(theEvent).toJson();
        //     const secondEventDetails: IEventJson = (secondWatcher as any).subscribedEvents.get(theEvent).toJson();

        //     // Emit event and trigger callbacks
        //     theEmitter.emitZoweEvent(theEvent);

        //     // Adding a delay to ensure the callbacks have time to be called
        //     await new Promise(resolve => setTimeout(resolve, 1000));

        //     expect(firstEventDetails.eventName).toEqual(theEvent);
        //     expect(secondEventDetails.eventName).toEqual(theEvent);
        //     expect(EventUtils.isSharedEvent(firstEventDetails.eventName)).toBeTruthy();
        //     expect(EventUtils.isSharedEvent(secondEventDetails.eventName)).toBeTruthy();
        //     expect(theCallback).toHaveBeenCalled();
        //     expect(theSecondCallback).toHaveBeenCalled();
        //     EventOperator.deleteProcessor(appName);
        // });

        it("should not affect subscriptions from another instance when unsubscribing from events", async () => {
            theWatcher.subscribeShared(theEvent, theCallback);
            secondWatcher.subscribeShared(theEvent, theSecondCallback);

            // Check that subscribed
            expect((theWatcher as any).subscribedEvents.get(theEvent)).toBeTruthy();
            expect((secondWatcher as any).subscribedEvents.get(theEvent)).toBeTruthy();
            secondWatcher.unsubscribe(theEvent);

            // Emit event and trigger callbacks
            theEmitter.emitZoweEvent(theEvent);

            // Adding a delay to ensure the callbacks have time to be called
            await new Promise(resolve => setTimeout(resolve, 100));

            // Testing that only the watching processor has their callback triggered
            expect(theCallback).toHaveBeenCalled();
            expect(theSecondCallback).not.toHaveBeenCalled();
            EventOperator.deleteProcessor(appName);
        });
    });

    describe("User Events", () => {
        const theEvent = ZoweUserEvents.ON_VAULT_CHANGED;
        let theWatcher: IWatcher;
        let secondWatcher: IWatcher;
        let theEmitter: any;
        let theCallback: EventCallback;
        let theSecondCallback: EventCallback;

        beforeEach(() => {
            theWatcher = EventOperator.getWatcher(app1);
            secondWatcher = EventOperator.getWatcher(app2);
            theEmitter = EventOperator.getZoweProcessor();
            theCallback = jest.fn() as EventCallback;
            theSecondCallback = jest.fn() as EventCallback;
            zoweCliHome = process.env.ZOWE_CLI_HOME || '';
            eventDir = path.join(zoweCliHome, 'Zowe', '.events');
        });

        it("should create an event file upon first subscription if the file does not exist", () => {
            // File should not exist before first-time subscription
            expect(doesEventFileExist(zoweCliHome, theEvent)).toBeFalsy();
            expect((theEmitter as any).subscribedEvents.get(theEvent)).toBeFalsy();

            // Subscribe to the event
            theWatcher.subscribeShared(theEvent, theCallback);
            const eventDetails: IEventJson = (theWatcher as any).subscribedEvents.get(theEvent).toJson();

            // Check that file now exists
            expect(fs.existsSync(eventDetails.eventFilePath)).toBeTruthy();
            EventOperator.deleteProcessor(appName);
        });

        it("should trigger subscriptions for all instances watching for onVaultChanged", () => {
            const theEvent = ZoweUserEvents.ON_VAULT_CHANGED;
            const firstProc = EventOperator.getZoweProcessor();
            const secondProc = EventOperator.getZoweProcessor();

            const firstSubSpy = jest.fn();
            const secondSubSpy = jest.fn();

            firstProc.subscribeUser(theEvent, firstSubSpy);
            secondProc.subscribeUser(theEvent, secondSubSpy);

            firstProc.emitZoweEvent(theEvent);

            (firstProc as any).subscribedEvents.get(theEvent).subscriptions.forEach((sub: any) => sub()); // simulate FSWatcher called

            expect(firstSubSpy).toHaveBeenCalled();
            expect(secondSubSpy).toHaveBeenCalled();

            EventOperator.deleteProcessor(appName);
        });
    });
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