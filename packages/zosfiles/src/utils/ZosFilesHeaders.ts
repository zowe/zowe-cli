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
 * Utility class for generating REST request headers for ZosFiles operations.
 *
 * This class centralizes header creation logic across all SDK methods. It uses a header map
 * to associate specific option keys with header generation functions. To add a new global header,
 * simply add a new entry to the header map in the `initializeHeaderMap()` method.
 */
export class ZosFilesHeaders {

   // INITIALIZATION //

   /**
   * Initializes the header map with predefined header generation functions.
   * To extend header generation, add new keys and functions here.
   */
    private static headerMap = new Map<string, <T>(options: T, context?: string) => IHeaderContent | IHeaderContent[]>();
    static initializeHeaderMap() {
        this.headerMap.set("from-dataset", (context?) => {
            // For dataset operations, use APPLICATION_JSON unless context is "zfs"
            return context === "zfs" ? {} : ZosmfHeaders.APPLICATION_JSON;
        });
        this.headerMap.set("binary",  (options) => this.generateBinaryHeaders((options as any).binary));
        this.headerMap.set("responseTimeout", (options) => this.createHeader(ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT, (options as any).responseTimeout));
        this.headerMap.set("recall", (options) => this.getRecallHeader(((options as any).recall || "").toString()));
        this.headerMap.set("etag", (options) => this.createHeader("If-Match", (options as any).etag));
        this.headerMap.set("returnEtag", (options) => this.createHeader("X-IBM-Return-Etag", (options as any).returnEtag));
        this.headerMap.set("maxLength", (options) => this.createHeader("X-IBM-Max-Items", (options as any).maxLength));
        this.headerMap.set("attributes", () => ZosmfHeaders.X_IBM_ATTRIBUTES_BASE);
        this.headerMap.set("recursive", () => ZosmfHeaders.X_IBM_RECURSIVE);
        this.headerMap.set("record", () => ZosmfHeaders.X_IBM_RECORD);
        this.headerMap.set("encoding", (options) => this.getEncodingHeader((options as any).encoding));
        this.headerMap.set("localEncoding", (options) =>
            this.createHeader("Content-Type", (options as any).localEncoding || ZosmfHeaders.TEXT_PLAIN)
        );
        this.headerMap.set("range", (options) => this.createHeader(ZosmfHeaders.X_IBM_RECORD_RANGE, (options as any).range));
    }

    static {
        this.initializeHeaderMap();
    }

  // HELPER FUNCTIONS FOR MODE-SPECIFIC HEADER GENERATION //

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
     * Generates headers for binary mode.
     *
     * Returns:
     *  - Content-Type: "application/octet-stream"
     *  - X-IBM-Data-Type: "binary"
     *
     * This function removes the `binary` property from the options.
     * @param updatedOptions - The options object (by reference).
     * @returns An array of header objects.
     */
    private static generateBinaryHeaders(updatedOptions: any): IHeaderContent[] {
        const headers: IHeaderContent[] = [];
        headers.push({ "Content-Type": "application/octet-stream" });
        headers.push({ "X-IBM-Data-Type": "binary" });
        delete updatedOptions["binary"];
        return headers;
    }


