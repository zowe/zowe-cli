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

import { IHeaderContent } from "@zowe/imperative";
import { ZosmfHeaders } from "@zowe/core-for-zowe-sdk";

/**
 * Enumeration of operation contexts used when generating content-type headers.
 *
 * For USS, ZFS and LIST operations the context is required.
 * For dataset operations the context is optional. If no context is provided,
 * the default behavior applies (i.e. standard "Content-Type" is used).
 *
 * If an operation needs to modify a dataset (create, delete, copy, etc.),
 * then the caller should pass DATASET_MODIFY which causes the IBM header to be used.
 */
export enum ZosFilesContext {
    // For USS operations:
    USS_SINGLE = "uss_single",
    USS_MULTIPLE = "uss_multiple",
    // For non-dataset operations:
    ZFS = "zfs",
    LIST = "list",
    // When passed, dataset operations will use IBM headers
    DATASET_MODIFY = "dataset_modify"
}

/**
 * Utility class for generating REST request headers for ZosFiles operations.

 * This class centralizes header creation logic across all SDK methods.
 */
export class ZosFilesHeaders {

    // ============================//
    // INITIALIZATION & HEADER MAP //
    // ============================//

    /**
     * Initializes the header map with predefined header generation functions.
     * To extend header generation, add new keys and functions here.
     */
    private static headerMap = new Map<string, <T>(options: T, context?: ZosFilesContext) => IHeaderContent | IHeaderContent[]>();
    static initializeHeaderMap() {
        // "from-dataset" always uses JSON (unless no body is needed)
        this.headerMap.set("from-dataset", (context?) => {
            return (context === ZosFilesContext.ZFS || context === ZosFilesContext.LIST)
                ? {}
                : { "Content-Type": "application/json" };
        });
        this.headerMap.set("binary", () => ZosmfHeaders.X_IBM_BINARY);
        this.headerMap.set("responseTimeout", (options) =>
            this.createHeader(ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT, (options as any).responseTimeout)
        );
        this.headerMap.set("recall", (options) =>
            this.getRecallHeader(((options as any).recall || "").toString())
        );
        this.headerMap.set("etag", (options) =>
            this.createHeader("If-Match", (options as any).etag)
        );
        this.headerMap.set("returnEtag", (options) =>
            this.createHeader("X-IBM-Return-Etag", (options as any).returnEtag)
        );
        this.headerMap.set("attributes", (options: any) =>
            options.attributes === true ? ZosmfHeaders.X_IBM_ATTRIBUTES_BASE : undefined
        );
        this.headerMap.set("recursive", () => ZosmfHeaders.X_IBM_RECURSIVE);
        this.headerMap.set("record", () => ZosmfHeaders.X_IBM_RECORD);
        this.headerMap.set("encoding", (options) =>
            this.getEncodingHeader((options as any).encoding)
        );
        this.headerMap.set("localEncoding", (options, context) => {
            const opt = options as any;
            if (context === ZosFilesContext.DATASET_MODIFY) {
                return this.createHeader("X-IBM-Data-Type", opt.localEncoding || "text");
            } else {
                return this.createHeader("Content-Type", opt.localEncoding || ZosmfHeaders.TEXT_PLAIN);
            }
        });
        this.headerMap.set("range", (options) =>
            this.createHeader(ZosmfHeaders.X_IBM_RECORD_RANGE, (options as any).range)
        );
        this.headerMap.set("maxLength", (options) => {
            const max = (options as any).maxLength;
            return max !== undefined ? this.createHeader("X-IBM-Max-Items", max.toString()) : {};
        });
    }
    static {
        this.initializeHeaderMap();
    }

    // =================//
    // HELPER FUNCTIONS //
    // =================//

    /**
     * Returns a header for remote text encoding if an encoding is provided.
     *
     * @param encoding - The remote encoding string.
     * @returns A header object or null.
     */
    private static getEncodingHeader(encoding: string): IHeaderContent {
        if (encoding) {
            return { "X-IBM-Data-Type": `text;fileEncoding=${encoding}` };
        }
        return null;
    }

