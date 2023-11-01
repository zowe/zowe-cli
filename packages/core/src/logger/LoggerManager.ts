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

import { appendFileSync } from "fs";

import { IQueuedMessage } from "./doc/IQueuedMessage";
import { Console } from "../console/Console";

/**
 * LoggerManager is a singleton class used to contain logger information.
 */

export class LoggerManager {
    private static readonly DEFAULT_MAX_QUEUE_SIZE = 10000;
    private static mInstance: LoggerManager = null;

    public static get instance(): LoggerManager {
        if (this.mInstance == null) {
            this.mInstance = new LoggerManager();
        }

        return this.mInstance;
    }

    private mIsLoggerInit: boolean = false;
    private mLogInMemory: boolean = false;
    private mMaxQueueSize: number;
    private console: Console;
    private mQueuedMessages: IQueuedMessage[] = [];

    constructor() {
        this.console = new Console();
        this.mMaxQueueSize = LoggerManager.DEFAULT_MAX_QUEUE_SIZE;
    }

    /**
     * The following flag is used to monitor if the Logger.initLogger function
     * have been called to set the configuration of log4js.
     */
    public get isLoggerInit(): boolean {
        return this.mIsLoggerInit;
    }

    public set isLoggerInit(status: boolean) {
        this.mIsLoggerInit = status;
    }

    /**
     * The following flag is used to control if the log message should be store
     * in memory while log4js have yet to be configured.
     */
    public get logInMemory(): boolean {
        return this.mLogInMemory;
    }

    public set logInMemory(status: boolean) {
        this.mLogInMemory = status;
    }

    /**
     * The following value is used to control the max number of messages allowed
     * to be stored in memory at all time.
     */
    public get maxQueueSize(): number {
        return this.mMaxQueueSize;
    }

    public set maxQueueSize(size: number){
        this.mMaxQueueSize = size;
    }

    /**
     * This function returned an array that contain all of the messages.
     */
    public get QueuedMessages(): IQueuedMessage[] {
        return this.mQueuedMessages;
    }

    /**
     * This function is responsible for gathering all of the input parameters and
     * store them in the message queue array.
     *
     * New messages are to be stored at the top of the array instead of the bottom.
     * This allow easy removing message from array while looping the array.
     * @param category - logger category
     * @param method - log method
     * @param message - log message
     */
    public queueMessage(category: string, method: string, message: string){
        if (this.logInMemory) {
            this.QueuedMessages.unshift({
                category,
                method,
                message
            });

            if (this.QueuedMessages.length > this.maxQueueSize) {
                this.QueuedMessages.pop();
            }
        } else {
            this.console.info(message);
        }
    }

    /**
     * Dump all of the log messages in memory to the specified file
     * @param file log file
     */
    public dumpQueuedMessages(file: string) {
        if (this.QueuedMessages.length > 0) {
            this.console.debug(`Writing all logged messages in memory to ${file}`);
            this.QueuedMessages.slice().reverse().forEach((value) => {
                (this.console as any)[value.method](value.message);
                try {
                    appendFileSync(file, `${value.message}\n`);
                } catch (error) {
                    /**
                     * For whatever reason causing logger to unable to append to the log file,
                     * log the error to console so user see and take appropriate action.
                     */
                    this.console.info(error);
                }
            });
        }
    }
}

