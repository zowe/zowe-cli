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
import { ImperativeEventTypes } from "./ImperativeEventConstants";

/**
 *
 * @export
 * @class ImperativeEvent
 */
export class ImperativeEvent {
    /**
     * The name of event that occurred
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mEventName: string;
    /**
     * The application name that caused this event
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mAppName: string;
    /**
     * The type(ImperativeEventTypes) of event that occurred
     * @private
     * @type {string}
     * @memberof ImperativeEventTypes
     */
    private mEventType: string;
    /**
     * The time of the event created with new Date().toISOString() (ISO String)
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mEventTime: string;



    /**
     * toString overload to be called automatically on string concatenation
     * @returns string representation of the imperative event
     */
    public toString = (): string => {
        return `Type: ${this.eventType} \t| Time: ${this.eventTime} \t| App: ${this.appName} \t| ID: ${this.eventId}`;
    };

    /**
     * toJson helper method to be called for emitting or logging imperative events
     * @returns JSON representation of the imperative event
     */
    public toJson = (): IImperativeEventJson => {
        return {
            time: this.eventTime,
            name: this.eventName,
            source: this.appName,
        };
    };

    constructor(parms: IImperativeEventParms) {
        this.mEventTime = new Date().toISOString();
        this.mAppID = parms.appName;
        parms.logger.debug("ImperativeEvent: " + this);
    }

    public get eventTime(): string {
        return this.mEventTime;
    }

    public get eventName(): string {
        return this.mEventName;
    }

    public get appName(): string {
        return this.mAppID;
    }

    public get path(): string {
        return this.mPath;
    }
}
