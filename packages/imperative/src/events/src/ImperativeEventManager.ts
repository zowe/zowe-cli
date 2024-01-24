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

import { homedir, EOL } from "os";
import * as fs from "fs";
import { ImperativeConfig } from "../../utilities/src/ImperativeConfig";
import { join } from "path";
import { ImperativeError } from "../../error";
import { ImperativeEventType, ImperativeUserEvents, ImperativeZoweEvents } from "./ImperativeEventConstants";
import { ImperativeEvent } from "./ImperativeEvent";

export class ImperativeEventManager {

    /**
   * ZOWE HOME directory to search for system wide ImperativeEvents like `configChanged`
   */
    public static getZoweEventDir(): string {
        return join(ImperativeConfig.instance.cliHome, ".events");
    }

    /**
   * USER HOME directory to search for user specific ImperativeEvents like `vaultChanged`
   */
    public static getUserEventDir(): string {
        return join(homedir(), ".zowe", ".events");
    }

    /**
   * Check to see if the directory exists, otherwise, create it : )
   * @param directoryPath Zowe or User path where we will write the events
   */
    private static ensureEventsDirExists(directoryPath: string) {
        try {
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath);
            }
        } catch (err) {
            throw new ImperativeError({ msg: `Unable to create '.events' directory. Path: ${directoryPath}`, causeErrors: err });
        }
    }

    /**
   * Check to see if the given event is a User event
   * @param eventType A string representing the type of event
   * @returns True if it is a user event, false otherwise
   */
    public static isUserEvent(eventType: string): boolean {
        return ImperativeUserEvents.indexOf(eventType as any) >= 0;
    }

    /**
   * Check to see if the given event is a Zowe event
   * @param eventType A string representing the type of event
   * @returns True if it is a zowe event, false otherwise
   */
    public static isZoweEvent(eventType: string): boolean {
        return ImperativeZoweEvents.indexOf(eventType as any) >= 0;
    }

    /**
   * Check to see if the given event is a Custom event
   * @param eventType A string representing the type of event
   * @returns True if it is not a zowe or a user event, false otherwise
   */
    public static isCustomEvent(eventType: string): boolean {
        return !ImperativeEventManager.isUserEvent(eventType) && !ImperativeEventManager.isZoweEvent(eventType);
    }

    /**
   * Simple method to write the events to disk
   * @param eventType The type of event to write
   * @internal We do not want to make this function accessible to any application developers
   */
    public static writeEvent(eventType: ImperativeEventType) {
        const theEvent = new ImperativeEvent({ appName: ImperativeConfig.instance.callerPackageJson?.name, eventType });

        let dir: string;
        if (ImperativeEventManager.isUserEvent(eventType)) {
            dir = ImperativeEventManager.getUserEventDir();
        } else if (ImperativeEventManager.isZoweEvent(eventType)) {
            dir = ImperativeEventManager.getZoweEventDir();
        } else {
            throw new ImperativeError({ msg: `Unable to determine the type of event. Event: ${eventType}` });
        }

        ImperativeEventManager.ensureEventsDirExists(dir);
        fs.writeFileSync(join(dir, theEvent.eventType), `${EOL}${eventType}${EOL}${theEvent.eventTime}${EOL}${theEvent.appName}${EOL}${EOL}`);
    }

    /**
  * Simple method to write the events to disk
  * @param eventType The type of event to write
  */
    public static writeCustomEvent(eventType: string, isUserSpecific: boolean = false) {
        const theEvent = new ImperativeEvent({ appName: ImperativeConfig.instance.callerPackageJson?.name, eventType });

        let dir: string;
        if (ImperativeEventManager.isCustomEvent(eventType)) {
            if (isUserSpecific) {
                dir = ImperativeEventManager.getUserEventDir();
            } else {
                dir = ImperativeEventManager.getZoweEventDir();
            }
        } else {
            throw new ImperativeError({ msg: `Operation not allowed. Event is considered protected. Event: ${eventType}` });
        }

        ImperativeEventManager.ensureEventsDirExists(dir);
        fs.writeFileSync(join(dir, theEvent.eventType), `${EOL}${eventType}${EOL}${theEvent.eventTime}${EOL}${theEvent.appName}${EOL}${EOL}`);
    }

    public static registerAction(eventType: ImperativeEventType, callback: (...args: any[]) => any) {
        if (eventType) {
            callback();
        }
    }

    /**
   * Phase 1
   *    Implement the writers
   *      These are the functions that are embedded in every config.save (for `configUpdated`) or secure.save (for vaultUpdated)
   *
   * Phase 2
   *    Implement file watchers in a subscription pattern
   *      These are the methods that create the nodejs file watchers
   *        They should have a callback to perform an accion when the event is triggered
   *
   * Phase 3
   *    Investigate how to turn these file watchers into vscode.Dispoable
   */
}
