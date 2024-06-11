import { EventProcessor } from '../../src/EventProcessor';
import { EventUtils } from '../../src/EventUtils';
import { IProcessorTypes } from '../../src/doc/IEventInstanceTypes';
import { ImperativeError } from '../../../error/src/ImperativeError';
import { Event } from '../../src/Event';
import { EventTypes } from '../../src/EventConstants';
import { EventOperator } from '../../src/EventOperator';

jest.mock('../../../logger/src/Logger');
jest.mock('../../src/EventUtils');
jest.mock('../../../error/src/ImperativeError');

describe('EventProcessor Unit Tests', () => {
    const isSharedEventSpy = jest.spyOn(EventUtils, 'isSharedEvent');
    const isUserEventSpy = jest.spyOn(EventUtils, 'isUserEvent');
    const writeEventSpy = jest.spyOn(EventUtils, 'writeEvent');
    const createSubscriptionSpy = jest.spyOn(EventUtils, 'createSubscription');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('initializes EventProcessor correctly', () => {
            const appName = 'someApp';

            expect(EventOperator['instances'].get(appName)).toBeUndefined();

            EventOperator.getProcessor(appName);

            expect(EventOperator['instances'].get(appName)).toBeDefined();
        });
    });

    describe('Subscription Methods', () => {
        it('subscribeShared throws error for emitter-only processor', () => {
            const appName = 'toEmit';
            const emitter = new EventProcessor(appName, IProcessorTypes.EMITTER);

            expect(() => emitter.subscribeShared('fakeEventToSubscribeTo', () => {})).toThrow(ImperativeError);
        });

        it('subscribeUser throws error for emitter-only processor', () => {
            const appName = 'toEmit';
            const emitter = new EventProcessor(appName, IProcessorTypes.EMITTER);

            expect(() => emitter.subscribeUser('fakeEventToSubscribeTo', () => {})).toThrow(ImperativeError);
        });

        it('subscribeShared correctly subscribes to shared events', () => {
            const appName = 'toSubscribeAndEmit';
            const processor = new EventProcessor(appName, IProcessorTypes.BOTH);
            const eventName = 'someEvent';
            const callbacks = [jest.fn()];

            isSharedEventSpy.mockReturnValue(true);
            createSubscriptionSpy.mockReturnValue({ close: jest.fn() });

            const disposable = processor.subscribeShared(eventName, callbacks);

            expect(EventUtils.createSubscription).toHaveBeenCalledWith(processor, eventName, EventTypes.ZoweSharedEvents);
            expect(EventUtils.setupWatcher).toHaveBeenCalledWith(processor, eventName, callbacks);
            expect(disposable).toBeDefined();
        });

        it('subscribeUser correctly subscribes to user-specific events', () => {
            const appName = 'toSubscribeAndEmit';
            const processor = new EventProcessor(appName, IProcessorTypes.BOTH);
            const eventName = 'someEvent';
            const callbacks = [jest.fn()];

            isUserEventSpy.mockReturnValue(true);
            createSubscriptionSpy.mockReturnValue({ close: jest.fn() });

            const disposable = processor.subscribeUser(eventName, callbacks);

            expect(EventUtils.createSubscription).toHaveBeenCalledWith(processor, eventName, EventTypes.ZoweUserEvents);
            expect(EventUtils.setupWatcher).toHaveBeenCalledWith(processor, eventName, callbacks);
            expect(disposable).toBeDefined();
        });
    });

    describe('Emission Methods', () => {
        it('emitEvent throws error for watcher-only processor', () => {
            const appName = 'toSubscribeTo';
            const watcher = new EventProcessor(appName, IProcessorTypes.WATCHER);

            expect(() => watcher.emitEvent('someEvent')).toThrow(ImperativeError);
        });

        it('emitEvent updates event timestamp and writes event', () => {
            const appName = 'toEmit';
            const emitter = new EventProcessor(appName, IProcessorTypes.EMITTER);
            const eventName = 'someEvent';
            const event = { eventTime: '', eventName, eventType: EventTypes.UserEvents, appName, subscriptions: new Set() } as unknown as Event;

            emitter.subscribedEvents.set(eventName, event);
            isSharedEventSpy.mockReturnValue(false);
            isUserEventSpy.mockReturnValue(false);
            writeEventSpy.mockImplementation(() => {});

            emitter.emitEvent(eventName);

            expect(event.eventTime).not.toBe('');
            expect(EventUtils.writeEvent).toHaveBeenCalledWith(event);
        });

        it('emitZoweEvent updates event timestamp and writes event', () => {
            const appName = 'toEmit';
            const emitter = new EventProcessor(appName, IProcessorTypes.BOTH);
            const eventName = 'ZoweEvent';
            const event = { eventTime: '', eventName, eventType: EventTypes.ZoweSharedEvents, appName, subscriptions: new Set() } as unknown as Event;
            emitter.subscribedEvents.set(eventName, event);

            writeEventSpy.mockImplementation(() => {});

            emitter.emitZoweEvent(eventName);

            expect(event.eventTime).not.toBe('');
            expect(EventUtils.writeEvent).toHaveBeenCalledWith(event);
        });
    });

    describe('Unsubscribe Methods', () => {
        it('unsubscribe removes subscriptions and cleans up resources', () => {
            const appName = 'toSubscribeAndEmit';
            const processor = new EventProcessor(appName, IProcessorTypes.BOTH);
            const eventName = 'someEvent';
            const subscription = { close: jest.fn() };
            const event = {
                eventTime: '',
                eventName, eventType: EventTypes.ZoweSharedEvents,
                appName,
                subscriptions: subscription
            } as unknown as Event;
            processor.subscribedEvents.set(eventName, event);

            processor.unsubscribe(eventName);

            expect(subscription.close).toHaveBeenCalled();
            expect(processor.subscribedEvents.has(eventName)).toBe(false);
        });

        it('unsubscribe throws error for emitter-only processor', () => {
            const appName = 'toEmit';

            const emitter = new EventProcessor(appName, IProcessorTypes.EMITTER);

            expect(() => emitter.unsubscribe('someEvent')).toThrow(ImperativeError);
        });
    });
});