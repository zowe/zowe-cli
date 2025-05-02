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

import { transports, format, LoggerOptions, addColors } from "winston";

const customLevels = {
    levels: {
        fatal: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
        trace: 5
    },
    colors: {
        fatal: "magenta",
        error: "red",
        warn: "yellow",
        info: "green",
        debug: "blue",
        trace: "gray"
    }
};

addColors(customLevels.colors);

/**
 * Translates a log4js-style config to a winston LoggerOptions config.
 * Supports basic "console" and "file" appenders and categories.
 * This is a minimal translation for compatibility.
 */
export function log4jsConfigToWinstonConfig(log4jsConfig: any): LoggerOptions {
    const winstonTransports: any[] = [];
    const appenders = log4jsConfig.appenders || {};
    const categories = log4jsConfig.categories || {};

    // Map appenders to winston transports
    for (const [name, appender] of Object.entries(appenders)) {
        if (isAppenderWithType(appender, "console")) {
            winstonTransports.push(
                new transports.Console({
                    level: getCategoryLevel(categories, name) || "info",
                    format: format.combine(
                        format.colorize(),
                        format.timestamp(),
                        format.printf(({ timestamp, level, message }) =>
                            `[${timestamp}] [${level}] ${message}`
                        )
                    )
                })
            );
        } else if (isAppenderWithType(appender, "file") || isAppenderWithType(appender, "fileSync")) {
            winstonTransports.push(
                new transports.File({
                    filename: (appender as { filename: string }).filename,
                    level: getCategoryLevel(categories, name) || "info",
                    format: format.combine(
                        format.timestamp(),
                        format.printf(({ timestamp, level, message }) =>
                            `[${timestamp}] [${level}] ${message}`
                        )
                    )
                })
            );
        }
        // Add more mappings as needed
    }

    // Determine the default level: use "debug" unless the "default" category is present and has a level
    let defaultLevel = "debug";
    if (
        categories &&
        typeof categories.default === "object" &&
        categories.default !== null &&
        (categories.default as any).level
    ) {
        defaultLevel = String((categories.default as any).level).toLowerCase();
    }

    return {
        levels: customLevels.levels,
        level: defaultLevel,
        transports: winstonTransports,
        exitOnError: false
    };
}

/**
 * Helper to get the log level for a given appender/category.
 */
function getCategoryLevel(categories: any, appenderName: string): string | undefined {
    for (const [cat, config] of Object.entries(categories)) {
        if (
            typeof config === "object" &&
            config !== null &&
            Array.isArray((config as any).appenders) &&
            ((config as any).appenders as any[]).includes(appenderName)
        ) {
            return (config as any).level?.toLowerCase();
        }
    }
    return undefined;
}

/**
 * Type guard for log4js appender with a specific type.
 */
function isAppenderWithType(appender: unknown, type: string): appender is { type: string; filename?: string } {
    return (
        typeof appender === "object" &&
        appender !== null &&
        "type" in appender &&
        (appender as any).type === type
    );
}
