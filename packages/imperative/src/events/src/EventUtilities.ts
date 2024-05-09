// move over the following methods
// getEventDir
// getEventType
// ensureEventFileExists
// ensureEventsDirExists
// ensureClassInitialized
// setupWatcher
// initEvent
// writeEvent

import * as fs from "fs";
import { join, dirname } from "path";
import { ImperativeError } from "../../error/src/ImperativeError";
import {
    UserEvents,
    SharedEvents,
    CustomSharedEvents,
    CustomUserEvents,
    EventTypes
} from "./EventConstants";
import { IEventJson, IEventSubscriptionParms } from "./doc";
import { ProfileInfo } from "../../config";
import { Event } from "./Event";

//////////// Initialization Helpers /////////////////////////////////////////////////////////////////////////
/**
 * Check to see if the  Event Emitter instance has been initialized
 */
export function ensureClassInitialized() {
    if (!this.initialized) {
        throw new ImperativeError({msg: "You must initialize the instance before using any of its methods."});
    }
}

/**
 * Check to see if the directory exists, otherwise, create it
 * @param directoryPath Zowe or User dir where we will write the events
 */
export function ensureEventsDirExists(directoryPath: string) {
    try {
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath);
        }
    } catch (err) {
        throw new ImperativeError({ msg: `Unable to create '.events' directory. Path: ${directoryPath}`, causeErrors: err });
    }
}

/**
 * Check to see if the file path exists, otherwise, create it
 * @param filePath Zowe or User path where we will write the events
 */
export function ensureEventFileExists(filePath: string) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.closeSync(fs.openSync(filePath, 'w'));
        }
    } catch (err) {
        throw new ImperativeError({ msg: `Unable to create event file. Path: ${filePath}`, causeErrors: err });
    }
}

/**
 * Returns the eventType based on eventName
 * @param eventName Name of event, ie: onSchemaChanged
 */
export function getEventType(eventName: string): EventTypes {
    const isCustomSharedEvent = this.subscriptions.get(eventName).isCustomSharedEvent;
    if (isCustomSharedEvent){
        // this.subscriptions.set(eventName, {
        //     ...this.subscriptions.get(eventName),
        //     eventType: CustomShared
        // });
        return CustomSharedEvents;
    }
    if ( Object.values<string>(UserEvents).includes(eventName)){
        // this.subscriptions.set(eventName, {
        //     ...this.subscriptions.get(eventName),
        //     eventType: UserEvents
        // });
        return UserEvents;
    }
    if (Object.values<string>(SharedEvents).includes(eventName)){
        // this.subscriptions.set(eventName, {
        //     ...this.subscriptions.get(eventName),
        //     eventType: SharedEvents
        // });
        return SharedEvents;
    }
    // this.subscriptions.set(eventName, {
    //     ...this.subscriptions.get(eventName),
    //     eventType: CustomUser
    // });
    return CustomUserEvents;
}

/**
 * Returns the directory path based on EventType
 * @param eventName Name of event, ie: onSchemaChanged
 * @param eventType One of the EventTypes from EventConstants
 * @param appName Needed for custom event paths
 */
export function getEventDir(eventType: EventTypes, appName: string): string {
    switch (eventType) {
        case SharedEvents:
            return join(ProfileInfo.getZoweDir(), ".events");
        case CustomSharedEvents:
            return join(ProfileInfo.getZoweDir(),".events", appName);
        case CustomUserEvents:
            return join(dirname(ProfileInfo.getZoweDir()), ".events", appName);
        default:
            //UserEvents
            return join(dirname(ProfileInfo.getZoweDir()), ".events");
    }
}

//////////// Emit Helpers //////////////////////////////////////////////////////////////////////////////////

/**
 * Helper method to write contents out to disk for {@link EventEmitter.emitEvent}
 * @param filePath directory to write the file (i.e. emit the event)
 * @param event the event to be written/emitted
 * @internal We do not want developers writing events directly, they should use the `emit...` methods
 */
export function writeEvent(event: Event) {
    const eventPath = join(ProfileInfo.getZoweDir(), event.eventFilePath);
    const eventJson = { ...event.toJson(), eventFilePath: eventPath };

    this.ensureEventsDirExists(eventPath);
    fs.writeFileSync(eventPath, JSON.stringify(eventJson, null, 2));
}

//////////// Subscription Helpers ///////////////////////////////////////////////////////////////////////////
/**
 * Helper method to create watchers based on event strings and list of callbacks
 * @param eventName name of event to which we will create a watcher for
 * @param callbacks list of all callbacks for this watcher
 * @returns The FSWatcher instance created
 */
export function setupWatcher(eventName: string): fs.FSWatcher {
    const subscription = this.subscriptions.get(eventName);
    const dir = join(ProfileInfo.getZoweDir(), subscription.dir);
    this.ensureEventsDirExists(dir);
    this.ensureEventFileExists(join(dir, eventName));

    const watcher = fs.watch(join(dir, eventName), (event: "rename" | "change") => {
        // Node.JS triggers this event 3 times
        const eventContents = fs.readFileSync(dir).toString();
        const eventTime = eventContents.length === 0 ? "" : (JSON.parse(eventContents) as IEventJson).time;
        if (subscription.eventTime !== eventTime) {
            callbacks.forEach(callback => callback());
            this.subscriptions.set(eventName, {
                ...subscription,
                eventTime: eventTime
            });
        }
    });
    // Update the map with the new watcher and callbacks
    this.subscriptions.set(eventName, {
        ...subscription,
        watcher: watcher,
        callbacks: [...subscription.callbacks, callbacks]
    });
    return watcher;
}
