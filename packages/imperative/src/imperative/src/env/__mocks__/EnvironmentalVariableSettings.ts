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

import Mock = jest.Mock;
import { IImperativeEnvironmentalVariableSettings } from "../../doc/IImperativeEnvironmentalVariableSettings";

const envActual = (jest as any).requireActual("../EnvironmentalVariableSettings").EnvironmentalVariableSettings;

const EnvironmentalVariableSettings: any =
    (jest.genMockFromModule("../EnvironmentalVariableSettings") as any).EnvironmentalVariableSettings;

(EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX as any) = envActual.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX;
(EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX as any) = envActual.APP_LOG_LEVEL_KEY_SUFFIX;
(EnvironmentalVariableSettings.CLI_HOME_SUFFIX as any) = envActual.CLI_HOME_SUFFIX;
(EnvironmentalVariableSettings.PROMPT_PHRASE_SUFFIX as any) = envActual.PROMPT_PHRASE_SUFFIX;
(EnvironmentalVariableSettings.APP_MASK_OUTPUT_SUFFIX as any) = envActual.APP_MASK_OUTPUT_SUFFIX;

(EnvironmentalVariableSettings.read as Mock).mockImplementation((prefix: string): IImperativeEnvironmentalVariableSettings => {
    const getSetting = (key: string) => {
        return {key: prefix + key, value: undefined as any};
    };

    return {
        imperativeLogLevel: getSetting(EnvironmentalVariableSettings.IMPERATIVE_LOG_LEVEL_KEY_SUFFIX),
        appLogLevel: getSetting(EnvironmentalVariableSettings.APP_LOG_LEVEL_KEY_SUFFIX),
        cliHome: getSetting(EnvironmentalVariableSettings.CLI_HOME_SUFFIX),
        promptPhrase: getSetting(EnvironmentalVariableSettings.PROMPT_PHRASE_SUFFIX),
        maskOutput: getSetting(EnvironmentalVariableSettings.APP_MASK_OUTPUT_SUFFIX),
    };
});

exports.EnvironmentalVariableSettings = EnvironmentalVariableSettings;
