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
import { ImperativeEventType } from "../ImperativeEventConstants";

/**
 * Imperative Standard Event
 * @export
 * @interface IImperativeEventParms
 */
export interface IImperativeEventParms {
    /**
   * The name of the application to be used to generate a unique ID for the event
   * @type {string}
   * @memberof IImperativeEventParms
   */
    appName: string;
    /**
   * The type of imperative event that occurred
   * @type {ImperativeEventType}
   * @memberof IImperativeEventParms
   */
    eventType: ImperativeEventType | string
}
