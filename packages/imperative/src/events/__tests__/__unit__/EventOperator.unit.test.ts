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
import { Logger } from '../../..';
import { EventUtils } from '../../src/EventUtils';
import { IEventDisposable, IProcessorTypes } from '../../src/doc';
import { FSWatcher } from 'fs';
import { Event } from '../../..';
import { EventTypes } from "../../src/EventConstants";

jest.mock('../../src/EventProcessor');
jest.mock('../../../Logger');

const logger = Logger.getImperativeLogger();
const validateAppNameSpy = jest.spyOn(EventUtils, 'validateAppName');
const createSubscriptionSpy = jest.spyOn(EventUtils, 'createSubscription');
const setupWatcherSpy = jest.spyOn(EventUtils, 'setupWatcher');
const getListOfAppsSpy = jest.spyOn(EventUtils, 'getListOfApps');
// const writeEventSpy = jest.spyOn(EventUtils, 'writeEvent');

describe('EventOperator Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        createSubscriptionSpy.mockImplementation(() => ({
            close: jest.fn()
        } as IEventDisposable));

        setupWatcherSpy.mockImplementation(() => ({
            close: jest.fn(),
            removeAllListeners: jest.fn()
        } as unknown as FSWatcher));
    });

    describe("processor tests", () => {
        it("createProcessor should create a new EventProcessor if not already existing", () => {
            const appName = 'TestApp';
            const type = IProcessorTypes.BOTH;

            getListOfAppsSpy.mockImplementation(() => ["Zowe", appName]);
            const processor = EventOperator.getProcessor(appName, logger);

            expect(validateAppNameSpy).toHaveBeenCalledWith(appName);
            expect(EventProcessor).toHaveBeenCalledWith(appName, type, logger);
            expect(processor).toBeInstanceOf(EventProcessor);
        });

        it("getZoweProcessor should return the Zowe processor instance", () => {
            const processor = EventOperator.getZoweProcessor();

            expect(validateAppNameSpy).toHaveBeenCalledWith("Zowe");
            expect(processor).toBeInstanceOf(EventProcessor);
        });

        it("getProcessor should return a generic event processor", () => {
            const appName = 'GenericApp';

            getListOfAppsSpy.mockImplementation(() => ["Zowe", appName]);
            const processor = EventOperator.getProcessor(appName, logger);

            expect(validateAppNameSpy).toHaveBeenCalledWith(appName);
            expect(EventProcessor).toHaveBeenCalledWith(appName, IProcessorTypes.BOTH, logger);
            expect(processor).toBeInstanceOf(EventProcessor);
        });

        it("deleteProcessor should remove the correct event processor", () => {
            const appName = 'DeleteApp';

            getListOfAppsSpy.mockImplementation(() => [appName]);
            const processor = new EventProcessor(appName, IProcessorTypes.BOTH);
            processor.subscribedEvents = new Map([
                ['testEvent', {
                    eventTime: '',
                    eventName: 'testEvent',
                    eventType: EventTypes.SharedEvents,
                    appName: appName,
                    subscriptions: new Set([
                        {
                            removeAllListeners: jest.fn(),
                            close: jest.fn()
                        }
                    ])
                } as unknown as Event]
            ]);

            EventOperator.getProcessor(appName);
            EventOperator.deleteProcessor(appName);

            expect(validateAppNameSpy).toHaveBeenCalledWith(appName);
            expect(EventOperator['instances'].has(appName)).toBe(false);
        });
    });

    describe("watcher tests", () => {
        it("getWatcher should return a watcher-only event processor", () => {
            const appName = 'WatcherApp';
            const processor = EventOperator.getWatcher(appName, logger);

            expect(validateAppNameSpy).toHaveBeenCalledWith(appName);
            expect(EventProcessor).toHaveBeenCalledWith(appName, IProcessorTypes.WATCHER, logger);
            expect(processor).toBeInstanceOf(EventProcessor);
        });
    });

    describe("emitter tests", () => {
        it("getEmitter should return an emitter-only event processor", () => {
            const appName = 'EmitterApp';
            const processor = EventOperator.getEmitter(appName, logger);

            expect(validateAppNameSpy).toHaveBeenCalledWith(appName);
            expect(EventProcessor).toHaveBeenCalledWith(appName, IProcessorTypes.EMITTER, logger);
            expect(processor).toBeInstanceOf(EventProcessor);
        });
    });
});