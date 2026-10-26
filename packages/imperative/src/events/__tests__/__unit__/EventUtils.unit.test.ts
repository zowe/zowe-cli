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

import { EventOperator } from '../../src/EventOperator';
import { EventProcessor } from '../../src/EventProcessor';
import { EventUtils, Logger } from '../../..';
import { IProcessorTypes } from '../../src/doc';
import { Event } from '../../..';
import { EventTypes, ZoweUserEvents } from "../../src/EventConstants";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ImperativeConfig } from "../../../utilities/src/ImperativeConfig";

jest.mock('../../src/EventProcessor');
jest.mock('../../../logger');

const logger = Logger.getImperativeLogger();
let eventFilePath: string;

const createTestEvent = (appName: string) => ({
    eventTime: '',
    eventName: 'testEvent',
    eventType: EventTypes.SharedEvents,
    appName,
    eventFilePath,
    subscriptions: [
        {
            removeAllListeners: jest.fn(),
            close: jest.fn()
        }
    ]
} as unknown as Event);

describe("EventOperator Unit Tests", () => {
    let sandbox: string;
    let previousConfig: typeof ImperativeConfig.instance.loadedConfig;
    beforeAll(() => {
        sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "zowe-event-utils-"));
        const appDir = path.join(sandbox, ".events", "Zowe");
        fs.mkdirSync(appDir, { recursive: true });
        eventFilePath = path.join(appDir, "testEvent");
        fs.writeFileSync(eventFilePath, "{}");
        previousConfig = ImperativeConfig.instance.loadedConfig;
        ImperativeConfig.instance.loadedConfig = {
            name: "event-utils-tests", defaultHome: sandbox, envVariablePrefix: "EVENT_UTILS_TESTS"
        };
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        jest.restoreAllMocks();
        ImperativeConfig.instance.loadedConfig = previousConfig;
        fs.rmSync(sandbox, { recursive: true, force: true });
    });

    describe("processor tests", () => {
        it("'createProcessor' should create a new 'EventProcessor' if not already existing", () => {
            const appName = 'TestApp';
            const type = IProcessorTypes.BOTH;
            const processor = EventOperator.getProcessor(appName, logger);

            expect(EventProcessor).toHaveBeenCalledWith(appName, type, logger);
            expect(processor).toBeInstanceOf(EventProcessor);
        });

        it("'getZoweProcessor' should return the Zowe processor instance", () => {
            const processor = EventOperator.getZoweProcessor();

            expect(EventProcessor).toHaveBeenCalledWith("Zowe", IProcessorTypes.BOTH, logger);
            expect(processor).toBeInstanceOf(EventProcessor);
        });

        it('emitZoweEvent is called by a Zowe processor and emits a ZoweUserEvents', () => {
            const processor = EventOperator.getZoweProcessor();
            const eventName = "onVaultChanged";
            const emitZoweEventSpy = jest.spyOn(processor, 'emitZoweEvent');

            processor.emitZoweEvent(eventName);

            expect(emitZoweEventSpy).toHaveBeenCalledWith(eventName);
            expect(Object.values(ZoweUserEvents)).toContain(eventName);
        });

        it("'getProcessor' should return a generic event processor", () => {
            const appName = 'GenericApp';
            const processor = EventOperator.getProcessor(appName, logger);

            expect(EventProcessor).toHaveBeenCalledWith(appName, IProcessorTypes.BOTH, logger);
            expect(processor).toBeInstanceOf(EventProcessor);
        });

        it("'deleteProcessor' should remove the correct event processor", () => {
            const appName = 'DeleteApp';
            const processor = new EventProcessor(appName, IProcessorTypes.BOTH);
            processor.subscribedEvents = new Map([
                ['testEvent', createTestEvent(appName)]
            ]);

            EventOperator.deleteProcessor(appName);

            expect(EventOperator['instances'].has(appName)).toBe(false);
        });
    });

    describe("watcher tests", () => {
        it("'getWatcher' should return a watcher-only event processor", () => {
            const appName = 'WatcherApp';
            const processor = EventOperator.getWatcher(appName, logger);

            expect(EventProcessor).toHaveBeenCalledWith(appName, IProcessorTypes.WATCHER, logger);
            expect(processor).toBeInstanceOf(EventProcessor);
        });

        it("'setupWatcher' should setup a watcher that handles events", () => {
            const appName = "WatcherApp";
            const testEvent = createTestEvent(appName);
            const processor = new EventProcessor(appName, IProcessorTypes.WATCHER);
            processor.eventTimes = new Map();
            processor.logger = { debug: jest.fn() } as any;
            processor.subscribedEvents = new Map([
                ['testEvent', testEvent]
            ]);

            jest.spyOn(EventUtils, "createEvent").mockReturnValue(testEvent);
            jest.spyOn(EventUtils, "getEventContents").mockReturnValue(testEvent);
            jest.spyOn(fs, "watch").mockImplementationOnce((_filename, listener: any) => listener());

            const eventCb = jest.fn();
            EventUtils.createSubscription(processor, testEvent.eventName, EventTypes.SharedEvents);
            EventUtils.setupWatcher(processor, testEvent.eventName, eventCb);

            expect(eventCb).toHaveBeenCalled();
        });

        it("'setupWatcher' should setup a watcher that ignores events with same time", () => {
            const appName = "WatcherApp";
            const testEvent = createTestEvent(appName);
            testEvent.eventTime = new Date().toISOString();
            const processor = new EventProcessor(appName, IProcessorTypes.WATCHER);
            processor.eventTimes = new Map([
                [testEvent.eventName, testEvent.eventTime]
            ]);
            processor.logger = { debug: jest.fn() } as any;
            processor.subscribedEvents = new Map([
                ['testEvent', testEvent]
            ]);

            jest.spyOn(EventUtils, "createEvent").mockReturnValue(testEvent);
            jest.spyOn(EventUtils, "getEventContents").mockReturnValue(testEvent);
            jest.spyOn(fs, "watch").mockImplementationOnce((_filename, listener: any) => listener());

            const eventCb = jest.fn();
            EventUtils.createSubscription(processor, testEvent.eventName, EventTypes.SharedEvents);
            EventUtils.setupWatcher(processor, testEvent.eventName, eventCb);

            expect(processor.eventTimes.get(testEvent.eventName)).toBe(testEvent.eventTime);
            expect(eventCb).not.toHaveBeenCalled();
        });

        it("'setupWatcher' should setup a watcher that ignores events with same PID", () => {
            const appName = "WatcherApp";
            const testEvent = createTestEvent(appName);
            testEvent.appProcId = process.pid;
            const processor = new EventProcessor(appName, IProcessorTypes.WATCHER);
            processor.eventTimes = new Map();
            processor.logger = { debug: jest.fn() } as any;
            processor.subscribedEvents = new Map([
                ['testEvent', testEvent]
            ]);

            jest.spyOn(EventUtils, "createEvent").mockReturnValue(testEvent);
            jest.spyOn(EventUtils, "getEventContents").mockReturnValue(testEvent);
            jest.spyOn(fs, "watch").mockImplementationOnce((_filename, listener: any) => listener());

            const eventCb = jest.fn();
            EventUtils.createSubscription(processor, testEvent.eventName, EventTypes.SharedEvents);
            EventUtils.setupWatcher(processor, testEvent.eventName, eventCb);

            expect(testEvent.appProcId).toBeUndefined();
            expect(eventCb).not.toHaveBeenCalled();
        });

        it("'deleteWatcher' should remove the correct event processor", () => {
            const appName = 'DeleteWatcher';
            const processor = new EventProcessor(appName, IProcessorTypes.WATCHER);
            processor.subscribedEvents = new Map([
                ['testEvent', createTestEvent(appName)]
            ]);

            EventOperator.deleteWatcher(appName);

            expect(EventOperator['instances'].has(appName)).toBe(false);
        });
    });

    describe("emitter tests", () => {
        it("'getEmitter' should return an emitter-only event processor", () => {
            const appName = 'EmitterApp';
            const processor = EventOperator.getEmitter(appName, logger);

            expect(EventProcessor).toHaveBeenCalledWith(appName, IProcessorTypes.EMITTER, logger);
            expect(processor).toBeInstanceOf(EventProcessor);
        });

        it("'deleteEmitter' should remove the correct event processor", () => {
            const appName = 'DeleteEmitter';
            const processor = new EventProcessor(appName, IProcessorTypes.EMITTER);
            processor.subscribedEvents = new Map([
                ['testEvent', createTestEvent(appName)]
            ]);

            EventOperator.deleteEmitter(appName);

            expect(EventOperator['instances'].has(appName)).toBe(false);
        });
    });
});