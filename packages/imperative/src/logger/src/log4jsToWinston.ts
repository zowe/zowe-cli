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
import * as os from "os";
import * as dayjs from "dayjs";

const customLevels = {
    levels: {
        fatal: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
        trace: 5,
    },
    colors: {
        fatal: "magenta",
        error: "red",
        warn: "yellow",
        info: "green",
        debug: "blue",
        trace: "gray",
    },
};

addColors(customLevels.colors);

/**
 * Translates a log4js pattern string into a Winston format object.
 * Handles common tokens like %d, %p, %m, %c, %n, %h, %z, %%.
 * Supports multiple %d tokens with different format specifiers (e.g., %d{yyyy/MM/dd}, %d{hh:mm:ss}).
 * Strips color codes (%[ and %]).
 * @param pattern The log4js pattern string.
 * @returns A Winston format object.
 */
export function translateLog4jsPattern(
    pattern: string
): ReturnType<typeof format.combine> {
    // Mapping from log4js date format specifiers to dayjs format specifiers
    const mapLog4jsToDayjsFormat = (log4jsFormat: string): string => {
        if (log4jsFormat === "ISO8601_WITH_TZ_OFFSET") {
            // dayjs format for ISO8601 with timezone offset
            return "YYYY-MM-DDTHH:mm:ss.SSSZZ";
        }
        // Basic replacements - dayjs uses similar tokens to log4js/fecha for common cases
        return (
            log4jsFormat
                .replace(/yyyy/g, "YYYY") // Year
                .replace(/yy/g, "YY") // Year, two digits
                // MM is month (already correct)
                // dd is day (use DD for dayjs)
                .replace(/dd/g, "DD")
                // hh is hour (use HH for 24-hour format in dayjs)
                .replace(/hh/g, "HH")
                // mm is minute (already correct)
                // ss is seconds (already correct)
                // SSS is milliseconds (already correct)
                .replace(/O/g, "ZZ")
        ); // Timezone offset
    };

    return format.combine(
        format.timestamp(), // Add timestamp to the info object, default format (ISO)
        format.printf((info) => {
            // Process the pattern for each log entry
            let output = pattern;

            // Handle colorization tokens first (%[ and %]) - simple removal
            output = output.replace(/%\[/g, "").replace(/%\]/g, ""); // Colors first

            const dateTokenRegex = /%d(?:\{([^}]+)\})?/g; // Regex specifically for date tokens
            output = output.replace(
                dateTokenRegex,
                (dateToken, capturedFormat): string => {
                    // Default format for plain %d
                    let formatString = "YYYY-MM-DDTHH:mm:ss.SSS";
                    if (capturedFormat) {
                        // If a format like %d{...} is found, map it
                        formatString = mapLog4jsToDayjsFormat(capturedFormat);
                    }
                    // Use dayjs to format the timestamp with the specific format for this token
                    return dayjs(info.timestamp as string).format(
                        formatString
                    );
                }
            );

            // Regex for non-date, non-color tokens handled previously
            const otherTokenRegex = /(%p|%c|%m|%n|%h|%z|%%)/g;
            output = output.replace(otherTokenRegex, (token): string => {
                // Handle other tokens
                switch (token) {
                    case "%p":
                        return String(info.level).toLocaleUpperCase();
                    case "%m":
                        return String(info.message);
                    case "%n":
                        return "\n";
                    case "%c":
                        return String(info.category || "default");
                    case "%h":
                        return os.hostname();
                    case "%z":
                        return String(process.pid);
                    case "%%":
                        return "%";
                }
            });

            // Add category to info object if not present and %c is in the original pattern
            if (!info.category && pattern.includes("%c")) {
                info.category = "default";
            }
            return output;
        })
    );
}

/**
 * Type guard for log4js appender with a pattern layout.
 */
export function hasPatternLayout(
    appender: unknown
): appender is { layout: { type: "pattern"; pattern: string } } {
    return (
        typeof appender === "object" &&
        appender !== null &&
        "layout" in appender &&
        typeof (appender as any).layout === "object" &&
        (appender as any).layout !== null &&
        (appender as any).layout.type === "pattern" &&
        typeof (appender as any).layout.pattern === "string"
    );
}

