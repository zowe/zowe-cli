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

import { exec } from "child_process";
import { IImperativeEventJson, IImperativeEventParms } from "./doc";
import { ImperativeEventType } from "./ImperativeEventConstants";
import { ImperativeError } from "../../error/src/ImperativeError";
import { randomUUID } from "crypto";

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
     * Process ID of the event
     * @private
     * @type {string}
     * @memberof ImperativeEvent
     */
    private mProcessID: string;

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
     * Indicator of user-specific (if true) or shared (if false) events
     * The ImperativeEventEmitter is responsible for setting this value on all events
     * @default false We assume that all events are shared unless the ImperativeEventEmitter says otherwise
     */
    public isUserSpecific: boolean = false;

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
            type: this.eventType,
            source: this.appName,
            pid: this.processId,
            id: this.eventId,
            user: this.isUserSpecific,
        };
    };

    constructor(parms: IImperativeEventParms) {
        this.mEventTime = new Date().toISOString();
        this.mEventID = randomUUID();
        this.mProcessID = '';
        this.mAppID = parms.appName;
        this.mEventType = parms.eventType;
        parms.logger.debug("ImperativeEvent: " + this);

        this.setProcessId();
    }

    /**
     * Method sets processId for ImperativeEvent
     * @private
     * @type {string}
     * @memberof ImperativeEvent
    */
    private async setProcessId() {
        try {
            const pid = await this.findProcessID(this.mAppID);
            this.mProcessID = pid;
        } catch (error) {
            throw new ImperativeError({
                msg: `Unable to determine PID for this Event: ${this.mEventType} \t| App: ${this.mAppID} | Error: ${error}`
            });
        }
    }

    /**
     * Method retrieves process ID from application generating the event
     * @private
     * @type {string}
     * @memberof ImperativeEvent
    */
    private findProcessID(appName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const command = `ps -A | grep ${appName} | awk '{print $1}'`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    return reject(error);
                }
                if (stderr) {
                    return reject(stderr);
                }
                const pid: string = stdout.trim().split('\n')[0];
                resolve(pid);
            });
        });
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

    public get processId(): string {
        return this.mProcessID;
    }

    public get eventId() : string {
        return this.mEventID;
    }
}
