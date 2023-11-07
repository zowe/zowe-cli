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

import { MockMethod } from "../../../../__tests__/__resources__/__src__/decorators/MockMethod";

/**
 * This class mocks the real plugin require hook so that we don't have to
 * worry about tests unintentionally playing with the module loader.
 */
export class PluginRequireProvider {

    @MockMethod()
    public static createPluginHooks(modules: string[]) {
        if (PluginRequireProvider.mInstance != null) {
            const {PluginRequireAlreadyCreatedError} = require("./errors/PluginRequireAlreadyCreatedError");
            throw new PluginRequireAlreadyCreatedError();
        }

        this.mInstance = new PluginRequireProvider(modules);
    }

    @MockMethod()
    public static destroyPluginHooks() {
        if (PluginRequireProvider.mInstance == null) {
            const {PluginRequireNotCreatedError} = require("./errors/PluginRequireNotCreatedError");
            throw new PluginRequireNotCreatedError();
        }

        PluginRequireProvider.mInstance = undefined;
    }

    private static mInstance: PluginRequireProvider;

    // Constructor should not do anything
    private constructor(private readonly modules: string[]){}
}
