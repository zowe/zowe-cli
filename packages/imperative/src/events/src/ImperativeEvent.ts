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
import { IImperativeEventParms } from "./doc";
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
     * The type of event that occurred
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mEventType: ImperativeEventType | string;

    /**
     * toString overload to be called automatically on string concatenation
     * @returns string representation of the imperative event
     */
    public toString = () : string => {
        return `Type: ${this.eventType} \t| Time: ${this.eventTime} \t| App: ${this.appName} \t| ID: ${this.eventId}`;
    };

    constructor(parms: IImperativeEventParms) {
        this.mEventTime = new Date().toISOString();
        this.mEventID = randomUUID();
        this.mAppID = parms.appName;
        this.mEventType = parms.eventType;
        parms.logger.debug("ImperativeEvent: " + this);
    }

    public get eventTime(): string {
        return this.mEventTime;
    }

    public get eventType(): ImperativeEventType | string {
        return this.mEventType;
    }

    public get appName(): string {
        return this.mAppID;
    }

    public get eventId() : string {
        return this.mEventID;
    }
}
