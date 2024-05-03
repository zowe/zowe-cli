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
    ImperativeUserEvents,
    ImperativeSharedEvents,
    ImperativeCustomShared,
    ImperativeCustomUser,
    ImperativeEventTypes
} from "./ImperativeEventConstants";
import { IImperativeEventJson, IEventSubscriptionParms } from "./doc";
import { ProfileInfo } from "../../config";
import { ImperativeEvent } from "./ImperativeEvent";

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
        const eventTime = eventContents.length === 0 ? "" : (JSON.parse(eventContents) as IImperativeEventJson).time;
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


//////////// Emit Helpers //////////////////////////////////////////////////////////////////////////////////
/**
 * Helper method to initialize the event for {@link ImperativeEventEmitter.emitEvent}
 * @param eventName The name of event to initialize
 * @returns The initialized ImperativeEvent
 */
export function initEvent(eventName: string, parms: IEventSubscriptionParms ): ImperativeEvent {
    this.ensureClassInitialized();
    return new ImperativeEvent({
        appName: this.appName,
        eventName: eventName,
        eventType: this.getEventType(eventName),
        eventTime: new Date().toISOString(),
        path: join(ProfileInfo.getZoweDir() ,this.getEventDir(parms.eventType, this.appName)),
        isCustomShared: parms.isCustomShared,
        logger: this.logger
    });
}

/**
 * Helper method to write contents out to disk for {@link ImperativeEventEmitter.emitEvent}
 * @param location directory to write the file (i.e. emit the event)
 * @param event the event to be written/emitted
 * @internal We do not want developers writing events directly, they should use the `emit...` methods
 */
export function writeEvent(location: string, event: ImperativeEvent) {
    const eventPath = join(location, (event.eventType).toString());
    const eventJson = { ...event.toJson(), loc: location };

    this.ensureEventsDirExists(location);
    fs.writeFileSync(eventPath, JSON.stringify(eventJson, null, 2));
}

//////////// Initialization Helpers /////////////////////////////////////////////////////////////////////////
/**
 * Check to see if the Imperative Event Emitter instance has been initialized
 */
export function ensureClassInitialized() {
    if (!this.initialized) {
        throw new ImperativeError({msg: "You must initialize the instance before using any of its methods."});
    }
}

/**
 * Check to see if the directory exists, otherwise, create it : )
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
 * Check to see if the file path exists, otherwise, create it : )
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
 * Sets and returns the eventType based on eventName
 * @param eventName Name of event, ie: onSchemaChanged
 */
export function getEventType(eventName: string): ImperativeEventTypes {
    const isCustomShared = this.subscriptions.get(eventName).isCustomShared;
    if (isCustomShared){
        // this.subscriptions.set(eventName, {
        //     ...this.subscriptions.get(eventName),
        //     eventType: ImperativeCustomShared
        // });
        return ImperativeCustomShared;
    }
    if ( Object.values<string>(ImperativeUserEvents).includes(eventName)){
        // this.subscriptions.set(eventName, {
        //     ...this.subscriptions.get(eventName),
        //     eventType: ImperativeUserEvents
        // });
        return ImperativeUserEvents;
    }
    if (Object.values<string>(ImperativeSharedEvents).includes(eventName)){
        // this.subscriptions.set(eventName, {
        //     ...this.subscriptions.get(eventName),
        //     eventType: ImperativeSharedEvents
        // });
        return ImperativeSharedEvents;
    }
    // this.subscriptions.set(eventName, {
    //     ...this.subscriptions.get(eventName),
    //     eventType: ImperativeCustomUser
    // });
    return ImperativeCustomUser;
}

/**
 * Returns the directory path based on EventType
 * @param eventName Name of event, ie: onSchemaChanged
 * @param eventType One of the ImperativeEventTypes from ImperativeEventConstants
 * @param appName Needed for custom event path
 */
export function getEventDir(eventType: ImperativeEventTypes, appName: string): string {
    switch (eventType) {
        case ImperativeSharedEvents:
            return join(ProfileInfo.getZoweDir(), ".events");
        case ImperativeCustomShared:
            return join(ProfileInfo.getZoweDir(),".events", appName);
        case ImperativeCustomUser:
            return join(dirname(ProfileInfo.getZoweDir()), ".events", appName);
        default:
            //ImperativeUserEvents
            return join(dirname(ProfileInfo.getZoweDir()), ".events");
    }
}