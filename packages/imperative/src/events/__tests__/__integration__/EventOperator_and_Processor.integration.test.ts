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
import { EventCallback, EventOperator, EventProcessor, EventUtils, IEventJson, ZoweSharedEvents, ZoweUserEvents } from "../../..";
import * as fs from "fs";
import * as path from "path";

let TEST_ENVIRONMENT: ITestEnvironment;
const appName = "Zowe";
const userHome = require('os').homedir();
const zoweCliHome = process.env.ZOWE_CLI_HOME || '';

describe("Event Operator and Processor", () => {
    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "ZOWE_CLI_HOME",
            testName: "event_operator_and_processor"
        });
    });

    const cleanupDirectories = () => {
        if (fs.existsSync(userEventsDir)) {
            fs.rmSync(userEventsDir, { recursive: true, force: true });
        }

        const sharedEventsDir = path.join(zoweCliHome, '.events');
        if (fs.existsSync(sharedEventsDir)) {
            fs.rmSync(sharedEventsDir, { recursive: true, force: true });
        }
    };

    afterEach(cleanupDirectories);

    afterAll(() => {
        TestUtil.rimraf(userHome);
        TestUtil.rimraf(zoweCliHome);
    });

    const doesEventFileExist = (eventDir: string, eventName: string) => {
        const eventFilePath = path.join(eventDir, eventName);
        return fs.existsSync(eventFilePath);
    };

    describe("Shared Events", () => {
        it("should create an event file upon first subscription if the file does not exist - ZOWE EVENT", async () => {
            const theEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
            const theWatcher = EventOperator.getWatcher(appName);
            const theEmitter = EventOperator.getZoweProcessor();

            expect((theWatcher as EventProcessor).subscribedEvents.get(theEvent)).toBeFalsy();

            // Subscribe to the event
            theWatcher.subscribeShared(theEvent, theCallback);
            const eventDetails: IEventJson = (theWatcher as any).subscribedEvents.get(theEvent).toJson();

            expect(theCallback).not.toHaveBeenCalled();
            expect(doesEventFileExist(eventDir, theEvent)).toBeTruthy();

            // Emit event and trigger callback
            theEmitter.emitZoweEvent(theEvent);
            (setupWatcherSpy.mock.calls[0][2] as Function)(); // Mock the event emission 

            // Adding a delay to ensure the callback has time to be called
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(eventDetails.eventName).toEqual(theEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();
            expect(theCallback).toHaveBeenCalled();
            EventOperator.deleteProcessor(appName);
        });

        it("should trigger subscriptions for all instances watching for onCredentialManagerChanged", async () => {
            const theEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
            const firstWatcher = EventOperator.getWatcher(app1);
            const secondWatcher = EventOperator.getWatcher(app2);
            const theEmitter = EventOperator.getZoweProcessor();
            const eventDir = path.join(zoweCliHome, 'Zowe', '.events');
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
            await new Promise(resolve => setTimeout(resolve, 1000));

            expect(firstEventDetails.eventName).toEqual(theEvent);
            expect(secondEventDetails.eventName).toEqual(theEvent);
            expect(EventUtils.isSharedEvent(firstEventDetails.eventName)).toBeTruthy();
            expect(EventUtils.isSharedEvent(secondEventDetails.eventName)).toBeTruthy();
            expect(theFirstCallback).toHaveBeenCalled();
            expect(theSecondCallback).toHaveBeenCalled();
            EventOperator.deleteProcessor(appName);
        });

        it("should not affect subscriptions from another instance when unsubscribing from events", async () => {
            const theEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
            const firstProc = EventOperator.getZoweProcessor();
            const secondProc = EventOperator.getZoweProcessor();

            const firstSubSpy = jest.fn();
            const secondSubSpy = jest.fn();

            firstProc.subscribeShared(theEvent, firstSubSpy);
            secondProc.subscribeShared(theEvent, secondSubSpy);

            firstProc.unsubscribe(theEvent);

            expect((firstProc as any).subscribedEvents.get(theEvent)).toBeFalsy();
            expect((secondProc as any).subscribedEvents.get(theEvent)).toBeTruthy();

            // Emit event and trigger callbacks
            console.log('Emitting event from secondProc');
            secondProc.emitZoweEvent(theEvent);

            // Adding a delay to ensure the callbacks have time to be called
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Checking if firstSubSpy has been called');
            expect(firstSubSpy).not.toHaveBeenCalled();
            console.log('Checking if secondSubSpy has been called');
            expect(secondSubSpy).toHaveBeenCalled();

            EventOperator.deleteProcessor(sampleApp);
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