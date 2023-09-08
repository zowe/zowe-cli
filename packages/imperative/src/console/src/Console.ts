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

/**
 * Generic logging-use class for writing info to the console if we have log4js
 * failures or are unable to initialize otherwise.
 *
 * This class supports most of the methods / accessors log4js uses.
 */
import { IConsole } from "./doc/IConsole";
import { TextUtils } from "../../utilities/src/TextUtils";
import { format } from "util";
import { ImperativeError } from "../../error";

export class Console implements IConsole {

    public static readonly LEVELS = ["trace", "debug", "info", "warn", "error", "fatal", "off"];
    public static readonly LEVEL_DEFAULT = "debug";

    public static getConsole(category: string) {
        return new Console();
    }

    public static isValidLevel(level: string) {
        return Console.LEVELS.indexOf(level) < 0 ? false : true;
    }

    public static validateLevel(level: string) {
        if (!Console.isValidLevel(level)) {
            throw new ImperativeError(
                {
                    msg: "Invalid level specified",
                }
            );
        }
    }

    private mPrefix: boolean;
    private mColor: boolean;
    private mIsOn: boolean;

    constructor(private mLevel = Console.LEVEL_DEFAULT) {
        this.mPrefix = true;
        this.mColor = true;
        this.mLevel = mLevel.toLocaleLowerCase();
        this.mIsOn = true;
        Console.validateLevel(this.mLevel);
    }

    public addContext(key: string, value: any) {
        // do nothing
    }

    public removeContext(key: string) {
        // do nothing
    }

    public clearContext() {
        // do nothing
    }

    public isLevelEnabled() {
        return false;
    }

    public isTraceEnabled() {
        return Console.LEVELS.indexOf("trace") >= Console.LEVELS.indexOf(this.level) ? true : false;
    }

    public isDebugEnabled() {
        return Console.LEVELS.indexOf("debug") >= Console.LEVELS.indexOf(this.level) ? true : false;
    }

    public isInfoEnabled() {
        return Console.LEVELS.indexOf("info") >= Console.LEVELS.indexOf(this.level) ? true : false;
    }

    public isWarnEnabled() {
        return Console.LEVELS.indexOf("warn") >= Console.LEVELS.indexOf(this.level) ? true : false;
    }

    public isErrorEnabled() {
        return Console.LEVELS.indexOf("error") >= Console.LEVELS.indexOf(this.level) ? true : false;
    }

    public isFatalEnabled() {
        return Console.LEVELS.indexOf("fatal") >= Console.LEVELS.indexOf(this.level) ? true : false;
    }

    public isFormatEnabled() {
        return true;
    }

    public info(message: any, ...args: any[]) {
        if (!this.isInfoEnabled()) {
            return;
        }
        let adjustedMessage = message;
        if (this.prefix) {
            adjustedMessage = this.buildPrefix("INFO") + message;
        }
        if (this.color) {
            adjustedMessage = TextUtils.chalk.grey(adjustedMessage);
        }
        return this.writeStdout(adjustedMessage, args);
    }

    public trace(message: any, ...args: any[]) {
        if (!this.isTraceEnabled()) {
            return;
        }
        let adjustedMessage = message;
        if (this.prefix) {
            adjustedMessage = this.buildPrefix("TRACE") + message;
        }
        if (this.color) {
            adjustedMessage = TextUtils.chalk.cyan(adjustedMessage);
        }
        return this.writeStdout(adjustedMessage, args);
    }

    public debug(message: any, ...args: any[]) {
        if (!this.isDebugEnabled()) {
            return;
        }
        let adjustedMessage = message;
        if (this.prefix) {
            adjustedMessage = this.buildPrefix("DEBUG") + message;
        }
        if (this.color) {
            adjustedMessage = TextUtils.chalk.blue(adjustedMessage);
        }
        return this.writeStdout(adjustedMessage, args);
    }

    public warn(message: any, ...args: any[]) {
        if (!this.isWarnEnabled()) {
            return;
        }
        let adjustedMessage = message;
        if (this.prefix) {
            adjustedMessage = this.buildPrefix("WARN") + message;
        }
        if (this.color) {
            adjustedMessage = TextUtils.chalk.yellow(adjustedMessage);
        }
        return this.writeStderr(adjustedMessage, args);
    }

    public error(message: any, ...args: any[]) {
        if (!this.isErrorEnabled()) {
            return;
        }
        let adjustedMessage = message;
        if (this.prefix) {
            adjustedMessage = this.buildPrefix("ERROR") + message;
        }
        if (this.color) {
            adjustedMessage = TextUtils.chalk.red(adjustedMessage);
        }
        return this.writeStderr(adjustedMessage, args);
    }

    public fatal(message: any, ...args: any[]) {
        if (!this.isFatalEnabled()) {
            return;
        }
        let adjustedMessage = message;
        if (this.prefix) {
            adjustedMessage = this.buildPrefix("FATAL") + message;
        }
        if (this.color) {
            adjustedMessage = TextUtils.chalk.magenta(adjustedMessage);
        }
        return this.writeStderr(adjustedMessage, args);
    }

    private writeStderr(message: string, ...args: any[]) {
        const data = this.format(message, args);
        if (this.on) {
            process.stderr.write(this.format(message, args));
        }
        return data;
    }

    private writeStdout(message: string, ...args: any[]) {
        const data = this.format(message, args);
        if (this.on) {
            process.stdout.write(data);
        }
        return data;
    }

    private format(data: string, ...args: any[]) {
        let formatted = data;
        // TODO(Kelosky): this is not ideal, but works for simple cases of
        // .debug(%s, "sub string").
        if (this.isFormatEnabled() && args != null && args.length > 0) {
            let defined = false;
            args.forEach((arg) => {
                arg.forEach((ntry: string[]) => {
                    if (ntry.length > 0) {
                        defined = true;
                    }
                });
            });
            // if every argument is undefined, dont format it
            if (defined) {
                formatted = format(data, args);
            }
        }
        return formatted + "\n";
    }

    private buildPrefix(type: string) {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const tzOffset = new Date().getTimezoneOffset() * 60000;
        const dateString = new Date(Date.now() - tzOffset).toISOString()
            .replace(/(\d{4})-(\d{2})-(\d{2})T([^Z]+)Z/, "$1/$2/$3 $4");
        return "[" + dateString + "]" + " " + "[" + type + "]" + " ";
    }

    set level(level: string) {
        level = level.toLowerCase();
        Console.validateLevel(level);
        this.mLevel = level;
    }

    get level() {
        return this.mLevel;
    }

    set prefix(isEnabled: boolean) {
        this.mPrefix = isEnabled;
    }

    get prefix(): boolean {
        return this.mPrefix;
    }

    set color(isEnabled: boolean) {
        this.mColor = isEnabled;
    }

    get color(): boolean {
        return this.mColor;
    }

    set on(isOn: boolean) {
        this.mIsOn = isOn;
    }

    get on() {
        return this.mIsOn;
    }
}
