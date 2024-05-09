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

import { ICommandDefinition } from "../../";

/**
 * profile.schema Command Builder - used in the module loaders to build and append additional profile.schemaside commands as
 * requested by the module definition.
 */
export abstract class AbstractCommandBuilder {
    /**
     * Accepts an instance of this class and builds the definition and appends it to the command definition document.
     * @param { AbstractCommandBuilder} builder: The builder that constructs the definition.
     * @param {ICommandDefinition} definition: The definition to append to.
     * command will be appended to the existing group.
     */
    public static appendToDocument(builder: AbstractCommandBuilder, definition: ICommandDefinition): void {
        const actions: ICommandDefinition[] = definition.children;
        for (const child of actions) {
            if (child.name === builder.getAction()) {
                if (child.children) {
                    child.children.push(builder.build());
                } else {
                    child.children = [builder.build()];
                }
                return;
            }
        }
        if (definition.children) {
            definition.children.push(builder.buildFull());
        } else {
            definition.children = [builder.buildFull()];
        }
    }

    /**
     * Gets the "action" that this command builder is building.
     * @return {string}: The action command group string.
     */
    public abstract getAction(): string;

    /**
     * Build the full command - includes action group and object command.
     * @return {ICommandDefinition}: The command definition.
     */
    public abstract buildFull(): ICommandDefinition;

    /**
     * Only constructs the object command.
     * @return {ICommandDefinition}: The object command definition.
     */
    public abstract build(): ICommandDefinition;
}
