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
 * "Pass On" allows you to indicate fields in the current command definition node to be passed-on (inherited) by
 * all or select children.
 */
import { ICommandNodeType } from "./ICommandDefinition";

export interface ICommandDefinitionPassOnIgnore {
    type?: ICommandNodeType;
    name?: string;
}

/**
 * Allows you to "pass on" traits from the current definition to all children (assuming they meet the criteria
 * specified). For example, assume you have a "group" that contains a set of children (commands) that all require the
 * same profile type. You can "pass on" the profile attribute/trait from the parent or provide the attribute/trait on
 * the parent that should be passed on to the children (if you do NOT want the trait to apply directly to the parent
 * itself).
 *
 * Note that "pass on" attributes are accumulated if a child node wishes to pass on additional traits to it's
 * children.
 */
export interface ICommandDefinitionPassOn {
    /**
     * Indicates the property that you wish to "pass on" to all children that meet
     * the criteria (see applyToNodeTypes and ignoreNodesNamed). For example, you can specify "enabledStdin"
     * to set the value of "enableStdin" for all children of the definition.
     */
    property: string;
    /**
     * The value to apply to the property. If the value is omitted, it will take the value from the current node
     * (parent) and pass that on to each child.
     */
    value?: any;
    /**
     * You can ignore nodes with a particular name and type.
     * If name is omitted, then you will ignore all nodes of "type" - and same for if type is omitted.
     */
    ignoreNodes?: ICommandDefinitionPassOnIgnore[];
    /**
     * If the value is complex and you do NOT want to completely override the child's value, you can indicate merge. For
     * example, you can pass on option definitions (as an array) and "push" the passed on options on the child's options
     * property, rather than completely overwrite any existing options.
     */
    merge?: boolean;
}
