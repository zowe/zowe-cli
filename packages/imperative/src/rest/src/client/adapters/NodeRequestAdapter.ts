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

import * as http from "http";
import * as https from "https";
import { HTTP_VERB } from "../types/HTTPVerb";
import { Writable, Readable } from "stream";
import { ITaskWithStatus } from "../../../../operations";
import { IRequestAdapter } from "./IRequestAdapter";
import { AbstractSession } from "../../session/AbstractSession";
import { ImperativeError } from "../../../../error";
import { Logger } from "../../../../logger";
import { RestConstants } from "../RestConstants";
import { TaskProgress } from "../../../../operations";
import { TextUtils } from "../../../../utilities";
import * as SessConstants from "../../session/SessConstants";
import { ContentEncoding, Headers as SessHeaders } from "../Headers";
import { CompressionUtils } from "../CompressionUtils";

/**
 * Node.js implementation of the request adapter
 * @export
 * @class NodeRequestAdapter
 * @implements {IRequestAdapter}
 */
export class NodeRequestAdapter implements IRequestAdapter {
    private mLogger: Logger;
    private mChunks: Buffer[] = [];
    private mData: Buffer = Buffer.from([]);
    private mResponse: any;
    private mContentEncoding: ContentEncoding;
    private mContentLength: number;
    private mBytesReceived: number = 0;
    private mDecode: boolean = true;
    private mIsJson: boolean = false;

    /**
     * Creates an instance of NodeRequestAdapter.
     * @param {AbstractSession} session - The session to use for requests
     */
    constructor(private session: AbstractSession) {
        this.mLogger = Logger.getImperativeLogger();
    }

    /**
     * Make an HTTP request using Node.js http/https modules
     */
    public request(
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
        return new Promise<string>((resolve, reject) => {
            const buildOptions = this.buildOptions(resource, request, reqHeaders);

            let clientRequest: http.ClientRequest;
            if (this.session.ISession.protocol === SessConstants.HTTPS_PROTOCOL) {
                clientRequest = https.request(buildOptions, this.requestHandler.bind(this));
            } else if (this.session.ISession.protocol === SessConstants.HTTP_PROTOCOL) {
                clientRequest = http.request(buildOptions, this.requestHandler.bind(this));
            }

            if (writeData != null) {
                this.mLogger.debug("will write data for request");
                if (this.mIsJson) {
                    this.mLogger.debug("writing JSON for request");
                    this.mLogger.trace("JSON body: %s", JSON.stringify(writeData));
                    clientRequest.write(JSON.stringify(writeData));
                } else {
                    clientRequest.write(writeData);
                }
            }

            if (this.session.ISession.requestCompletionTimeout && this.session.ISession.requestCompletionTimeout > 0) {
                clientRequest.setTimeout(this.session.ISession.requestCompletionTimeout);
            }

            clientRequest.on("timeout", () => {
                if (clientRequest.socket.connecting) {
                    clientRequest.destroy(new Error("Connection timed out. Check the host, port, and firewall rules."));
                } else if (this.session.ISession.requestCompletionTimeout && this.session.ISession.requestCompletionTimeout > 0) {
                    this.session.ISession.requestCompletionTimeoutCallback?.();
                    clientRequest.destroy(new ImperativeError({msg: "Request timed out"}));
                }
            });

            clientRequest.on("error", (errorResponse: any) => {
                if (errorResponse.code === "ECONNRESET" && clientRequest.reusedSocket) {
                    this.request(resource, request, reqHeaders, writeData, responseStream, requestStream,
                        normalizeResponseNewLines, normalizeRequestNewLines, task)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(this.populateError({
                        msg: "Failed to send an HTTP request.",
                        causeErrors: errorResponse,
                        source: "client"
                    }));
                }
            });

            if (requestStream != null) {
                let bytesUploaded = 0;
                let heldByte: string;
                requestStream.on("data", (data: Buffer) => {
                    this.mLogger.debug("Writing data chunk of length %d from requestStream to clientRequest", data.byteLength);
                    if (normalizeRequestNewLines) {
                        this.mLogger.debug("Normalizing new lines in request chunk to \\n");
                        let dataString = data.toString();
                        if (heldByte != null) {
                            dataString = heldByte + dataString;
                            heldByte = undefined;
                        }
                        if (dataString.charAt(dataString.length - 1) === "\r") {
                            heldByte = dataString.charAt(dataString.length - 1);
                            dataString = dataString.slice(0,-1);
                        }
                        data = Buffer.from(dataString.replace(/\r?\n/g, "\n"));
                    }
                    if (task != null) {
                        bytesUploaded += data.byteLength;
                        task.statusMessage = TextUtils.formatMessage("Uploading %d B", bytesUploaded);
                        if (task.percentComplete < TaskProgress.NINETY_PERCENT) {
                            task.percentComplete++;
                        }
                    }
                    clientRequest.write(data);
                });
                requestStream.on("error", (streamError: any) => {
                    this.mLogger.error("Error encountered reading requestStream: " + streamError);
                    reject(this.populateError({
                        msg: "Error reading requestStream",
                        causeErrors: streamError,
                        source: "client"
                    }));
                });
                requestStream.on("end", () => {
                    if (heldByte != null) {
                        clientRequest.write(Buffer.from(heldByte));
                        heldByte = undefined;
                    }
                    this.mLogger.debug("Finished reading requestStream");
                    clientRequest.end();
                });
            } else {
                clientRequest.end();
            }
        });
    }

