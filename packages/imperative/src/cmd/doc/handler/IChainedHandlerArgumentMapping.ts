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

/**
 * Interface describing constructing command line arguments for
 * chained handlers.
 */
export interface IChainedHandlerArgumentMapping {
    /**
     * Dot notation property e.g. files[0].filename to copy from the
     * command response's data field (set via response.data.setObj) of this chained handler to a future chained handler.
     * If mapFromArguments is specified, the mapping will be from the overall command's arguments
     * (the command comprised of these chained handlers and mappings).
     *
     * Mutually exclusive with 'value'.
     * The dot notation field is retrieved with the dataobject-parser package.
     * @type {string}
     * @memberof IChainedHandlerArgumentMapping
     */
    from?: string;

    /**
     * If you specify this, values will be copied from the overall command's arguments
     * instead of the command response of the current handler.
     * Has no meaning if paired with 'value'
     * @type {boolean}
     * @memberof IChainedHandlerArgumentMapping
     */
    mapFromArguments?: boolean;

    /**
     * Is this mapping optional?
     * Unless this is true, an error will be thrown if "from" is specified and the specified
     * field is not found on the command response.
     * @type {boolean}
     * @memberof IChainedHandlerArgumentMapping
     */
    optional?: boolean;
    /**
     * The name of an argument e.g. "filename" that will be inserted into the "arguments"
     * field of the handler parameters for the future chained handler.
     * Required.
     * @type {string}
     * @memberof IChainedHandlerArgumentMapping
     */
    to: string;
    /**
     * Hard-code a value to pass to the "to" argument field.
     * Mutually exclusive with "from".
     * Note: the value should be serializable, since command definitions should be
     * able to be fully represented in JSON. Values that are not preserved when
     * doing JSON.parse(JSON.stringify(value)) will cause an error.
     * @type {any}
     * @memberof IChainedHandlerArgumentMapping
     */
    value?: any;

    /**
     * Which future handlers does this apply to? Optional.
     * Specify any number of positive integers. The number represents an index ahead of the current handler.
     * For example, 1 is the next handler and 2 is the handler after next.
     * You can specify [0] to apply to the current handler, however in that case you must specify "value",
     * and not "from", since the arguments will be applied before the response object from the handler is available.
     * If omitted, the mapping applies to the next handler (equivalent to a value of [1] for this field)
     * @type {number[]}
     * @memberof IChainedHandlerArgumentMapping
     */
    applyToHandlers?: number[];

}
