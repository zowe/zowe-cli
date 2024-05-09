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

import * as yargs from "yargs";
import { IChainedHandlerEntry } from "./doc/handler/IChainedHandlerEntry";
import { IChainedHandlerArgumentMapping } from "./doc/handler/IChainedHandlerArgumentMapping";
import { ImperativeError } from "../../error";
import { TextUtils } from "../../utilities";
import { Logger } from "../../logger";

const DataObjectParser = require("dataobject-parser");

/**
 * Service for processing chained handlers and their
 * argument mappings.
 */
export class ChainedHandlerService {

    /**
     * Get the arguments for the current handler in the chain
     * @param binName - name of the binary/primary command for this CLI
     * @param {IChainedHandlerEntry[]} chainedHandlerConfigs - the configured chained handlers.
     * @param handlerIndex -  current index into the chained handlers e.g. 0 is the first chained handler
     * @param previousResponseObjects - command responses completed so far
     * @param  overallArguments - arguments specified by the use for the overall chained command
     * @param logger - a logger to use as we check and perform the argument mappings
     * @returns {yargs.Arguments[]} fully mapped arguments for this command
     */
    public static getArguments(binName: string,
        chainedHandlerConfigs: IChainedHandlerEntry[],
        handlerIndex: number,
        previousResponseObjects: any[],
        overallArguments: yargs.Arguments,
        logger: Logger): yargs.Arguments {
        const args: yargs.Arguments = {$0: binName, _: []};
        if (previousResponseObjects.length < handlerIndex) {
            throw new ImperativeError({
                msg: TextUtils.formatMessage("You must provide at least as many response " +
                    "objects as chained handlers that have been" +
                    " processed so far. You provided %d response objects  and tried to process the handler at index %d.",
                previousResponseObjects.length,
                handlerIndex)
            });
        }
        // we will loop through the chained handler configurations and skip any
        // mappings that are not relevant to the current handler's arguments
        for (let configIndex = 0; configIndex <= handlerIndex; configIndex++) {
            const handler = chainedHandlerConfigs[configIndex];
            const mappings: IChainedHandlerArgumentMapping[] = handler.mapping == null ? [] : handler.mapping;
            logger.debug("Checking argument mapping for handler %s", handler.handler);
            for (const mapping of mappings) {
                // default to applying the mapping to the next handler only ( same as specifying [1])
                const handlerIndicesAhead = mapping.applyToHandlers == null ? [1] : mapping.applyToHandlers;
                for (const index of handlerIndicesAhead) {
                    if (configIndex + index === handlerIndex) {
                        // if this mapping is relevant to the current handler
                        // (index is index of handlers ahead, config Index is the absolute index
                        // for the chained handler configuration we are checking)
                        if (index === 0) {
                            // if we're attempting to set values for the current handler
                            // only "value" can be used, not "from", unless mapFromArguments is specified
                            if ((mapping.from != null || mapping.value == null) && !mapping.mapFromArguments) {
                                throw new ImperativeError({
                                    msg: "Chained Handler configuration error: " +
                                    "You cannot apply a 'from' mapping to the " +
                                    "current handler, since the response object from the handler " +
                                    " is not yet available. You must either specify \"value\", \"mapFromArguments\", or " +
                                    "not use a mapping from the current handler. ",
                                    additionalDetails: TextUtils.formatMessage(
                                        "Attempted to map response object field from '%s' to argument '%s' ",
                                        mapping.from, mapping.to)
                                });
                            }
                        }
                        const response = previousResponseObjects[configIndex];
                        let value: any;
                        if (mapping.from != null) {
                            if (mapping.mapFromArguments) {
                                logger.debug("Attempting to map from argument '%s' to argument %s for handler '%s'",
                                    mapping.from, mapping.to, handler.handler);
                                value = new DataObjectParser(overallArguments).get(mapping.from);
                                if (value == null && !mapping.optional) {
                                    throw new ImperativeError({
                                        msg: TextUtils.formatMessage("Attempted to retrieve the argument: '%s' " +
                                            "from the arguments of the overall command, which failed. ", mapping.from),
                                        additionalDetails: "Arguments: " + JSON.stringify(overallArguments)
                                    });
                                }
                            }
                            else {
                                logger.debug("Attempting to map from response object field '%s' to argument '%s' for handler '%s'",
                                    mapping.from, mapping.to, handler.handler);
                                value = new DataObjectParser(response).get(mapping.from);
                                if (value == null && !mapping.optional) {
                                    throw new ImperativeError({
                                        msg: TextUtils.formatMessage("Attempted to retrieve the field: '%s' " +
                                            "from the response object, which failed. ", mapping.from),
                                        additionalDetails: "Response object: " + JSON.stringify(response)
                                    });
                                }
                            }

                        } else if (mapping.value != null) {
                            logger.debug("Attempting to map hard-coded value %s to argument %s for handler %s",
                                mapping.value, mapping.to, handler.handler);
                            value = mapping.value;
                        }
                        args[mapping.to] = value;
                    }
                }
            }
        }
        return args;
    }
}
