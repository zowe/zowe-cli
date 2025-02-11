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
 * Utility class for generating headers for ZosFiles requests.
 * Provides methods to dynamically generate headers based on upload/download options.
 */
export class ZosFilesHeaders {

///////////////////////////
// CLASS VARIABLES & INIT //
///////////////////////////

    /**
     * Map to store header generation functions for specific options.
     */
    private static headerMap = new Map<string, <T>(options: T, context?: string) => IHeaderContent | IHeaderContent[]>();

    /**
     * Initializes the header map with predefined header generation functions.
     */
    static initializeHeaderMap() {
        this.headerMap.set("from-dataset", () => ZosmfHeaders.APPLICATION_JSON);
        this.headerMap.set("responseTimeout", (options) => this.createHeader(ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT, (options as any).responseTimeout));
        this.headerMap.set("recall", (options) => this.getRecallHeader(((options as any).recall || "").toString()));
        this.headerMap.set("etag", (options) => this.createHeader("If-Match", (options as any).etag));
        this.headerMap.set("returnEtag", (options) => this.createHeader("X-IBM-Return-Etag", (options as any).returnEtag));
        this.headerMap.set("maxLength", (options) => this.createHeader("X-IBM-Max-Items", (options as any).maxLength));
        this.headerMap.set("attributes", () => ZosmfHeaders.X_IBM_ATTRIBUTES_BASE);
    }

    /**
     * Static initialization block to ensure header map is populated.
     */
    static {
        this.initializeHeaderMap();
    }

//////////////////////
// HELPER METHODS //
//////////////////////

    /**
     * Add headers related to binary, record, encoding, and localEncoding based on possible context
     *
     * @param {T} options - The options object.
     * @param {string} context - The context in which the headers are being added ie: "stream", "buffer"
     * @return {{ headers: IHeaderContent[], updatedOptions: T }} - An object containing the updated headers and options.
     */
    private static addContextHeaders<T>(options: T, context: string): { headers: IHeaderContent[], updatedOptions: T } {

        const headers: IHeaderContent[] = [];
        const updatedOptions: any = { ...options }; // for later removal of these soon-to-be processed options

        switch (context) {
            case "stream":
            case "buffer":
                if (updatedOptions.binary) {
                    if (updatedOptions.binary == true) {
                        headers.push(ZosmfHeaders.OCTET_STREAM);
                        headers.push(ZosmfHeaders.X_IBM_BINARY);
                    }
                } else if (updatedOptions.record) {
                    if (updatedOptions.record == true) {
                        headers.push(ZosmfHeaders.X_IBM_RECORD);
                    }
                } else {
                    if (updatedOptions.encoding) {
                        const keys: string[] = Object.keys(ZosmfHeaders.X_IBM_TEXT);
                        const value = ZosmfHeaders.X_IBM_TEXT[keys[0]] + ZosmfHeaders.X_IBM_TEXT_ENCODING + updatedOptions.encoding;
                        const header: any = Object.create(ZosmfHeaders.X_IBM_TEXT);
                        header[keys[0]] = value;
                        headers.push(header);
                    } else {
                        headers.push(ZosmfHeaders.X_IBM_TEXT);
                    }
                    if (updatedOptions.localEncoding) {
                        headers.push({ 'Content-Type': updatedOptions.localEncoding });
                    } else {
                        headers.push(ZosmfHeaders.TEXT_PLAIN);
                    }
                }
            default: {
                const contentTypeHeaders = [...Object.keys(ZosmfHeaders.X_IBM_BINARY),
                    ...Object.keys(ZosmfHeaders.X_IBM_RECORD),
                    ...Object.keys(ZosmfHeaders.X_IBM_TEXT)];
                if (!headers.find((x) => contentTypeHeaders.includes(Object.keys(x)[0]))) {
                    headers.push(ZosmfHeaders.X_IBM_TEXT);
                }
            }
        }

        // Remove processed options
        ["binary", "record", "encoding", "localEncoding"].forEach(key => delete updatedOptions[key]);

        return { headers, updatedOptions };
    }

    /**
     * Adds a header to the headers array, replacing existing entries if necessary.
     *
     * @param headers - Array of headers to modify.
     * @param key - Header key.
     * @param value - Header value.
     */
    private static addHeader(headers: IHeaderContent[], key: string, value: any): void {
        // Overwrite if the key already exists, or push a new key-value pair if it doesn't
        const reqKeys = headers.flatMap(headerObj => Object.keys(headerObj));
        if (reqKeys.includes(key)){
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
    private static createHeader(key: string, value: any): IHeaderContent | null {
        return value != null ? { [key]: value.toString() } : null;
    }

    /**
     * Generates the recall header based on the recall option.
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

//////////////////////
// PUBLIC METHODS //
//////////////////////

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
        const { headers: reqHeaders, updatedOptions } = this.addContextHeaders(options, context);

        this.addHeader(reqHeaders, "Accept-Encoding", "gzip");

        Object.entries(updatedOptions)
            .filter(([key]) => this.headerMap.has(key))
            .forEach(([key]) => {
                const result = this.headerMap.get(key)?.(updatedOptions);
                if (result) {
                    this.addHeader(reqHeaders, Object.keys(result)[0], Object.values(result)[0]);
                }
            });

        if (dataLength !== undefined) {
            this.addHeader(reqHeaders, "Content-Length", String(dataLength));
        }

        return reqHeaders;
    }
}