    /**
     * Adds a header to the headers array. If a header with the same key already exists,
     * it is replaced—unless the "search" flag is true, in which case the header is only added if not already present.
     *
     * @param headers - The array of header objects.
     * @param key - The header key.
     * @param value - The header value.
     * @param search - If true, only add if key is not found.
    */
    private static addHeader(headers: IHeaderContent[], key: string, value: any, search?: boolean): void {
        const existingKeys = headers.flatMap(headerObj => Object.keys(headerObj));
        // If trying to add X-IBM-Data-Type but a Content-Type already exists, skip it.
        if (key === "X-IBM-Data-Type" && existingKeys.includes("Content-Type")) {
            return;
        }
        if (existingKeys.includes(key) && !search) {
            let add = true;
            if (key.toString().toLowerCase().includes("type")) {
                if (!existingKeys.includes("X-IBM-TYPE") && !existingKeys.includes("Content-Type")) {
                    headers[key as any] = value;
                } else {
                    add = false;
                }
            }
            if (add) {
                headers[key as any] = value;
            }
        } else {
            headers.push({ [key]: value });
        }
    }

    /**
     * Creates a header object if the provided value is not null or undefined.
     *
     * @param key - The header key.
     * @param value - The header value.
     * @returns A header object or an empty object.
     */
    private static createHeader(key: string, value: any): IHeaderContent | {} {
        return value != null ? { [key]: value.toString() } : {};
    }

    /**
     * Generates the recall header based on the recall option.
     *
     * @param recall - The recall option (e.g., "wait", "nowait").
     * @returns A recall header.
     */
    private static getRecallHeader(recall: string): IHeaderContent {
        switch (recall.toLowerCase()) {
            case "wait":
                return ZosmfHeaders.X_IBM_MIGRATED_RECALL_WAIT;
            case "nowait":
                return ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT;
            case "error":
                return ZosmfHeaders.X_IBM_MIGRATED_RECALL_ERROR;
            default:
                return ZosmfHeaders.X_IBM_MIGRATED_RECALL_NO_WAIT;
        }
    }

    // ==========================//
    // CONTEXT-BASED HEADER LOGIC//
    // ==========================//

