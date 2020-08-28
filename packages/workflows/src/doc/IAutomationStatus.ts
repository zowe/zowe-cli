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

// automation-info object (table 3)
/**
 * Interface for z/OSMF API response.
 * @export
 * @interface IAutomationStatus
 */
export interface IAutomationStatus{

    /**
     * User ID of the user who initiated the automation processing.
     * @type {string}
     * @memberof IAutomationStatus
     */
    startUser: string;

    /**
     * Time that automation processing started.
     * @type {number}
     * @memberof IAutomationStatus
     */
    startedTime: number;

    /**
     * Time that automation processing stopped.
     * @type {number}
     * @memberof IAutomationStatus
     */
    stoppedTime: number;

    /**
     * Step that is being processed automatically or that caused stop.
     * @type {string}
     * @memberof IAutomationStatus
     */
    currentStepName: string;

    /**
     * The step number.
     * @type {string}
     * @memberof IAutomationStatus
     */
    currentStepNumber: string;

    /**
     * Step title.
     * @type {string}
     * @memberof IAutomationStatus
     */
    currentStepTitle: string;

    /**
     * Message identifier for the accompanying message.
     * @type {string}
     * @memberof IAutomationStatus
     */
    messageID: string;

    /**
     * Message text that describes the reason that automation is stopped.
     * @type {string}
     * @memberof IAutomationStatus
     */
    messageText: string;

}
