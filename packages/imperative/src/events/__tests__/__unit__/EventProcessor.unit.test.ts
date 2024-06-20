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

import { EventProcessor } from '../../src/EventProcessor';
import { EventUtils } from '../../src/EventUtils';
import { IProcessorTypes } from '../../src/doc/IEventInstanceTypes';
import { ImperativeError } from '../../../error/src/ImperativeError';
import { Event } from '../../src/Event';
import { EventTypes, ZoweSharedEvents, ZoweUserEvents } from '../../src/EventConstants';
import { EventOperator } from '../../src/EventOperator';

jest.mock('../../../logger/src/Logger');

describe('EventProcessor Unit Tests', () => {
    let createSubscriptionSpy: any;
    let setupWatcherSpy: any;
    const appName = 'TestApp';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(EventUtils, 'writeEvent').mockImplementation(jest.fn());
        createSubscriptionSpy = jest.spyOn(EventUtils, 'createSubscription').mockImplementation(jest.fn());
        setupWatcherSpy = jest.spyOn(EventUtils, 'setupWatcher').mockImplementation(jest.fn());

        jest.spyOn(EventUtils, "getListOfApps").mockReturnValue(["Zowe", appName]);
        const subs = EventProcessor.prototype.subscribedEvents = new Map();
        const dummyEvent: any = { subscriptions: [ { removeAllListeners: jest.fn().mockReturnValue({close: jest.fn()})} as any] } ;
        subs.set("Zowe", dummyEvent);
    });
    afterEach(() => {
        EventOperator.deleteProcessor(appName);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        it('initializes EventProcessor correctly', () => {
            expect(EventOperator['instances'].get(appName)).toBeUndefined();

            EventOperator.getProcessor(appName);

            expect(EventOperator['instances'].get(appName)).toBeDefined();
        });
    });

    describe('Subscription Methods', () => {
        it('"subscribeShared" throws error for emitter-only processor', () => {
            const emitter = new EventProcessor(appName, IProcessorTypes.EMITTER);
            expect(() => emitter.subscribeShared('fakeEventToSubscribeTo', () => {})).toThrow(ImperativeError);
        });

        it('"subscribeUser" throws error for emitter-only processor', () => {
            const emitter = new EventProcessor(appName, IProcessorTypes.EMITTER);
            expect(() => emitter.subscribeUser('fakeEventToSubscribeTo', () => {})).toThrow(ImperativeError);
        });

        it('"subscribeShared" correctly subscribes to shared events', () => {
            const processor = new EventProcessor(appName, IProcessorTypes.BOTH);
            const eventName = 'someEvent';
            const callbacks = [jest.fn()];

            createSubscriptionSpy.mockReturnValue({ close: jest.fn() });

            const disposable = processor.subscribeShared(eventName, callbacks);

            expect(createSubscriptionSpy).toHaveBeenCalledWith(processor, eventName, EventTypes.SharedEvents);
            expect(setupWatcherSpy).toHaveBeenCalledWith(processor, eventName, callbacks);
            expect(disposable).toBeDefined();
        });

        it('"subscribeUser" correctly subscribes to user-specific events', () => {
            const processor = new EventProcessor(appName, IProcessorTypes.BOTH);
            const eventName = 'someEvent';
            const callbacks = [jest.fn()];

            createSubscriptionSpy.mockReturnValue({ close: jest.fn() });

            const disposable = processor.subscribeUser(eventName, callbacks);

            expect(createSubscriptionSpy).toHaveBeenCalledWith(processor, eventName, EventTypes.UserEvents);
            expect(setupWatcherSpy).toHaveBeenCalledWith(processor, eventName, callbacks);
            expect(disposable).toBeDefined();
        });
    });

    describe('Emission Methods', () => {
        it('"emitEvent" throws error for watcher-only processor', () => {
            const watcher = new EventProcessor(appName, IProcessorTypes.WATCHER);
            expect(() => watcher.emitEvent('someEvent')).toThrow(ImperativeError);
        });

        it('"emitEvent" throws error when emitting Zowe events', () => {
            const emitter = new EventProcessor(appName, IProcessorTypes.EMITTER);
            expect(() => emitter.emitEvent(ZoweUserEvents.ON_VAULT_CHANGED)).toThrow(ImperativeError);
            expect(() => emitter.emitEvent(ZoweSharedEvents.ON_CREDENTIAL_MANAGER_CHANGED)).toThrow(ImperativeError);
        });

        it('"emitZoweEvent" throws error for watcher-only processor', () => {
            const watcher = new EventProcessor(appName, IProcessorTypes.WATCHER);
            expect(() => watcher.emitZoweEvent('someEvent')).toThrow(ImperativeError);
        });

        it('"emitZoweEvent" throws error when emitting non Zowe events', () => {
            const emitter = EventOperator.getZoweProcessor();
            expect(() => emitter.emitZoweEvent('someEvent')).toThrow(ImperativeError);
        });

        it('"emitEvent" updates event timestamp and writes event', () => {
            const emitter = new EventProcessor(appName, IProcessorTypes.EMITTER);
            const eventName = 'someEvent';
            const event = { eventTime: '', eventName, eventType: EventTypes.UserEvents, appName, subscriptions: new Set() } as unknown as Event;

            emitter.subscribedEvents.set(eventName, event);
            emitter.emitEvent(eventName);

            expect(event.eventTime).not.toBe('');
            expect(EventUtils.writeEvent).toHaveBeenCalledWith(event);
        });
    });

    describe('Unsubscribe Methods', () => {
        it('"unsubscribe" removes subscriptions and cleans up resources', () => {
            const processor = new EventProcessor(appName, IProcessorTypes.BOTH);
            processor.subscribedEvents = new Map([
                ['testEvent', {
                    eventTime: '',
                    eventName: 'testEvent',
                    eventType: EventTypes.UserEvents,
                    appName: appName,
                    subscriptions: new Set([
                        {
                            removeAllListeners: jest.fn(),
                            close: jest.fn()
                        }
                    ])
                } as unknown as Event]
            ]);

            processor.unsubscribe('testEvent');

            expect(processor.subscribedEvents.has('testEvent')).toBe(false);
        });
        it('subscription removed from a processor\'s subscribed events and resources are cleaned', () => {
            const processor = new EventProcessor(appName, IProcessorTypes.BOTH);
            const mockSubscription = {
                removeAllListeners: jest.fn(),
                close: jest.fn()
            };

            const event = {
                eventTime: '',
                eventName: 'testEvent',
                eventType: EventTypes.UserEvents,
                appName: appName,
                subscriptions: new Set([mockSubscription])
            } as unknown as Event;

            processor.subscribedEvents = new Map([
                ['testEvent', event]
            ]);

            expect(processor.subscribedEvents.has('testEvent')).toBe(true);
            processor.unsubscribe('testEvent');
            expect(mockSubscription.removeAllListeners).toHaveBeenCalled();
            expect(mockSubscription.close).toHaveBeenCalled();
            expect(processor.subscribedEvents.has('testEvent')).toBe(false);
        });
        it('"unsubscribe" throws error for emitter-only processor', () => {
            const emitter = new EventProcessor(appName, IProcessorTypes.EMITTER);
            expect(() => emitter.unsubscribe('someEvent')).toThrow(ImperativeError);
        });
    });
});