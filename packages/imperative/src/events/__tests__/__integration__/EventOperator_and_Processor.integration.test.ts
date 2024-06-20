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

import { ConfigUtils, EventCallback, EventOperator, EventProcessor, EventUtils, IEventJson, ZoweSharedEvents, ZoweUserEvents } from "../../..";
import * as fs from "fs";
import * as path from "path";
import * as TestUtil from "../../../../__tests__/src/TestUtil";
import { ITestEnvironment } from "../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { SetupTestEnvironment } from "../../../../__tests__/__src__/environment/SetupTestEnvironment";

let TEST_ENVIRONMENT: ITestEnvironment;
const appName = "Zowe";
const sampleApp = "sample";
const userHome = require('os').homedir();
const userEventsDir = path.join(userHome, '.zowe', '.events');
let zoweCliHome: string;
let sharedEventsDir: string;

describe("Event Operator and Processor", () => {

    beforeAll(async () => {
        TEST_ENVIRONMENT = await SetupTestEnvironment.createTestEnv({
            cliHomeEnvVar: "ZOWE_CLI_HOME",
            testName: "event_operator_and_processor"
        });
        zoweCliHome = process.env.ZOWE_CLI_HOME || '';
        sharedEventsDir = path.join(zoweCliHome, '.events');
        const extJson = ConfigUtils.readExtendersJson();
        extJson.profileTypes[sampleApp] = { from: [sampleApp] };
        ConfigUtils.writeExtendersJson(extJson);
    });

    const cleanupDirectories = () => {
        if (fs.existsSync(userEventsDir)) {
            fs.rmdirSync(userEventsDir, { recursive: true });
        }

        if (fs.existsSync(sharedEventsDir)) {
            fs.rmdirSync(sharedEventsDir, { recursive: true });
        }
    };

    afterEach(cleanupDirectories);

    afterAll(() => {
        TestUtil.rimraf(zoweCliHome);
    });

    const doesEventFileExist = (eventDir: string, eventName: string) => {
        const eventFilePath = path.join(eventDir, eventName);
        return fs.existsSync(eventFilePath);
    };

    describe("Shared Events", () => {
        it("should create an event file upon first subscription if the file does not exist", () => {
            const theEvent = ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED;
            const theWatcher = EventOperator.getWatcher(appName);
            const theEmitter = EventOperator.getZoweProcessor();
            const setupWatcherSpy = jest.spyOn(EventUtils, "setupWatcher");

            const eventDir = path.join(zoweCliHome, '.events');
            expect(doesEventFileExist(eventDir, theEvent)).toBeFalsy();
            expect((theWatcher as EventProcessor).subscribedEvents.get(theEvent)).toBeFalsy();

            const theCallback = jest.fn() as EventCallback;
            theWatcher.subscribeShared(theEvent, theCallback);

            expect(theCallback).not.toHaveBeenCalled();
            expect(doesEventFileExist(path.join(eventDir, "Zowe"), theEvent)).toBeTruthy();

            theEmitter.emitZoweEvent(theEvent);
            (setupWatcherSpy.mock.calls[0][2] as Function)(); // Mock the event emission 

            const eventDetails: IEventJson = (theWatcher as any).subscribedEvents.get(theEvent).toJson();
            expect(eventDetails.eventName).toEqual(theEvent);
            expect(EventUtils.isSharedEvent(eventDetails.eventName)).toBeTruthy();
            expect(theCallback).toHaveBeenCalled();

            EventOperator.deleteProcessor(sampleApp);
            EventOperator.deleteProcessor(appName);
        });
    });
});