    /**
     * Adds headers based on the operation context.
     *
     * For dataset operations, if context is not provided (i.e. Download) then the default header is
     * "Content-Type": "text/plain". If context is explicitly DATASET_MODIFY, then the IBM header
     * "X-IBM-Data-Type": "text" is used.
     */
    private static addContextHeaders<T>(options: T, context?: ZosFilesContext, dataLength?: number | string):
        { headers: IHeaderContent[], updatedOptions: T } {
        const headers: IHeaderContent[] = [];
        const updatedOptions: any = { ...options || {} };

        if (dataLength !== undefined) {
            this.addHeader(headers, "Content-Length", String(dataLength));
            this.addHeader(headers, "Content-Type", "application/json");
            delete updatedOptions["from-dataset"];
            return { headers, updatedOptions };
        }

        // If context is USS_SINGLE, USS_MULTIPLE, ZFS, or LIST, handle them separately.
        if (context === ZosFilesContext.USS_MULTIPLE) {
            this.addHeader(headers, "Content-Type", "application/json");
            delete updatedOptions["localEncoding"];
        } else if (context === ZosFilesContext.USS_SINGLE) {
            if (updatedOptions.binary) {
                headers.push(ZosmfHeaders.X_IBM_BINARY);
                delete updatedOptions["binary"];
            } else if (updatedOptions.encoding) {
                const keys: string[] = Object.keys(ZosmfHeaders.X_IBM_TEXT);
                const value = ZosmfHeaders.X_IBM_TEXT[keys[0]] +
                              ZosmfHeaders.X_IBM_TEXT_ENCODING +
                              updatedOptions.encoding;
                const encodingHeader: any = {};
                encodingHeader[keys[0]] = value;
                headers.push(encodingHeader);
                delete updatedOptions["encoding"];
                if (updatedOptions.localEncoding) {
                    headers.push({ "Content-Type": updatedOptions.localEncoding });
                } else {
                    headers.push(ZosmfHeaders.TEXT_PLAIN);
                }
            } else {
                if (updatedOptions.localEncoding) {
                    headers.push({ "Content-Type": updatedOptions.localEncoding });
                } else {
                    headers.push(ZosmfHeaders.TEXT_PLAIN);
                }
            }
            delete updatedOptions["localEncoding"];
        } else if (context === ZosFilesContext.ZFS || context === ZosFilesContext.LIST) {
            if (!updatedOptions.maxLength) {
                updatedOptions.maxLength = 0;
            }
        } else {
            // Default: dataset operations.
            // If context is DATASET_MODIFY then use IBM header; otherwise, use download defaults.
            const useLegacy = context === ZosFilesContext.DATASET_MODIFY;
            if (updatedOptions.binary) {
                if (updatedOptions.binary === true) {
                    headers.push(ZosmfHeaders.X_IBM_BINARY);
                    delete updatedOptions["binary"];
                }
            } else if (updatedOptions.record) {
                if (updatedOptions.record === true) {
                    headers.push(ZosmfHeaders.X_IBM_RECORD);
                    delete updatedOptions["record"];
                }
            } else {
                if (updatedOptions.encoding) {
                    const keys: string[] = Object.keys(ZosmfHeaders.X_IBM_TEXT);
                    const value = ZosmfHeaders.X_IBM_TEXT[keys[0]] +
                                  ZosmfHeaders.X_IBM_TEXT_ENCODING +
                                  updatedOptions.encoding;
                    const encodingHeader: any = {};
                    encodingHeader[keys[0]] = value;
                    headers.push(encodingHeader);
                    delete updatedOptions["encoding"];
                }
                if (updatedOptions.localEncoding) {
                    if (useLegacy) {
                        headers.push({ "X-IBM-Data-Type": updatedOptions.localEncoding });
                    } else {
                        headers.push({ "Content-Type": updatedOptions.localEncoding });
                    }
                    delete updatedOptions["localEncoding"];
                } else {
                    // If dsntype is LIBRARY, no header is added.
                    if (!(updatedOptions.dsntype && updatedOptions.dsntype.toUpperCase() === "LIBRARY")) {
                        if (useLegacy) {
                            this.addHeader(headers, "X-IBM-Data-Type", "text", true);
                        } else {
                            this.addHeader(headers, "Content-Type", "text/plain", true);
                        }
                    }
                }
            }
        }
        return { headers, updatedOptions };
    }

    // ============//
    // MAIN METHOD //
    // ============//

    /**
     * Generates an array of headers based on provided options and context.
     *
     * @param options - The request options.
     * @param context - (optional) The operation context from {@link ZosFilesContext}.
     * @param dataLength - (optional) The content length.
     * @returns An array of generated headers.
     */
    public static generateHeaders<T>({
        options,
        context,
        dataLength,
    }: { options: T; context?: ZosFilesContext; dataLength?: number | string }): IHeaderContent[] {
        const { headers: reqHeaders, updatedOptions } = this.addContextHeaders(options, context, dataLength);
        this.addHeader(reqHeaders, "Accept-Encoding", "gzip");

        // Add additional headers based on options
        Object.entries(updatedOptions || {})
            .filter(([key]) => this.headerMap.has(key))
            .forEach(([key]) => {
                const result = this.headerMap.get(key)?.(updatedOptions, context);
                if (result) {
                    const headerKey = Object.keys(result)[0];
                    const headerValue = Object.values(result)[0];

                    // Only add the header if the value is defined
                    if (headerValue !== undefined) {
                        this.addHeader(reqHeaders, headerKey, headerValue);
                    }
                }
            });

        return reqHeaders;
    }
}