// Define default formats outside the main function
const defaultWinstonFormat = format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(
        ({ timestamp, level, message }) =>
            `[${timestamp}] [${level}] ${message}`
    )
);
const defaultWinstonFileFormat = format.combine(
    format.timestamp(),
    format.printf(
        ({ timestamp, level, message }) =>
            `[${timestamp}] [${level}] ${message}`
    )
);

/**
 * Translates a log4js-style config to a winston LoggerOptions config.
 * Supports basic "console" and "file" appenders.
 * Handles basic log4js pattern layouts.
 * @param log4jsConfig The full log4js configuration object.
 * @param level The desired log level for this specific logger configuration.
 * @param includeAppenders An array of appender names to include in the returned transports.
 */
export function log4jsConfigToWinstonConfig(
    log4jsConfig: any,
    level: string,
    includeAppenders: string[]
): LoggerOptions {
    const winstonTransports: any[] = [];
    const allAppenders = log4jsConfig.appenders || {};

    // Map only the specified appenders to winston transports
    for (const appenderName of includeAppenders) {
        const appender = allAppenders[appenderName];
        if (!appender) {
            // eslint-disable-next-line no-console
            console.warn(
                `Appender "${appenderName}" specified for category not found in log4jsConfig.appenders. Skipping.`
            );
            continue;
        }

        let winstonFormat = defaultWinstonFormat; // Default for console
        let winstonFileFormat = defaultWinstonFileFormat; // Default for file

        // Check for layout pattern
        if (hasPatternLayout(appender)) {
            try {
                // Add try-catch for robustness during translation
                const pattern = appender.layout.pattern;
                const translatedFormat = translateLog4jsPattern(pattern);
                // Apply colorize only for console transport formats derived from patterns
                winstonFormat = format.combine(
                    format.colorize(),
                    translatedFormat
                );
                winstonFileFormat = translatedFormat; // No colorize for files
            } catch (error: any) {
                // Log an error or warning if translation fails, and fall back to default
                // eslint-disable-next-line no-console
                console.warn(
                    `Failed to translate log4js pattern for appender "${appenderName}". Falling back to default format. Error: ${error.message}`
                );
                // Keep defaults
            }
        }

        // Use the level passed specifically for this configuration
        const transportLevel = level;

        if (isAppenderWithType(appender, "console")) {
            winstonTransports.push(
                new transports.Console({
                    level: transportLevel,
                    format: winstonFormat,
                })
            );
        } else if (
            isAppenderWithType(appender, "file") ||
            isAppenderWithType(appender, "fileSync")
        ) {
            winstonTransports.push(
                new transports.File({
                    filename: (appender as { filename: string }).filename,
                    level: transportLevel,
                    format: winstonFileFormat, // Use potentially translated format (no color)
                })
            );
        }
        // Add more mappings as needed
    }

    // Use the level passed into the function for this specific logger config
    return {
        levels: customLevels.levels,
        level: level,
        transports: winstonTransports,
        exitOnError: false,
    };
}

// Remove unused helper function
// /**
//  * Helper to get the log level for a given appender/category.
//  */
// function getCategoryLevel(categories: any, appenderName: string): string | undefined {
//     for (const config of Object.values(categories)) {
//         if (
//             typeof config === "object" &&
//             config !== null &&
//             Array.isArray((config as any).appenders) &&
//             ((config as any).appenders as any[]).includes(appenderName)
//         ) {
//             return (config as any).level?.toLowerCase();
//         }
//     }
//     return undefined;
// }

/**
 * Type guard for log4js appender with a specific type.
 */
export function isAppenderWithType(
    appender: unknown,
    type: string
): appender is { type: string; filename?: string } {
    return (
        typeof appender === "object" &&
        appender !== null &&
        "type" in appender &&
        (appender as any).type === type
    );
}
