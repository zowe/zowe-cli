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

import { inspect } from "node:util";
import { Logger } from "../../../logger";
import { IImperativeError, ImperativeError } from "../../../error";
import { AbstractSession } from "../session/AbstractSession";
import * as https from "https";
import * as http from "http";
import { readFileSync } from "node:fs";
import { ContentEncoding, Headers } from "./Headers";
import { RestConstants } from "./RestConstants";
import { ImperativeReject } from "../../../interfaces/src/types/ImperativeReject";
import { IHTTPSOptions } from "./doc/IHTTPSOptions";
import { HTTP_VERB } from "./types/HTTPVerb";
import { ImperativeExpect } from "../../../expect/src/ImperativeExpect";
import { Session } from "../session/Session";
import * as path from "node:path";
import { completionTimeoutErrorMessage, IRestClientError } from "./doc/IRestClientError";
import { RestClientError } from "./RestClientError";
import { Readable, Writable } from "node:stream";
import { IO } from "../../../io";
import { ITaskWithStatus, TaskProgress, TaskStage } from "../../../operations";
import { ImperativeConfig, TextUtils } from "../../../utilities";
import { IRestOptions } from "./doc/IRestOptions";
import * as SessConstants from "../session/SessConstants";
import { CompressionUtils } from "./CompressionUtils";
import { ProxySettings } from "./ProxySettings";
import { EnvironmentalVariableSettings } from "../../../imperative/src/env/EnvironmentalVariableSettings";

export type RestClientResolve = (data: string) => void;

/**
 * Class to handle http(s) requests, build headers, collect data, report status codes, and header responses
 * and passes control to session object for maintaining connection information (tokens, checking for timeout, etc...)
 * @export
 * @abstract
 * @class AbstractRestClient
 */
export abstract class AbstractRestClient {

    /**
     * Contains REST chucks
     * @private
     * @type {Buffer[]}
     * @memberof AbstractRestClient
     */
    protected mChunks: Buffer[] = [];

    /**
     * Contains buffered data after all REST chucks are received
     * @private
     * @type {Buffer}
     * @memberof AbstractRestClient
     */
    protected mData: Buffer = Buffer.from([]);

    /**
     * Instance of logger
     * @private
     * @type {Logger}
     * @memberof AbstractRestClient
     */
    protected mLogger: Logger;

    /**
     * Resolved when all data has been obtained
     * @private
     * @type {RestClientResolve}
     * @memberof AbstractRestClient
     */
    protected mResolve: RestClientResolve;

    /**
     * Reject for errors when obtaining data
     * @private
     * @type {ImperativeReject}
     * @memberof AbstractRestClient
     */
    protected mReject: ImperativeReject;

    /**
     * Contain response from http(s) request
     * @private
     * @type {*}
     * @memberof AbstractRestClient
     */
    protected mResponse: any;

    /**
     * If we get a response containing a Content-Length header,
     * it is saved here
     * @private
     * @type {number}
     * @memberof AbstractRestClient
     */
    protected mContentLength: number;

    /**
     * If we get a response containing a Content-Encoding header,
     * and it matches an encoding type that we recognize,
     * it is saved here
     * @private
     * @type {ContentEncoding}
     * @memberof AbstractRestClient
     */
    protected mContentEncoding: ContentEncoding;

    /**
     * Indicates if payload data is JSON to be stringified before writing
     * @private
     * @type {boolean}
     * @memberof AbstractRestClient
     */
    protected mIsJson: boolean;

    /**
     * Indicates if request data should have its newlines normalized to /n before sending
     * each chunk to the server
     * @private
     * @type {boolean}
     * @memberof AbstractRestClient
     */
    protected mNormalizeRequestNewlines: boolean;

    /**
     * Indicates if response data should have its newlines normalized for the current platform
     * (\r\n for windows, otherwise \n)
     * @private
     * @type {boolean}
     * @memberof AbstractRestClient
     */
    protected mNormalizeResponseNewlines: boolean;

    /**
     * Save resource
     * @private
     * @type {string}
     * @memberof AbstractRestClient
     */
    protected mResource: string;

    /**
     * Save request
     * @private
     * @type {HTTP_VERB}
     * @memberof AbstractRestClient
     */
    protected mRequest: HTTP_VERB;

    /**
     * Save req headers
     * @private
     * @type {any[]}
     * @memberof AbstractRestClient
     */
    protected mReqHeaders: any[];

    /**
     * Save write data
     * @private
     * @type {*}
     * @memberof AbstractRestClient
     */
    protected mWriteData: any;

    /**
     * Stream for incoming response data from the server.
     * If specified, response data will not be buffered
     * @private
     * @type {Writable}
     * @memberof AbstractRestClient
     */
    protected mResponseStream: Writable;

