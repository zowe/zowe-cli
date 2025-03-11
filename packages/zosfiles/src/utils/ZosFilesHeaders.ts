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
 * These different contexts along with passed in options are used to apply the appropriate
 * content-type header, with the default being: { "X-IBM-Data-Type": "text" }
 */
export enum ZosFilesContext {
    USS_MULTIPLE = "uss_multiple", //general content-header (json)
    DOWNLOAD = "download", // options.localEncoding matters
    UPLOAD = "upload", // might add an octet-stream header, options.encoding matters
    ZFS = "zfs", //no content-headers
    LIST = "list", //no content-headers
}

/**
 * This class centralizes REST request headers creation logic across all ZosFiles methods.
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
        // "from-dataset" always uses JSON (unless context is ZFS or LIST)
        this.headerMap.set("from-dataset", (context?) => {
            return context === ZosFilesContext.ZFS || context === ZosFilesContext.LIST ? {} : { "Content-Type": "application/json" };
        });
        this.headerMap.set("binary", (options) => (options as any).binary === true ? ZosmfHeaders.X_IBM_BINARY : undefined);
        this.headerMap.set("record", (options) => (options as any).binary !== true ? ZosmfHeaders.X_IBM_RECORD : undefined);
        this.headerMap.set("responseTimeout", (options) => this.createHeader(ZosmfHeaders.X_IBM_RESPONSE_TIMEOUT, (options as any).responseTimeout));
        this.headerMap.set("recall", (options) => this.getRecallHeader(((options as any).recall || "").toString()));
        this.headerMap.set("etag", (options) => this.createHeader("If-Match", (options as any).etag));
        this.headerMap.set("returnEtag", (options) => this.createHeader("X-IBM-Return-Etag", (options as any).returnEtag));
        this.headerMap.set("attributes", (options: any) => options.attributes === true ? ZosmfHeaders.X_IBM_ATTRIBUTES_BASE : undefined);
        this.headerMap.set("recursive", () => ZosmfHeaders.X_IBM_RECURSIVE);
        this.headerMap.set("range", (options) => this.createHeader(ZosmfHeaders.X_IBM_RECORD_RANGE, (options as any).range));
        this.headerMap.set("maxLength", (options) => {
            const max = (options as any).maxLength;
            return max !== undefined ? this.createHeader("X-IBM-Max-Items", max.toString()) : {};
        });
        this.headerMap.set("encoding", (options) => this.getEncodingHeader((options as any).encoding));
        this.headerMap.set("localEncoding", (options, context) => {
            const opt = options as any;
            let header: IHeaderContent | IHeaderContent[] = [];
            if (opt.localEncoding != null) {
                if (context === ZosFilesContext.DOWNLOAD || context === ZosFilesContext.UPLOAD) {
                    // Use Content-Type header for download/upload context
                    header = this.createHeader("Content-Type", opt.localEncoding);
                } else {
                    // Use default IBM-Data-Type header
                    header = this.createHeader("X-IBM-Data-Type", opt.localEncoding);
                }
            }
            return header;
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
     * @param encoding - Option indicating remote string's encoding.
     * @returns A header object.
     */
    private static getEncodingHeader(encoding: string): IHeaderContent {
        if (encoding != null) {
            return { "X-IBM-Data-Type": `text;fileEncoding=${encoding}` };
        }
        return { "X-IBM-Data-Type": "text" };
    }

    /**
     * Adds a header to the headers array.
     *
     * If a header with the same key already exists, it is replaced.
     * Unless the "replace" flag is false, then the header is added if it's key isn't in existingKeys.
     *
     * @param headers - The array of header objects.
     * @param key - The header key.
     * @param value - The header value.
     * @param replace - If true, replace the header value if the key already exists.
     */
    private static addHeader(headers: IHeaderContent[], key: string, value: any, replace?: boolean): void {
        const existingIndex = headers.findIndex((headerObj) => Object.keys(headerObj).includes(key));
        if (existingIndex !== -1 && replace) {
            headers[existingIndex] = { [key]: value }; // Replace the existing header
        } else if (existingIndex === -1) {
            headers.push({ [key]: value }); // Add a new header
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
     * Adds type-headers based on the operation context
     *
     */
    private static addContextHeaders<T>(
        options: T,
        context?: ZosFilesContext,
        dataLength?: number | string
    ): { headers: IHeaderContent[]; updatedOptions: T } {
        const headers: IHeaderContent[] = [];
        const updatedOptions: any = { ...options || {} };

        if (dataLength !== undefined) {
            this.addHeader(headers, "Content-Length", String(dataLength));
            this.addHeader(headers, "Content-Type", "application/json");
            delete updatedOptions["from-dataset"];
            return { headers, updatedOptions };
        }

        switch (context) {
            case ZosFilesContext.DOWNLOAD:
                if (updatedOptions.binary === true) {
                    this.addHeader(headers, "X-IBM-Data-Type", "binary");
                    delete updatedOptions["binary"]; //remove option to prevent duplication
                    delete updatedOptions["encoding"]; //remove option to prevent duplication
                    delete updatedOptions["record"]; // binary conflicts with record and takes precedence
                } else {
                    if (!updatedOptions.record) {
                        if (!(updatedOptions.dsntype && updatedOptions.dsntype.toUpperCase() === "LIBRARY")) {
                            if (typeof updatedOptions.localEncoding === "string" || updatedOptions.localEncoding === undefined) {
                                this.addHeader(headers, "Content-Type", updatedOptions.localEncoding || "text/plain");
                                delete updatedOptions["localEncoding"]; //remove option to prevent duplication
                            }
                        }
                    }
                }
                break;
            case ZosFilesContext.UPLOAD:
                if (updatedOptions.binary === true) {
                    this.addHeader(headers, "X-IBM-Data-Type", "binary");
                    this.addHeader(headers, "Content-Type", "application/octet-stream");
                    delete updatedOptions["binary"]; //remove option to prevent duplication
                    delete updatedOptions["encoding"]; //remove option to prevent duplication
                    delete updatedOptions["record"]; // binary conflicts with record and takes precedence
                } else {
                    if (!updatedOptions.record) {
                        if (typeof updatedOptions.encoding === "string" || updatedOptions.encoding === undefined) {
                            const encodingHeader = this.getEncodingHeader((options as any).encoding);
                            this.addHeader(headers, "X-IBM-Data-Type", encodingHeader["X-IBM-Data-Type"]);
                            delete updatedOptions["encoding"]; //remove option to prevent duplication
                        } else {
                            this.addHeader(headers, "X-IBM-Data-Type", "text");
                        }
                    }
                }
                break;
            case ZosFilesContext.ZFS:
                break; //no content headers
            case ZosFilesContext.LIST: //no content headers
                //check to prevent a potential null assignment
                if (!updatedOptions.maxLength) {
                    updatedOptions.maxLength = 0;
                }
                break;
            case ZosFilesContext.USS_MULTIPLE: //general content-header
                this.addHeader(headers, "Content-Type", "application/json");
                break;
            default:
                //default content-type header
                if (!(updatedOptions.dsntype && updatedOptions.dsntype.toUpperCase() === "LIBRARY")) {
                    this.addHeader(headers, "X-IBM-Data-Type", "text");
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
    }: {
        options: T;
        context?: ZosFilesContext;
        dataLength?: number | string;
    }): IHeaderContent[] {
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
                        this.addHeader(reqHeaders, headerKey, headerValue, true);
                    }
                }
            });
        return reqHeaders;
    }
}
