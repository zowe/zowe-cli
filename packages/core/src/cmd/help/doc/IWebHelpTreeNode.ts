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
 * Recursive object containing data for a node of web help command tree
 * @export
 * @interface IWebHelpTreeNode
 */
export interface IWebHelpTreeNode {

    /**
     * Name of HTML file corresponding to the node
     * @type {string}
     * @memberof IWebHelpTreeNode
     */
    id: string;

    /**
     * Display name for the node which includes full name and aliases
     * @type {string}
     * @memberof IWebHelpTreeNode
     */
    text: string;

    /**
     * List of child nodes
     * @type {IWebHelpTreeNode[]}
     * @memberof IWebHelpTreeNode
     */
    children?: IWebHelpTreeNode[];
}