    /**
     * stream for outgoing request data to the server
     * @private
     * @type {Writable}
     * @memberof AbstractRestClient
     */
    protected mRequestStream: Readable;

    /**
     * Task used to display progress bars or other user feedback mechanisms
     * Automatically updated if task is specified and streams are provided for upload/download
     * @private
     * @type {ITaskWithStatus}
     * @memberof AbstractRestClient
     */
    protected mTask: ITaskWithStatus;

    /**
     * Bytes received from the server response so far
     * @private
     * @type {ITaskWithStatus}
     * @memberof AbstractRestClient
     */
    protected mBytesReceived: number = 0;

    /**
     * Whether or not to try and decode any encoded response
     * @private
     * @type {boolean}
     * @memberof AbstractRestClient
     */
    protected mDecode: boolean = true;

    /**
     * Last byte received when response is being streamed
     * @private
     * @type {number}
     * @memberof AbstractRestClient
     */
    protected lastByteReceived: number = 0;

    /**
     * Creates an instance of AbstractRestClient.
     * @param {AbstractSession} mSession - representing connection to this api
     * @memberof AbstractRestClient
     */
    constructor(private mSession: AbstractSession) {
        ImperativeExpect.toNotBeNullOrUndefined(mSession);
        this.mLogger = Logger.getImperativeLogger();
        this.mIsJson = false;

        /* Set the order of precedence in which available credentials will be used.
         *
         * The Zowe SDK policy is to select password credentials over a token.
         * However, this class was originally released with the token over password.
         * The commonly-used ConnectionPropsForSessCfg.resolveSessCfgProps enforces the
         * order of password over token. None-the-less, consumers which directly extended
         * AbstractRestClient came to rely on the order of token over password.
         *
         * Later changes in this class to adhere to Zowe policy inadvertently broke
         * such extenders. While we now use a generalized authTypeOrder property to
         * determine the order, until a means is provided for consumers (and/or end-users)
         * to customize their credential order of precedence, we hard-code the
         * original order of token over password to correct the breaking change.
         */
        this.mSession.ISession.authTypeOrder = [
            SessConstants.AUTH_TYPE_TOKEN,
            SessConstants.AUTH_TYPE_BASIC,
            SessConstants.AUTH_TYPE_BEARER,
            SessConstants.AUTH_TYPE_CERT_PEM
        ];
    }

