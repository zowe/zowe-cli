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

import { HTTP_VERB } from "../types/HTTPVerb";
import { Writable, Readable } from "stream";
import { ITaskWithStatus } from "../../../../operations";
import { IRequestAdapter } from "./IRequestAdapter";
import { AbstractSession } from "../../session/AbstractSession";
import { ImperativeError } from "../../../../error";
import { Logger } from "../../../../logger";

/**
 * Web implementation of the request adapter using the fetch API
 * @export
 * @class WebRequestAdapter
 * @implements {IRequestAdapter}
 */
export class WebRequestAdapter implements IRequestAdapter {
    private mLogger: Logger;
    private mResponse: Response;
    private mContentEncoding: string;
    private mContentLength: number;
    private mBytesReceived: number = 0;
    private mDecode: boolean = true;
    private mIsJson: boolean = false;

    /**
     * Creates an instance of WebRequestAdapter.
     * @param {AbstractSession} session - The session to use for requests
     */
    constructor(private session: AbstractSession) {
        this.mLogger = Logger.getImperativeLogger();
    }

    /**
     * Make an HTTP request using the fetch API
     */
    public async request(
        resource: string,
        request: HTTP_VERB,
        reqHeaders: any[] = [],
        writeData?: any,
        responseStream?: Writable,
        requestStream?: Readable,
        normalizeResponseNewLines?: boolean,
        normalizeRequestNewLines?: boolean,
        task?: ITaskWithStatus
    ): Promise<string> {
        try {
            const url = this.buildUrl(resource);
            const headers = this.buildHeaders(reqHeaders);
            const options: RequestInit = {
                method: request,
                headers,
                credentials: "include"
            };

            if (writeData != null) {
                this.mLogger.debug("will write data for request");
                if (this.mIsJson) {
                    this.mLogger.debug("writing JSON for request");
                    this.mLogger.trace("JSON body: %s", JSON.stringify(writeData));
                    options.body = JSON.stringify(writeData);
                } else {
                    options.body = writeData;
                }
            }

            if (requestStream != null) {
                // For web environments, we need to convert the readable stream to a ReadableStream
                const readableStream = new ReadableStream<any>({
                    start(controller) {
                        requestStream.on("data", (chunk) => {
                            controller.enqueue(chunk);
                        });
                        requestStream.on("end", () => {
                            controller.close();
                        });
                        requestStream.on("error", (err) => {
                            controller.error(err);
                        });
                    }
                });
                options.body = readableStream;
            }

            this.mResponse = await fetch(url, options);

            if (!this.mResponse.ok) {
                throw new ImperativeError({
                    msg: `HTTP request failed with status ${this.mResponse.status}`,
                    causeErrors: await this.mResponse.text(),
                });
            }

            const contentType = this.mResponse.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                const json = await this.mResponse.json();
                return JSON.stringify(json);
            }

            const text = await this.mResponse.text();
            return text;

        } catch (error) {
            throw this.populateError({
                msg: "Failed to send an HTTP request.",
                causeErrors: error,
                source: "client"
            });
        }
    }

    private buildUrl(resource: string): string {
        const protocol = this.session.ISession.protocol;
        const hostname = this.session.ISession.hostname;
        const port = this.session.ISession.port;
        const basePath = this.session.ISession.basePath?.trim() || "";
        const resourcePath = resource.trim();

        return `${protocol}://${hostname}:${port}${basePath}${resourcePath}`;
    }

    private buildHeaders(reqHeaders: any[]): Headers {
        const headers = new Headers();

        // Add authentication headers
        if (this.session.ISession.type === "token" && this.session.ISession.tokenValue) {
            headers.append("Authorization", `${this.session.ISession.tokenType} ${this.session.ISession.tokenValue}`);
        } else if (this.session.ISession.type === "basic" && this.session.ISession.user && this.session.ISession.password) {
            const auth = btoa(`${this.session.ISession.user}:${this.session.ISession.password}`);
            headers.append("Authorization", `Basic ${auth}`);
        }

        // Add custom headers
        reqHeaders.forEach((header) => {
            Object.entries(header).forEach(([key, value]) => {
                headers.append(key, value as string);
            });
        });

        return headers;
    }

    private populateError(error: any): ImperativeError {
        return new ImperativeError(error);
    }
} 