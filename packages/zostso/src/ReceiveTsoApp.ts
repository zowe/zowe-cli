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
import { AbstractSession } from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { TsoValidator } from "./TsoValidator";
import { noAccountNumber, TsoConstants } from "./TsoConstants";
import { ITsoAppCommunicationParms } from "./doc/input/ITsoAppCommunicationParms";
import { IASAppResponse } from "./doc/IASAppResponse";

const TIMEOUT_SECONDS = 600;

export class ReceiveTsoApp {
    public static async receive(
        session: AbstractSession,
        accountNumber: string,
        params: ITsoAppCommunicationParms
    ): Promise<IASAppResponse> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(
            accountNumber,
            noAccountNumber.message
        );

        const spinnerChars = ["|", "/", "-", "\\"];
        let spinnerIndex = 0;

        const spinner = setInterval(() => {
            process.stdout.write(`\rReceiving response... ${spinnerChars[spinnerIndex]}`);
            spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
        }, 100);

        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
        let combinedResponse: IASAppResponse | null = null;
        let endKeyword = false;
        const startTime = Date.now();
        let timeoutReached = false;

        try {
            do {
                if (Date.now() - startTime > TIMEOUT_SECONDS * 1000) {
                    timeoutReached = true;
                    break;
                }

                try {
                    const apiResponse = await ZosmfRestClient.getExpectJSON<
                        IASAppResponse & { ver: string; appData?: any }
                    >(session, endpoint);

                    const response = apiResponse as IASAppResponse & {
                        ver: string;
                        appData?: any;
                    };
                    const formattedApiResponse: IASAppResponse = {
                        version: response.ver,
                        reused: response.reused,
                        timeout: response.timeout,
                        servletKey: response.servletKey ?? null,
                        queueID: response.queueID ?? null,
                        tsoData: response.tsoData?.map((message: any) => {
                            const messageKey = message["TSO MESSAGE"]
                                ? "TSO MESSAGE"
                                : "TSO PROMPT";
                            return {
                                VERSION: message[messageKey].VERSION,
                                DATA: message[messageKey].DATA,
                            };
                        }) || [response.appData],
                    };

                    if (combinedResponse === null) {
                        combinedResponse = formattedApiResponse;
                    } else {
                        combinedResponse.tsoData.push(
                            ...formattedApiResponse.tsoData
                        );
                    }

                    endKeyword = formattedApiResponse.tsoData.some((data: any) =>
                        typeof data === "string"
                            ? data.trim() === "READY"
                            : data.DATA.trim() === "READY"
                    );
                } catch (error) {
                    if (combinedResponse) {
                        return combinedResponse;
                    }
                    throw error;
                }
            } while (!endKeyword && params.receiveUntilReady && !timeoutReached);
        } finally {
            // Stop the spinner
            clearInterval(spinner);
            process.stdout.write("\r"); // Clear the spinner line
        }

        // Display final status
        if (timeoutReached) {
            console.log("Timeout reached.");
        } else {
            console.log("Received response successfully.");
        }

        return combinedResponse!;
    }
}
