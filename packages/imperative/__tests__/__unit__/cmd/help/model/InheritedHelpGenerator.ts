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

import { AbstractHelpGenerator } from "../../../../../src/cmd/help/abstract/AbstractHelpGenerator";
import { CommandOptionType } from "../../../../../src/cmd/doc/option/ICommandOptionDefinition";

export class InheritedHelpGenerator extends AbstractHelpGenerator {

    public buildFullCommandHelpText(includeGlobalOptions: boolean): string {
        throw new Error("Method not implemented.");
    }
    public buildHelp(): string {
        return "inherited_help";
    }

    public getCommandHelpText(includeGlobalOptions: boolean): string {
        return "command_help_text";
    }

    public buildOptionsMapsTest() {
        this.buildOptionMaps();
    }

    public getCaseSensitiveFlagByOptionNameTest(optionName: string): boolean {
        return this.getCaseSensitiveFlagByOptionName(optionName);
    }

    public renderHelpTest(help: string): string {
        return this.renderHelp(help);
    }

    public explainTypeTest(type: CommandOptionType) {
        return this.explainType(type);
    }
}
