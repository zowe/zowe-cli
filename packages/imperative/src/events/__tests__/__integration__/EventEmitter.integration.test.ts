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

import { EventOperator, EventTypes, EventUtils, IEventJson, ZoweSharedEvents } from "../../..";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestLogger } from "../../../../__tests__/src/TestLogger";
import * as TestUtil from "../../../../__tests__/src/TestUtil";
import { SetupTestEnvironment } from "../../../../__tests__/__src__/environment/SetupTestEnvironment";
import * as fs from "fs";
import * as path from "path";

let TEST_ENVIRONMENT: ITestEnvironment;
let cwd = '';
const appName = "Zowe";

describe("Event Emitter", () => {
    const mainModule = process.mainModule;
    const testLogger = TestLogger.getTestLogger();

    beforeAll(async () => {
        (process.mainModule as any) = {
            filename: __filename
        };

        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "ZOWE_CLI_HOME",
            testName: "event_emitter"
        });
        cwd = TEST_ENVIRONMENT.workingDir;
    });

    afterAll(() => {
        process.mainModule = mainModule;
        TestUtil.rimraf(cwd);
    });

    const doesEventFileExists = (eventName: string) => {
        const eventType = EventUtils.isSharedEvent(eventName) ? EventTypes.ZoweSharedEvents :
            EventUtils.isUserEvent(eventName) ? EventTypes.ZoweUserEvents : EventTypes.SharedEvents;

        const eventDir = EventUtils.getEventDir(eventType, appName);
        if (!fs.existsSync(eventDir)) return false;
        if (fs.existsSync(path.join(eventDir, appName, eventName))) return true;
        return false;
    };

    describe("Shared Events", () => {
        it("should create an event file upon first subscription if the file does not exist", () => {
            const theEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
            const theProc = EventOperator.getZoweProcessor()

            expect(doesEventFileExists(theEvent)).toBeFalsy();
            expect((theProc as any).subscribedEvents.get(theEvent)).toBeFalsy();

            const subSpy = jest.fn();
            theProc.subscribeShared(theEvent, subSpy);

            expect(subSpy).not.toHaveBeenCalled();
            expect(doesEventFileExists(theEvent)).toBeTruthy();

            theProc.emitEvent(theEvent);

            (theProc as any).subscribedEvents.get(theEvent).subscriptions[0](); // simulate FSWatcher called

            expect(doesEventFileExists(theEvent)).toBeTruthy();
            const eventDetails: IEventJson = (theProc as any).subscribedEvents.get(theEvent).toJson();
            expect(eventDetails.eventName).toEqual(theEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();

            expect(subSpy).toHaveBeenCalled();

            EventOperator.deleteProcessor(appName);
        });
        it("should trigger subscriptions for all instances watching for onCredentialManagerChanged", () => { });
        it("should not affect subscriptions from another instance when unsubscribing from events", () => { });
    });

    describe("User Events", () => {
        it("should create an event file upon first subscription if the file does not exist", () => { });
        it("should trigger subscriptions for all instances watching for onVaultChanged", () => { });
        it("should not affect subscriptions from another instance when unsubscribing from events", () => { });
    });

    describe("Custom Events", () => {
        it("should create an event file upon first subscription if the file does not exist", () => { });
        it("should trigger subscriptions for all instances watching for onMyCustomEvent", () => { });
        it("should not affect subscriptions from another instance when unsubscribing from events", () => { });
    });
});
