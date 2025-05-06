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

// Regex to find tokens, including potential format specifiers like %d{...}
const tokenRegex = /(%d(?:\{[^}]+\})?|%p|%c|%m|%n|%h|%z|%%|%\[|%\])/g;

/**
 * Translates a log4js pattern string into a Winston format object.
 * Handles common tokens like %d, %p, %m, %c, %n, %h, %z, %%.
 * Basic support for %d{ISO8601_WITH_TZ_OFFSET} or other format strings.
 * Strips color codes (%[ and %]).
 * @param pattern The log4js pattern string.
 * @returns A Winston format object.
 */
function translateLog4jsPattern(pattern: string): ReturnType<typeof format.combine> {
    let timestampFormat: string | undefined = undefined;
    const isoRegex = /%d\{([^}]+)\}/;
    const match = pattern.match(isoRegex);

    if (match && match[1]) {
        // Basic mapping for common formats, needs refinement
        if (match[1] === "ISO8601_WITH_TZ_OFFSET") {
            // Attempt to map to a format winston understands by default
            // This might require luxon or moment if not built-in
            timestampFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZZ";
        } else {
            timestampFormat = match[1]; // Assume it's a format string winston understands
        }
        // Remove the format specifier from the pattern string for simpler replacement later
        pattern = pattern.replace(isoRegex, "%d");
    }

    return format.combine(
        format.timestamp({ format: timestampFormat }), // Apply timestamp format if found
        format.printf(info => {
            let output = pattern;
            // Handle colorization tokens (%[ and %]) - simple removal for now
            output = output.replace(/%\[/g, "").replace(/%\]/g, "");

            // Replace standard tokens
            // Use a function for replacement to handle different info properties
            // Ensure the callback always returns a string
            output = output.replace(tokenRegex, (token): string => {
                switch (token) {
                    case "%d": return String(info.timestamp); // Ensure string
                    case "%p": return String(info.level);     // Ensure string
                    case "%m": return String(info.message);   // Ensure string
                    case "%n": return "\n";
                    case "%c": return String(info.category || "default"); // Ensure string
                    case "%h": return os.hostname();
                    case "%z": return String(process.pid);
                    case "%%": return "%";
                    default:
                        // Handle %d{...} case if not already replaced (though it should be)
                        if (token.startsWith("%d{")) return String(info.timestamp); // Ensure string
                        return token; // Keep unrecognized tokens as is (already string)
                }
            });
            // Add category to info object if not present, for %c token
            if (!info.category && pattern.includes("%c")) {
                info.category = "default"; // Or derive from somewhere if possible
            }
            return output;
        })
    );
}

/**
 * Type guard for log4js appender with a pattern layout.
 */
function hasPatternLayout(appender: unknown): appender is { layout: { type: "pattern"; pattern: string } } {
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
    format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`)
);
const defaultWinstonFileFormat = format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`)
);

/**
 * Translates a log4js-style config to a winston LoggerOptions config.
 * Supports basic "console" and "file" appenders and categories.
 * Handles basic log4js pattern layouts.
 */
export function log4jsConfigToWinstonConfig(log4jsConfig: any): LoggerOptions {
    const winstonTransports: any[] = [];
    const appenders = log4jsConfig.appenders || {};
    const categories = log4jsConfig.categories || {};

    // Map appenders to winston transports
    for (const [name, appender] of Object.entries(appenders)) {
        let winstonFormat = defaultWinstonFormat; // Default for console
        let winstonFileFormat = defaultWinstonFileFormat; // Default for file

        // Check for layout pattern
        if (hasPatternLayout(appender)) {
            try { // Add try-catch for robustness during translation
                const pattern = appender.layout.pattern;
                const translatedFormat = translateLog4jsPattern(pattern);
                // Apply colorize only for console transport formats derived from patterns
                winstonFormat = format.combine(format.colorize(), translatedFormat);
                winstonFileFormat = translatedFormat; // No colorize for files
            } catch (error: any) {
                // Log an error or warning if translation fails, and fall back to default
                // eslint-disable-next-line no-console
                console.warn(`Failed to translate log4js pattern for appender "${name}". Falling back to default format. Error: ${error.message}`);
                // Keep default
            }
        }

        if (isAppenderWithType(appender, "console")) {
            winstonTransports.push(
                new transports.Console({
                    level: getCategoryLevel(categories, name) || "info",
                    format: winstonFormat // Use potentially translated format
                })
            );
        } else if (isAppenderWithType(appender, "file") || isAppenderWithType(appender, "fileSync")) {
            winstonTransports.push(
                new transports.File({
                    filename: (appender as { filename: string }).filename,
                    level: getCategoryLevel(categories, name) || "info",
                    format: winstonFileFormat // Use potentially translated format (no color)
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
    for (const config of Object.values(categories)) {
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
