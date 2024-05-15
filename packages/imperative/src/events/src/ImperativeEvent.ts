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

import { randomUUID } from "crypto";
import { IImperativeEventJson, IImperativeEventParms } from "./doc";
import { ImperativeEventType } from "./ImperativeEventConstants";

/**
 *
 * @export
 * @class ImperativeEvent
 */
export class ImperativeEvent {
    /**
     * The ID of the event
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mEventID: string;

    /**
     * The application ID that caused this event
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mAppID: string;

    /**
     * The time of the event created with new Date().toISOString() (ISO String)
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mEventTime: string;

    /**
     * The location of the event
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mEventLoc: string;

    /**
     * The type of event that occurred
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mEventType: ImperativeEventType | string;

    /**
     * Indicator of user-specific (if true) or shared (if false) events
     * @private
     * @type {boolean}
     * @memberof ImperativeEvent
     */
    private isUserEvent: boolean;

    /**
     * toString overload to be called automatically on string concatenation
     * @returns string representation of the imperative event
     */
    public toString = (): string => {
        return `Type: ${this.type} \t| Time: ${this.time} \t| App: ${this.appName} \t| ID: ${this.id}`;
    };

    /**
     * toJson helper method to be called for emitting or logging imperative events
     * @returns JSON representation of the imperative event
     */
    public toJson = (): IImperativeEventJson => {
        return {
            time: this.time,
            type: this.type,
            source: this.appName,
            id: this.id,
            loc: this.location,
            user: this.isUserEvent,
        };
    };

    constructor(parms: IImperativeEventParms) {
        this.mEventTime = new Date().toISOString();
        this.mEventID = randomUUID();
        this.mAppID = parms.appName;
        this.mEventType = parms.eventName;
        this.isUserEvent = parms.isUser;
        parms.logger.debug("ImperativeEvent: " + this);
    }

    public set location(location: string) {
        // TODO: (edge-case) Test whether we need to re-assign the location (multiple times) of an already initialized event
        this.mEventLoc ||= location;
    }

    public get location(): string {
        return this.mEventLoc;
    }

    public get time(): string {
        return this.mEventTime;
    }

    public get type(): ImperativeEventType | string {
        return this.mEventType;
    }

    public get appName(): string {
        return this.mAppID;
    }

    public get id() : string {
        return this.mEventID;
    }
}