    /**
     * Adds headers related to binary, record, encoding, and localEncoding based on the context.
     *
     * @template T - The type of the options object.
     * @param {T} options - The options object.
     * @param {string} [context] - The context in which the headers are being added.
     *  ie: "buffer","stream", "uss", "zfs"
     * @return {IHeaderContent[]} - An array of IHeaderContent representing the headers.
     */
    private static addContextHeaders<T>(options: T, context?: string, dataLength?: number | string): {headers: IHeaderContent[], updatedOptions: T} {
        const headers: IHeaderContent[] = [];
        const updatedOptions: any = { ...options || {} };

        if (dataLength !== undefined) {
            //if content length, most likely application/json as well
            this.addHeader(headers, "Content-Length", String(dataLength));
            this.addHeader(headers, "Content-Type", "application/json");
            return {headers, updatedOptions};
        }

        switch (context) {
            case "stream":
            case "buffer":
                if (updatedOptions.binary) {
                    if (updatedOptions.binary === true) {
                        this.generateBinaryHeaders(updatedOptions);
                    }
                } else if (updatedOptions.record) {
                    if (updatedOptions.record === true) {
                        headers.push(ZosmfHeaders.X_IBM_RECORD);
                        delete updatedOptions["record"];
                    }
                } else {
                    if (updatedOptions.encoding) {
                        const keys: string[] = Object.keys(ZosmfHeaders.X_IBM_TEXT);
                        const value =
                            ZosmfHeaders.X_IBM_TEXT[keys[0]] +
                            ZosmfHeaders.X_IBM_TEXT_ENCODING +
                            updatedOptions.encoding;
                        const header: any = Object.create(ZosmfHeaders.X_IBM_TEXT);
                        header[keys[0]] = value;
                        headers.push(header);
                        delete updatedOptions["encoding"];
                    } else {
                        headers.push(ZosmfHeaders.X_IBM_TEXT);
                    }
                    if (updatedOptions.localEncoding) {
                        headers.push({ "Content-Type": updatedOptions.localEncoding });
                        delete updatedOptions["localEncoding"];
                    } else {
                        headers.push(ZosmfHeaders.TEXT_PLAIN);
                    }
                }
                break;
            case "uss":
                // For USS operations, force JSON content type.
                headers.push(ZosmfHeaders.APPLICATION_JSON);
                break;
            case "zfs":
                // For ZFS operations, do not add any content-type header.
                break;
            default: {
                // Add text X-IBM-Data-Type if no content header is present
                    // only if options don't include dsntype LIBRARY
                if (!(updatedOptions.dsntype && updatedOptions.dsntype.toUpperCase() === "LIBRARY")) {
                    this.addHeader(headers, "X-IBM-Data-Type", "text", true);
                }
            }
        }

        return {headers, updatedOptions};
    }

    /**
     * Adds a header to the headers array, replacing existing entries if necessary.
     *
     * @param headers - Array of headers to modify.
     * @param key - Header key.
     * @param value - Header value.
     */
    private static addHeader(headers: IHeaderContent[], key: string, value: any, search?: boolean): void {
        // Overwrite if the key already exists, or push a new key-value pair if it doesn't
        // if search is true, only add headers if not found, don't overwrite
        const reqKeys = headers.flatMap(headerObj => Object.keys(headerObj));
        if (reqKeys.includes(key) && !search) {
            headers[key as any] = value;
        }else {
            headers.push({ [key]: value });
        }
    }

    /**
     * Creates a header object if the value is not null or undefined.
     *
     * @param key - The header key.
     * @param value - The header value.
     * @returns An object containing the key-value pair if the value exists, otherwise null.
     */
    private static createHeader(key: string, value: any): IHeaderContent | {} {
        return value != null ? { [key]: value.toString() } : {}; // Return an empty object instead of null
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

    // PUBLIC METHODS //

    /**
     * Generates an array of headers based on provided options and context.
     *
     * @param options - The request options.
     * @param context - The operation context (optional) ie "stream" or "buffer".
     * @param dataLength - The content length (optional).
     * @returns An array of generated headers.
     */
    public static generateHeaders<T>({
        options,
        context,
        dataLength,
    }: { options: T; context?: string; dataLength?: number | string }): IHeaderContent[] {
        const { headers: reqHeaders, updatedOptions } = this.addContextHeaders(options, context, dataLength);

        this.addHeader(reqHeaders, "Accept-Encoding", "gzip");

        Object.entries(updatedOptions || {})
            .filter(([key]) => this.headerMap.has(key))
            .forEach(([key]) => {
                const result = this.headerMap.get(key)?.(updatedOptions, context);
                if (result) {
                    this.addHeader(reqHeaders, Object.keys(result)[0], Object.values(result)[0]);
                }
            });

        return reqHeaders;
    }
}