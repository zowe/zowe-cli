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
import { Headers } from "@zowe/imperative";

/**
 * Enumeration of operation contexts (USS,ZFS or Dataset-related) used when generating content-type headers.
 *
 * - **DATASET**: Used for transferring datasets (ie upload/download). Headers added based on options (binary, encoding, etc).
 * - **USS_SINGLE**: Used when transferring a single USS file. USS-specific headers for encoding and file naming.
 * - **USS_MULTIPLE**: Used when handling multiple USS files in one operation. In this context, JSON content-type is forced.
 * - **ZFS**: Used for ZFS operations. No content-type headers needed
 * - **LIST**: Used getting metadata for files or datasets. No content-type headers needed.
 */
export enum ZosFilesContext {
    DATASET = "dataset",
    USS_SINGLE = "uss_single",
    USS_MULTIPLE = "uss_multiple",
    //no content-type headers:
    ZFS = "zfs",
    LIST = "list"
}

/**
 * Utility class for generating REST request headers for ZosFiles operations.
 *
 * This class centralizes header creation logic across all SDK methods. It uses a header map
 * to associate specific options as keys with header generation functions as values. To add a new global header,
 * simply add a new entry to the header map in the `initializeHeaderMap()` method.
 */
export class ZosFilesHeaders {

    // ===============//
    // INITIALIZATION //
    // ===============//

    /**
     * Initializes the header map with predefined header generation functions.
     * To extend header generation, add new keys and functions here.
     */
    private static headerMap = new Map<string, <T>(options: T, context?: ZosFilesContext) => IHeaderContent | IHeaderContent[]>();
    static initializeHeaderMap() {
        this.headerMap.set("from-dataset", (context?) => {
            // For dataset operations, use APPLICATION_JSON unless context is "zfs"
            return context === ZosFilesContext.ZFS ? {} : Headers.APPLICATION_JSON;
        });
        this.headerMap.set("binary", () => ZosmfHeaders.X_IBM_BINARY);
        this.headerMap.set("responseTimeout", (options) => this.createHeader(ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT, (options as any).responseTimeout));
        this.headerMap.set("recall", (options) => this.getRecallHeader(((options as any).recall || "").toString()));
        this.headerMap.set("etag", (options) => this.createHeader("If-Match", (options as any).etag));
        this.headerMap.set("returnEtag", (options) => this.createHeader("X-IBM-Return-Etag", (options as any).returnEtag));
        this.headerMap.set("attributes", (options: any) => options.attributes === true ? ZosmfHeaders.X_IBM_ATTRIBUTES_BASE : undefined);
        this.headerMap.set("recursive", () => ZosmfHeaders.X_IBM_RECURSIVE);
        this.headerMap.set("record", () => ZosmfHeaders.X_IBM_RECORD);
        this.headerMap.set("encoding", (options) => this.getEncodingHeader((options as any).encoding));
        this.headerMap.set("localEncoding", (options) =>
            this.createHeader("Content-Type", (options as any).localEncoding || ZosmfHeaders.TEXT_PLAIN)
        );
        this.headerMap.set("range", (options) => this.createHeader(ZosmfHeaders.X_IBM_RECORD_RANGE, (options as any).range));
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
     * @param encoding - The remote encoding string.
     * @returns A header object or null.
     */
    private static getEncodingHeader(encoding: string): IHeaderContent {
        if (encoding) {
            return { "X-IBM-Data-Type": `text;fileEncoding=${encoding}` };
        }
        return null; // Ensure a valid return type
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
        const reqKeys = headers.flatMap(headerObj => Object.keys(headerObj));
        if (reqKeys.includes(key) && !search) {
            let add = true;
            if (key.toString().toLowerCase().includes("type")) {
                const existingKeys = headers.flatMap(headerObj => Object.keys(headerObj));
                if (!existingKeys.includes("X-IBM-TYPE") && !existingKeys.includes("Content-Type")) {
                    headers[key as any] = value;
                } else {
                    add = false;
                }
            }
            if (add) {
                headers[key as any] = value;
            }
        }else {
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

    // =============================================================//
    // CONTEXT HEADERS CREATION: Upload/Download, USS, ZFS, Dataset //
    // =============================================================//

    /**
     * Adds headers based on the operation context (USS, ZFS or Datasets).
     *
     *
     * @template T - Variably-typed options object.
     * @param options - The request options.
     * @param context - (Optional operation context determined by ZosFilesContext enum.
     * @param dataLength - (Optional) The content length.
     * @returns An object with:
     *    - `headers`: The array of generated headers.
     *    - `updatedOptions`: The options object with already-processed properties removed.
     */
    private static addContextHeaders<T>(options: T, context?: ZosFilesContext, dataLength?: number | string):
        { headers: IHeaderContent[], updatedOptions: T } {
    const headers: IHeaderContent[] = [];
    const updatedOptions: any = { ...options || {} };

    if (dataLength !== undefined) {
        // if content length is provided, then use JSON content type regardless of context
        this.addHeader(headers, "Content-Length", String(dataLength));
        this.addHeader(headers, "Content-Type", "application/json");
        delete updatedOptions["from-dataset"];
        return { headers, updatedOptions };
    }

    // Determine Type headers:
    switch (context) {
        case ZosFilesContext.DATASET:
            // For dataset transfers, allow binary, record, encoding and localEncoding options.
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
                    headers.push({ "Content-Type": updatedOptions.localEncoding });
                    delete updatedOptions["localEncoding"];
                } else {
                    // Add text X-IBM-Data-Type if no content header is present
                    // only if options don't include dsntype LIBRARY
                    if (!(updatedOptions.dsntype && updatedOptions.dsntype.toUpperCase() === "LIBRARY")) {
                        this.addHeader(headers, "X-IBM-Data-Type", "text", true);
                    }
                }
            }
            break;
        case ZosFilesContext.USS_MULTIPLE:
            // For multiple USS files, force JSON content type.
            this.addHeader(headers, "Content-Type", "application/json");
            // Remove localEncoding to avoid adding a fallback later.
            delete updatedOptions["localEncoding"];
            break;
        case ZosFilesContext.USS_SINGLE:
            // For a single USS file, allow similar processing to dataset transfers
            // but with USS-specific logic.
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
                // Use provided localEncoding if present; otherwise default to TEXT_PLAIN.
                if (updatedOptions.localEncoding) {
                    headers.push({ "Content-Type": updatedOptions.localEncoding });
                } else {
                    headers.push(ZosmfHeaders.TEXT_PLAIN);
                }
            } else {
                // No encoding provided: use localEncoding if available; otherwise default.
                if (updatedOptions.localEncoding) {
                    headers.push({ "Content-Type": updatedOptions.localEncoding });
                } else {
                    headers.push(ZosmfHeaders.TEXT_PLAIN);
                }
            }
            delete updatedOptions["localEncoding"];
            break;
        // no content type is needed for zfs and list operations:
        case ZosFilesContext.ZFS:
        case ZosFilesContext.LIST:
            if (!updatedOptions.maxLength) {
                updatedOptions.maxLength = 0;
            }
            break;
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
     * @param context - The operation context from {@link ZosFilesContext}.
     * @param dataLength - (optional) The content length.
     * @returns An array of generated headers.
     */
    public static generateHeaders<T>({
        options,
        context,
        dataLength,
    }: { options: T; context: ZosFilesContext; dataLength?: number | string }): IHeaderContent[] {
        // Apply headers related to content-type
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