    private buildOptions(resource: string, request: string, reqHeaders?: any[]): any {
        // Implementation of buildOptions from AbstractRestClient
        // This would contain the same logic as the original buildOptions method
        // but adapted for the Node.js environment
        return {};
    }

    private requestHandler(res: any) {
        this.mResponse = res;
        this.mContentEncoding = null;

        if (this.mResponse.headers != null) {
            if (this.session.ISession.type === SessConstants.AUTH_TYPE_TOKEN || this.session.ISession.storeCookie === true) {
                if (RestConstants.PROP_COOKIE in this.mResponse.headers) {
                    this.session.storeCookie(this.mResponse.headers[RestConstants.PROP_COOKIE]);
                }
            }

            const getHeaderCaseInsensitive = (key: string) => {
                return this.mResponse.headers[key] ?? this.mResponse.headers[key.toLowerCase()];
            };

            const tempLength: number = getHeaderCaseInsensitive(SessHeaders.CONTENT_LENGTH);
            if (tempLength != null) {
                this.mContentLength = tempLength;
                this.mLogger.debug("Content length of response is: " + this.mContentLength);
            }

            const tempEncoding: string = getHeaderCaseInsensitive(SessHeaders.CONTENT_ENCODING);
            if (typeof tempEncoding === "string" && SessHeaders.CONTENT_ENCODING_TYPES.find((x) => x === tempEncoding)) {
                this.mLogger.debug("Content encoding of response is: " + tempEncoding);
                if (this.mDecode) {
                    this.mContentEncoding = tempEncoding as ContentEncoding;
                    this.mLogger.debug("Using encoding: " + this.mContentEncoding);
                }
            }
        }

        res.on("data", (dataResponse: Buffer) => {
            this.onData(dataResponse);
        });

        res.on("end", () => {
            this.onEnd();
        });
    }

    private onData(respData: Buffer): void {
        this.mLogger.trace("Data chunk received...");
        this.mBytesReceived += respData.byteLength;
        this.mChunks.push(respData);
    }

    private onEnd(): void {
        this.mLogger.debug("onEnd() called for NodeRequestAdapter");

        this.mData = Buffer.concat(this.mChunks as unknown as Uint8Array[]);
        this.mChunks = [];

        if (this.mContentEncoding != null && this.mData.length > 0) {
            this.mLogger.debug("Decompressing encoded response");
            this.mData = CompressionUtils.decompressBuffer(this.mData, this.mContentEncoding);
        }
    }

    private populateError(error: any): ImperativeError {
        // Implementation of populateError from AbstractRestClient
        // This would contain the same logic as the original populateError method
        return new ImperativeError(error);
    }
} 