    /**
     * Perform the actual http REST call with appropriate user input
     * @param {IRestOptions} options
     * @returns {Promise<string>}
     * @throws  if the request gets a status code outside of the 200 range
     *          or other connection problems occur (e.g. connection refused)
     * @memberof AbstractRestClient
     */
    public request(options: IRestOptions): Promise<string> {
        return new Promise<string>((resolve: RestClientResolve, reject: ImperativeReject) => {

            // save for logging
            this.mResource = options.resource;
            this.mRequest = options.request;
            this.mReqHeaders = options.reqHeaders;
            this.mWriteData = options.writeData;
            this.mRequestStream = options.requestStream;
            this.mResponseStream = options.responseStream;
            this.mNormalizeRequestNewlines = options.normalizeRequestNewLines;
            this.mNormalizeResponseNewlines = options.normalizeResponseNewLines;
            this.mTask = options.task;

            // got a new promise
            this.mResolve = resolve;
            this.mReject = reject;

            ImperativeExpect.toBeDefinedAndNonBlank(options.resource, "resource");
            ImperativeExpect.toBeDefinedAndNonBlank(options.request, "request");
            ImperativeExpect.toBeEqual(options.requestStream != null && options.writeData != null, false,
                "You cannot specify both writeData and writeStream");
            const buildOptions = this.buildOptions(options.resource, options.request, options.reqHeaders);

            /**
             * Perform the actual http request
             */
            let clientRequest: http.ClientRequest;
            if (this.session.ISession.protocol === SessConstants.HTTPS_PROTOCOL) {
                clientRequest = https.request(buildOptions, this.requestHandler.bind(this));
                // try {
                //     clientRequest = https.request(buildOptions, this.requestHandler.bind(this));
                // } catch (err) {
                //     if (err.message === "mac verify failure") {
                //         throw new ImperativeError({
                //             msg: "Failed to decrypt PFX file - verify your certificate passphrase is correct.",
                //             causeErrors: err,
                //             additionalDetails: err.message,
                //             stack: err.stack
                //         });
                //     } else { throw err; }
                // }
            } else if (this.session.ISession.protocol === SessConstants.HTTP_PROTOCOL) {
                clientRequest = http.request(buildOptions, this.requestHandler.bind(this));
            }

            /**
             * For a REST request which includes writing raw data to the http server,
             * write the data via http request.
             */
            if (options.writeData != null) {

                this.log.debug("will write data for request");
                /**
                 * If the data is JSON, translate to text before writing
                 */
                if (this.mIsJson) {
                    this.log.debug("writing JSON for request");
                    this.log.trace("JSON body: %s", JSON.stringify(options.writeData));
                    clientRequest.write(JSON.stringify(options.writeData));
                } else {
                    clientRequest.write(options.writeData);
                }
            }

            // Set up the request timeout
            if (this.mSession.ISession.requestCompletionTimeout && this.mSession.ISession.requestCompletionTimeout > 0) {
                clientRequest.setTimeout(this.mSession.ISession.requestCompletionTimeout);
            }

            clientRequest.on("timeout", () => {
                if (clientRequest.socket.connecting) {
                    // We timed out. Destroy the request.
                    clientRequest.destroy(new Error("Connection timed out. Check the host, port, and firewall rules."));
                } else if (this.mSession.ISession.requestCompletionTimeout && this.mSession.ISession.requestCompletionTimeout > 0) {
                    this.mSession.ISession.requestCompletionTimeoutCallback?.();
                    clientRequest.destroy(new ImperativeError({msg: completionTimeoutErrorMessage}));
                }
            });

            /**
             * Invoke any onError method whenever an error occurs on writing
             */
            clientRequest.on("error", (errorResponse: any) => {
                // Handle the HTTP 1.1 Keep-Alive race condition
                if (errorResponse.code === "ECONNRESET" && clientRequest.reusedSocket) {
                    this.request(options).then((response: string) => {
                        resolve(response);
                    }).catch((err) => {
                        reject(err);
                    });
                } else if (errorResponse instanceof ImperativeError && errorResponse.message === completionTimeoutErrorMessage) {
                    reject(this.populateError({
                        msg: "HTTP request timed out after connecting.",
                        causeErrors: errorResponse,
                        source: "timeout"
                    }));
                } else {
                    reject(this.populateError({
                        msg: "Failed to send an HTTP request.",
                        causeErrors: errorResponse,
                        source: "client"
                    }));
                }
            });

            if (options.requestStream != null) {
                // if the user requested streaming write of data to the request,
                // write the data chunk by chunk to the server
                let bytesUploaded = 0;
                let heldByte: string;
                options.requestStream.on("data", (data: Buffer) => {
                    this.log.debug("Writing data chunk of length %d from requestStream to clientRequest", data.byteLength);
                    if (this.mNormalizeRequestNewlines) {
                        this.log.debug("Normalizing new lines in request chunk to \\n");
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
                    if (this.mTask != null) {
                        bytesUploaded += data.byteLength;
                        this.mTask.statusMessage = TextUtils.formatMessage("Uploading %d B", bytesUploaded);
                        if (this.mTask.percentComplete < TaskProgress.NINETY_PERCENT) {
                            // we don't know how far along we are but increment the percentage to
                            // show we are making progress
                            this.mTask.percentComplete++;
                        }
                    }
                    clientRequest.write(data);
                });
                options.requestStream.on("error", (streamError: any) => {
                    this.log.error("Error encountered reading requestStream: " + streamError);
                    reject(this.populateError({
                        msg: "Error reading requestStream",
                        causeErrors: streamError,
                        source: "client"
                    }));
                });
                options.requestStream.on("end", () => {
                    if (heldByte != null) {
                        clientRequest.write(Buffer.from(heldByte));
                        heldByte = undefined;
                    }
                    this.log.debug("Finished reading requestStream");
                    // finish the request
                    clientRequest.end();
                });
            } else {
                // otherwise we're done with the request
                clientRequest.end();
            }

        });
    }

    /**
     * Append specific headers for all requests by overriding this implementation
     * @protected
     * @param {(any[] | undefined)} headers - list of headers
     * @returns {any[]} - completed list of headers
     * @memberof AbstractRestClient
     */
    protected appendHeaders(headers: any[] | undefined): any[] {
        if (headers == null) {
            return [];
        } else {
            return headers;
        }
    }

    /**
     * Process and customize errors encountered in your client.
     * This is called any time an error is thrown from a failed Rest request using this client.
     * error before receiving any response body from the API.
     * You can use this, for example, to set the error tag for you client or add additional
     * details to the error message.
     * If you return null or undefined, Imperative will use the default error generated
     * for your failed request.
     * @protected
     * @param {IImperativeError} error - the error encountered by the client
     * @memberof AbstractRestClient
     * @returns {IImperativeError} processedError - the error with the fields set the way you want them
     */
    protected processError(_error: IImperativeError): IImperativeError {
        this.log.debug("Default stub for processError was called for rest client %s - processError was not overwritten",
            this.constructor.name);
        return undefined; // do nothing by default
    }

    /**
     * Build http(s) options based upon session settings and request.
     * @private
     * @param {string} resource - URI for this request
     * @param {string} request - REST request type GET|PUT|POST|DELETE
     * @param {any[]} reqHeaders - option headers to include with request
     * @returns {IHTTPSOptions} - completed options object
     * @throws {ImperativeError} - if the hostname is invalid or credentials are not passed to a session that requires auth
     * @memberof AbstractRestClient
     */
    private buildOptions(resource: string, request: string, reqHeaders?: any[]): IHTTPSOptions {

        this.validateRestHostname(this.session.ISession.hostname);

        if (ImperativeConfig.instance.envVariablePrefix) {
            const envValues = EnvironmentalVariableSettings.read(ImperativeConfig.instance.envVariablePrefix);
            const socketConnectTimeout = envValues.socketConnectTimeout?.value;
            const requestCompletionTimeout = envValues.requestCompletionTimeout?.value;

            this.session.ISession.socketConnectTimeout ??= isNaN(Number(socketConnectTimeout)) ? undefined : Number(socketConnectTimeout);
            if (this.session.ISession.socketConnectTimeout != null) {
                Logger.getImperativeLogger().info(
                    "Setting socket connection timeout ms: " + String(this.mSession.ISession.socketConnectTimeout)
                );
            }

            this.session.ISession.requestCompletionTimeout ??= isNaN(Number(requestCompletionTimeout)) ? undefined : Number(requestCompletionTimeout);
            if (this.session.ISession.requestCompletionTimeout != null) {
                Logger.getImperativeLogger().info(
                    "Setting request completion timeout ms: " + String(this.mSession.ISession.requestCompletionTimeout)
                );
            }
        }

        /**
         * HTTPS REST request options
         */
        let options: any = {
            headers: {},
            hostname: this.session.ISession.hostname,
            method: request,
            /* Posix.join forces forward-slash delimiter on Windows.
             * Path join is ok for just the resource part of the URL.
             * We also eliminate any whitespace typos at the beginning
             * or end of basePath or resource.
             */
            path: path.posix.join(path.posix.sep,
                this.session.ISession.basePath.trim(),
                resource.trim()
            ),
            port: this.session.ISession.port,
            rejectUnauthorized: this.session.ISession.rejectUnauthorized,
            // Timeout after failing to connect for 60 seconds, or sooner if specified
            timeout: this.session.ISession.socketConnectTimeout
        };

        // NOTE(Kelosky): This cannot be set for http requests
        // options.agent = new https.Agent({secureProtocol: this.session.ISession.secureProtocol});

        const proxyUrl = ProxySettings.getSystemProxyUrl(this.session.ISession);
        if (proxyUrl) {
            if (ProxySettings.matchesNoProxySettings(this.session.ISession)) {
                this.mLogger.info(`Proxy setting "${proxyUrl.href}" will not be used as hostname was found listed under "no_proxy" setting.`);
            } else {
                this.mLogger.info(`Using the following proxy setting for the request: ${proxyUrl.href}`);
                options.agent = ProxySettings.getProxyAgent(this.session.ISession);
            }
        }

        // NOTE(Kelosky): we can bring certificate implementation back whenever we port tests and
        // convert for imperative usage

        /**
         * Allow our session's defined identity validator run
         */
        if (this.session.ISession.checkServerIdentity) {
            this.log.trace("Check Server Identity Disabled (Allowing Mismatched Domains)");
            options.checkServerIdentity = this.session.ISession.checkServerIdentity;
        }

        /**
         * Place the credentials for the desired authentication type (based on our
         * order of precedence) into the session options.
         */
        let credsAreSet: boolean = false;
        for (const nextAuthType of this.session.ISession.authTypeOrder) {
            if (nextAuthType === SessConstants.AUTH_TYPE_TOKEN) {
                credsAreSet ||= this.setTokenAuth(options);

            } else if (nextAuthType === SessConstants.AUTH_TYPE_BASIC) {
                credsAreSet ||= this.setPasswordAuth(options);

            } else if (nextAuthType === SessConstants.AUTH_TYPE_BEARER) {
                credsAreSet ||= this.setBearerAuth(options);

            } else if (nextAuthType === SessConstants.AUTH_TYPE_CERT_PEM) {
                credsAreSet ||= this.setCertPemAuth(options);
            }

            if (credsAreSet) {
                break;
            }
            /* The following commented code was left as a place-holder for adding support
             * for PFX certificates. The commented code was added when the order of credentials
             * was specified using hard-coded logic. We now use authTypeOrder to specify
             * the order. When adding support for PFX certs, move this logic into a new function
             * (with a name like setCertPfxAuth). Some conditional logic may have to be reversed
             * in that function. See other such functions for an example. Add a new else-if
             * clause above to call the new setCertPfxAuth function.
             */
            // else if (this.session.ISession.type === SessConstants.AUTH_TYPE_CERT_PFX) {
            //     this.log.trace("Using PFX Certificate authentication");
            //     try {
            //         options.pfx = readFileSync(this.session.ISession.cert);
            //     } catch (err) {
            //         throw new ImperativeError({
            //             msg: "Certificate authentication failed when trying to read files.",
            //             causeErrors: err,
            //             additionalDetails: err.message,
            //         });
            //     }
            //     options.passphrase = this.session.ISession.passphrase;
            // }
        }

        /* There is probably a better way report this kind of problem and a better message,
         * but we do it this way to maintain backward compatibility.
         */
        if (!credsAreSet && this.session.ISession.type !== SessConstants.AUTH_TYPE_NONE) {
            throw new ImperativeError({ msg: "No credentials for a BASIC or TOKEN type of session." });
        }

        // for all headers passed into this request, append them to our options object
        reqHeaders = this.appendHeaders(reqHeaders);
        options = this.appendInputHeaders(options, reqHeaders);

        // set transfer flags
        this.setTransferFlags(options.headers);

        const logResource = path.posix.join(path.posix.sep,
            this.session.ISession.basePath == null ? "" : this.session.ISession.basePath, resource);
        this.log.trace("Rest request: %s %s:%s%s %s", request, this.session.ISession.hostname, this.session.ISession.port,
            logResource, this.session.ISession.user ? "as user " + this.session.ISession.user : "");

        return options;
    }

    /**
     * Set token auth into our REST request authentication options
     * if a token value is specified in the session supplied to this class.
     *
     * @private
     * @param {any} restOptionsToSet
     *      The set of REST request options into which the credentials will be set.
     * @returns True if this function sets authentication options. False otherwise.
     * @memberof AbstractRestClient
     */
    private setTokenAuth(restOptionsToSet: any): boolean {
        if (!(this.session.ISession.type === SessConstants.AUTH_TYPE_TOKEN)) {
            return false;
        }
        if (!this.session.ISession.tokenValue) {
            return false;
        }

        this.log.trace("Using cookie authentication with token %s", this.session.ISession.tokenValue);
        const headerKeys: string[] = Object.keys(Headers.COOKIE_AUTHORIZATION);
        const authentication: string = `${this.session.ISession.tokenType}=${this.session.ISession.tokenValue}`;
        headerKeys.forEach((property) => {
            restOptionsToSet.headers[property] = authentication;
        });
        return true;
    }

    /**
     * Set user and password auth (A.K.A basic authentication) into our
     * REST request authentication options if user and password values
     * are specified in the session supplied to this class.
     *
     * @private
     * @param {any} restOptionsToSet
     *      The set of REST request options into which the credentials will be set.
     * @returns True if this function sets authentication options. False otherwise.
     * @memberof AbstractRestClient
     */
    private setPasswordAuth(restOptionsToSet: any): boolean {
        /* When logging into APIML, our desired auth type is token. However to
         * get that token, we login to APIML with user and password (basic auth).
         * So, we accept either auth type when setting basic auth creds.
         */
        if (this.session.ISession.type !== SessConstants.AUTH_TYPE_BASIC &&
            this.session.ISession.type !== SessConstants.AUTH_TYPE_TOKEN)
        {
            return false;
        }
        if (!this.session.ISession.base64EncodedAuth &&
            !(this.session.ISession.user && this.session.ISession.password))
        {
            return false;
        }

        this.log.trace("Using basic authentication");
        const headerKeys: string[] = Object.keys(Headers.BASIC_AUTHORIZATION);
        const authentication: string = AbstractSession.BASIC_PREFIX + (this.session.ISession.base64EncodedAuth ??
            AbstractSession.getBase64Auth(this.session.ISession.user, this.session.ISession.password));
        headerKeys.forEach((property) => {
            restOptionsToSet.headers[property] = authentication;
        });
        return true;
    }

    /**
     * Set bearer auth token into our REST request authentication options.
     *
     * @private
     * @param {any} restOptionsToSet
     *      The set of REST request options into which the credentials will be set.
     * @returns True if this function sets authentication options. False otherwise.
     * @memberof AbstractRestClient
     */
    private setBearerAuth(restOptionsToSet: any): boolean {
        if (!(this.session.ISession.type === SessConstants.AUTH_TYPE_BEARER)) {
            return false;
        }
        if (!this.session.ISession.tokenValue) {
            return false;
        }

        this.log.trace("Using bearer authentication");
        const headerKeys: string[] = Object.keys(Headers.BASIC_AUTHORIZATION);
        const authentication: string = AbstractSession.BEARER_PREFIX + this.session.ISession.tokenValue;
        headerKeys.forEach((property) => {
            restOptionsToSet.headers[property] = authentication;
        });
        return true;
    }

    /**
     * Set a PEM certificate auth into our REST request authentication options.
     *
     * @private
     * @param {any} restOptionsToSet
     *      The set of REST request options into which the credentials will be set.
     * @returns True if this function sets authentication options. False otherwise.
     * @memberof AbstractRestClient
     */
    private setCertPemAuth(restOptionsToSet: any): boolean {
        if (!(this.session.ISession.type === SessConstants.AUTH_TYPE_CERT_PEM)) {
            return false;
        }
        this.log.trace("Using PEM Certificate authentication");
        try {
            restOptionsToSet.cert = readFileSync(this.session.ISession.cert);
            restOptionsToSet.key = readFileSync(this.session.ISession.certKey);
        } catch (err) {
            throw new ImperativeError({
                msg: "Failed to open one or more PEM certificate files, the file(s) did not exist.",
                causeErrors: err,
                additionalDetails: err.message,
            });
        }
        return true;
    }

    /**
     * Callback from http(s).request
     * @private
     * @param {*} res - https response
     * @memberof AbstractRestClient
     */
    private requestHandler(res: any) {
        this.mResponse = res;
        this.mContentEncoding = null;

        if (this.response.headers != null) {
            // This is not ideal, but is the only way to avoid introducing a breaking change.
            if (this.session.ISession.type === SessConstants.AUTH_TYPE_TOKEN || this.session.ISession.storeCookie === true) {
                if (RestConstants.PROP_COOKIE in this.response.headers) {
                    this.session.storeCookie(this.response.headers[RestConstants.PROP_COOKIE]);
                }
            }

            const getHeaderCaseInsensitive = (key: string) => {
                return this.response.headers[key] ?? this.response.headers[key.toLowerCase()];
            };

            const tempLength: number = getHeaderCaseInsensitive(Headers.CONTENT_LENGTH);
            if (tempLength != null) {
                this.mContentLength = tempLength;
                this.log.debug("Content length of response is: " + this.mContentLength);
            }

            const tempEncoding: string = getHeaderCaseInsensitive(Headers.CONTENT_ENCODING);
            if (typeof tempEncoding === "string" && Headers.CONTENT_ENCODING_TYPES.find((x) => x === tempEncoding)) {
                this.log.debug("Content encoding of response is: " + tempEncoding as ContentEncoding);
                if (this.mDecode) {
                    this.mContentEncoding = tempEncoding as ContentEncoding;
                    this.log.debug("Using encoding: " + this.mContentEncoding);
                }
            }
        }

        if (this.mResponseStream != null) {
            this.mResponseStream.on("error", (streamError: any) => {
                this.mReject(streamError instanceof ImperativeError ? streamError : this.populateError({
                    msg: "Error writing to responseStream",
                    causeErrors: streamError,
                    source: "client"
                }));
            });
            if (this.mContentEncoding != null) {
                this.log.debug("Adding decompression transform to response stream");
                try {
                    this.mResponseStream = CompressionUtils.decompressStream(this.mResponseStream, this.mContentEncoding,
                        this.mNormalizeResponseNewlines);
                } catch (err) {
                    this.mReject(err);
                }
            }
        }

        /**
         * Invoke any onData method whenever data becomes available
         */
        res.on("data", (dataResponse: Buffer) => {
            this.onData(dataResponse);
        });

        /**
         * Invoke any onEnd method whenever all response data has been received
         */
        res.on("end", () => {
            this.onEnd();
        });
    }

    /**
     * Method to accumulate and buffer http request response data until our
     * onEnd method is invoked, at which point all response data has been accounted for.
     * NOTE(Kelosky): this method may be invoked multiple times.
     * @private
     * @param {Buffer} respData - any datatype and content
     * @memberof AbstractRestClient
     */
    private onData(respData: Buffer): void {
        this.log.trace("Data chunk received...");
        this.mBytesReceived += respData.byteLength;
        if (this.requestFailure || this.mResponseStream == null) {
            // buffer the data if we are not streaming
            // or if we encountered an error, since the rest client
            // relies on any JSON error to be in the this.dataString field
            this.mChunks.push(respData);
        } else {
            this.log.debug("Streaming data chunk of length " + respData.length + " to response stream");
            if (this.mNormalizeResponseNewlines && this.mContentEncoding == null) {
                this.log.debug("Normalizing new lines in data chunk to operating system appropriate line endings");
                respData = IO.processNewlines(respData, this.lastByteReceived);
            }
            if (this.mTask != null) {
                // update the progress task if provided by the requester
                if (this.mContentLength != null) {
                    this.mTask.percentComplete = Math.floor(TaskProgress.ONE_HUNDRED_PERCENT *
                        (this.mBytesReceived / this.mContentLength));
                    this.mTask.statusMessage = TextUtils.formatMessage("Downloading %d of %d B",
                        this.mBytesReceived, this.mContentLength);
                } else {
                    this.mTask.statusMessage = TextUtils.formatMessage("Downloaded %d of ? B",
                        this.mBytesReceived);
                    if (this.mTask.percentComplete < TaskProgress.NINETY_PERCENT) {
                        // we don't know how far along we are but increment the percentage to
                        // show that we are making progress
                        this.mTask.percentComplete++;
                    }
                }
            }
            // write the chunk to the response stream if requested
            this.mResponseStream.write(respData);
            this.lastByteReceived = respData[respData.byteLength - 1];
        }
    }

    /**
     * Method that must be implemented to extend the IRestClient class.  This is the client specific implementation
     * for what action to perform after all response data has been collected.
     * @private
     * @memberof AbstractRestClient
     */
    private onEnd(): void {
        this.log.debug("onEnd() called for rest client %s", this.constructor.name);

        // Concatenate the chunks, then toss the pieces
        this.mData = Buffer.concat(this.mChunks);
        this.mChunks = [];

        if (this.mTask != null) {
            this.mTask.percentComplete = TaskProgress.ONE_HUNDRED_PERCENT;
            this.mTask.stageName = TaskStage.COMPLETE;
        }
        if (this.mContentEncoding != null && this.mData.length > 0) {
            this.log.debug("Decompressing encoded response");
            try {
                this.mData = CompressionUtils.decompressBuffer(this.mData, this.mContentEncoding);
            } catch (err) {
                this.mReject(err);
            }
        }

        const requestEnd = () => {
            if (this.requestFailure) {
                // Reject the promise with an error
                const httpStatus = this.response == null ? undefined : this.response.statusCode;
                this.mReject(this.populateError({
                    msg: "Rest API failure with HTTP(S) status " + httpStatus,
                    causeErrors: this.dataString,
                    source: "http"
                }));
            } else {
                this.mResolve(this.dataString);
            }
        };
        if (this.mResponseStream != null) {
            this.log.debug("Ending response stream");
            this.mResponseStream.end(requestEnd);
        } else {
            requestEnd();
        }
    }

    /**
     * Construct a throwable rest client error with all "relevant" diagnostic information.
     * The caller should have the session, so not all input fields are present on the error
     * response. Only the set required to understand "what may have gone wrong".
     *
     * The "exit" point for the implementation error override will also be called here. The
     * implementation can choose to transform the IImperativeError details however they see
     * fit.
     *
     * @param {IRestClientError} error - The base request error. It is expected to already have msg,
     *                                   causeErrors, and the error source pre-populated.
     * @param {*} [nodeClientError] - If the source is a node http client error (meaning the request
     *                                did not make it to the remote system) this parameter should be
     *                                populated.
     * @returns {RestClientError} - The error that can be thrown or rejected.
     */
    private populateError(error: IRestClientError, nodeClientError?: any): RestClientError {

        // Final error object parameters
        let finalError: IRestClientError = error;

        // extract the status code
        const httpStatus = this.response == null ? undefined : this.response.statusCode;

        // start off by coercing the request details to string in case an error is encountered trying
        // to stringify / inspect them
        let headerDetails: string = this.mReqHeaders + "";
        let payloadDetails: string = this.mWriteData + "";
        try {
            headerDetails = JSON.stringify(this.mReqHeaders);
            payloadDetails = inspect(this.mWriteData, { depth: null });
        } catch (stringifyError) {
            this.log.error("Error encountered trying to parse details for REST request error:\n %s", inspect(stringifyError, { depth: null }));
        }

        // Populate the "relevant" fields - caller will have the session, so
        // no need to duplicate "everything" here, just host/port for easy diagnosis
        // Since IRestClientError inherits an errorCode from IImperativeError,
        // also put the httpStatus in the errorCode.
        finalError.errorCode = httpStatus;
        finalError.protocol = this.mSession.ISession.protocol;
        finalError.port = this.mSession.ISession.port;
        finalError.host = this.mSession.ISession.hostname;
        finalError.basePath = this.mSession.ISession.basePath;
        finalError.httpStatus = httpStatus;
        finalError.errno = nodeClientError != null ? nodeClientError.errno : undefined;
        finalError.syscall = nodeClientError != null ? nodeClientError.syscall : undefined;
        finalError.payload = this.mWriteData;
        finalError.headers = this.mReqHeaders;
        finalError.resource = this.mResource;
        finalError.request = this.mRequest;

        // Construct a formatted details message
        let detailMessage: string;
        if (finalError.source === "client") {
            detailMessage =
                `HTTP(S) client encountered an error. Request could not be initiated to host.\n` +
                `Review connection details (host, port) and ensure correctness.`;
        } else if (finalError.source === "timeout") {
            detailMessage = `HTTP(S) client encountered an error. Request timed out.`;
        } else {
            detailMessage =
                `Received HTTP(S) error ${finalError.httpStatus} = ${http.STATUS_CODES[finalError.httpStatus]}.`;
        }

        detailMessage += "\n" +
        "\nProtocol:          " + finalError.protocol +
        "\nHost:              " + finalError.host +
        "\nPort:              " + finalError.port +
        "\nBase Path:         " + finalError.basePath +
        "\nResource:          " + finalError.resource +
        "\nRequest:           " + finalError.request +
        "\nHeaders:           " + headerDetails +
        "\nPayload:           " + payloadDetails +
        "\nAuth type:         " + this.mSession.ISession.type +
        "\nAllow Unauth Cert: " + !this.mSession.ISession.rejectUnauthorized;
        finalError.additionalDetails = detailMessage;

        // Allow implementation to modify the error as necessary
        // TODO - this is probably no longer necessary after adding the custom
        // TODO - error object, but it is left for compatibility.
        const processedError = this.processError(error);
        if (processedError != null) {
            this.log.debug("Error was processed by overridden processError method in RestClient %s", this.constructor.name);
            finalError = { ...finalError, ...processedError };
        }

        // Return the error object
        return new RestClientError(finalError);
    }

    /**
     * Appends output headers to the http(s) request
     * @private
     * @param {IHTTPSOptions} options - partially populated options objects
     * @param {any[]} [reqHeaders] - input headers for request on outgoing request
     * @returns {IHTTPSOptions} - with populated headers
     * @memberof AbstractRestClient
     */
    private appendInputHeaders(options: IHTTPSOptions, reqHeaders?: any[]): IHTTPSOptions {
        this.log.trace("appendInputHeaders called with options on rest client %s",
            JSON.stringify(options), this.constructor.name);
        if (reqHeaders && reqHeaders.length > 0) {
            reqHeaders.forEach((reqHeader: any) => {
                const requestHeaderKeys: string[] = Object.keys(reqHeader);
                requestHeaderKeys.forEach((property) => {
                    options.headers[property] = reqHeader[property];
                });
            });
        }
        return options;
    }

    /**
     * Determine whether we should stringify or leave writable data alone
     * @private
     * @param {http.OutgoingHttpHeaders} headers - options containing populated headers
     * @memberof AbstractRestClient
     */
    private setTransferFlags(headers: http.OutgoingHttpHeaders) {
        if (headers[Headers.CONTENT_TYPE] != null) {
            const contentType = headers[Headers.CONTENT_TYPE];
            if (contentType === Headers.APPLICATION_JSON[Headers.CONTENT_TYPE]) {
                this.mIsJson = true;
            } else if (contentType === Headers.OCTET_STREAM[Headers.CONTENT_TYPE]) {
                this.log.debug("Found octet-stream header in request. Will write in binary mode");
            }
        }
    }

    /**
     * Determine if the hostname parameter is valid before attempting the request
     *
     * @private
     * @param {String} hostname - the hostname to check
     * @memberof AbstractRestClient
     * @throws {ImperativeError} - if the hostname is invalid
     */
    private validateRestHostname(hostname: string): void {
        if (!hostname) {
            throw new ImperativeError({msg: "The hostname is required."});
        } else if (URL.canParse(hostname)) {
            throw new ImperativeError({msg: "The hostname should not contain the protocol."});
        }
    }

    /**
     * Return whether or not a REST request was successful by HTTP status code
     * @readonly
     * @type {boolean}
     * @memberof AbstractRestClient
     */
    get requestSuccess(): boolean {
        if (this.response == null) {
            return false;
        } else {
            return this.response.statusCode >= RestConstants.HTTP_STATUS_200 &&
                this.response.statusCode < RestConstants.HTTP_STATUS_300;
        }
    }

    /**
     * Return whether or not a REST request was successful by HTTP status code
     * @readonly
     * @type {boolean}
     * @memberof AbstractRestClient
     */
    get requestFailure(): boolean {
        return !this.requestSuccess;
    }

    /**
     * Return http(s) response body as a buffer
     * @readonly
     * @type {Buffer}
     * @memberof AbstractRestClient
     */
    get data(): Buffer {
        return this.mData;
    }

    /**
     * Return http(s) response body as a string
     * @readonly
     * @type {string}
     * @memberof AbstractRestClient
     */
    get dataString(): string {
        if (this.data == null) {
            return undefined;
        }
        return this.data.toString("utf8");
    }

    /**
     * Return http(s) response object
     * @readonly
     * @type {*}
     * @memberof AbstractRestClient
     */
    get response(): any {
        return this.mResponse;
    }

    /**
     * Return this session object
     * @readonly
     * @type {Session}
     * @memberof AbstractRestClient
     */
    get session(): Session {
        return this.mSession;
    }

    /**
     * Return the logger object for ease of reference
     * @readonly
     * @type {Logger}
     * @memberof AbstractRestClient
     */
    get log(): Logger {
        return this.mLogger;
    }
}
