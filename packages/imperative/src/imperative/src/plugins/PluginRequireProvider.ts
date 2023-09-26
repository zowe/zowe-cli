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

import Module = require("module");

import { PerfTiming } from "@zowe/perf-timing";
import { ImperativeConfig } from "../../../utilities";
import * as path from "path";
import * as findUp from "find-up";
import * as lodash from "lodash";

/**
 * This class will allow imperative to intercept calls by plugins so that it can
 * provide them with the runtime instance of imperative / base cli when necessary.
 *
 * @future Currently this loader is only available from Imperative's internals but
 *         work could be done to make this a true standalone package that either
 *         Imperative depends on or ships as a separate folder under packages.
 *
 * @example <caption>Proper Use of the Module Loader</caption>
 * // Ideally this is the first thing that gets called by your application; however,
 * // the module loader can be created and destroyed at any point by your application.
 *
 * // Initializing the loader
 * PluginRequireProvider.createPluginHooks(["module-a", "module-b"]);
 *
 * // Now in all places of the application, module-a and module-b will be loaded
 * // from the package location of process.mainModule (I.E the Host Package). This
 * // is useful when the Host Package has some sort of plugin infrastructure that
 * // might require modules to be injected to the plugins.
 *
 * // So this will always be the Host Package module regardless of where it was
 * // called from.
 * require("module-a");
 *
 * // But this will act as normal
 * require("module-c");
 *
 * // It is not necessary to cleanup the module loader before exiting. Your
 * // application lifecycle may require it to be brought up and down during the
 * // course of execution. With this in mind, a method has been provided to remove
 * // the hooks created by `createPluginHooks`.
 *
 * // Calling this
 * PluginRequirePriovider.destroyPluginHooks();
 *
 * // Will now cause this to act as normal regardless of how it would have been
 * // injected before.
 * require("module-b");
 *
 */
export class PluginRequireProvider {
    /**
     * Create hooks for the specified modules to be injected at runtime.
     *
     * @param modules An array of modules to inject from the host application.
     *
     * @throws {PluginRequireAlreadyCreatedError} when hooks have already been added.
     */
    public static createPluginHooks(modules: string[]) {
        if (PluginRequireProvider.mInstance != null) {
            const {PluginRequireAlreadyCreatedError} = require("./errors/PluginRequireAlreadyCreatedError");
            throw new PluginRequireAlreadyCreatedError();
        }

        this.mInstance = new PluginRequireProvider(modules);
    }

    /**
     * Restore the default node require hook.
     *
     * @throws {PluginRequireNotCreatedError} when hooks haven't been added.
     */
    public static destroyPluginHooks() {
        if (PluginRequireProvider.mInstance == null) {
            const {PluginRequireNotCreatedError} = require("./errors/PluginRequireNotCreatedError");
            throw new PluginRequireNotCreatedError();
        }

        // Set everything back to normal
        Module.prototype.require = PluginRequireProvider.mInstance.origRequire;
        PluginRequireProvider.mInstance = undefined;
    }

    /**
     * Reference to the static singleton instance.
     */
    private static mInstance: PluginRequireProvider;

    /**
     * This regular expression is used by the module loader to
     * escape any valid characters that might be present in provided
     * modules.
     */
    private static sanitizeExpression(module: string) {
        /*
         * This replaces special characters that might be present in a regular expression and an
         * npm package name.
         *
         * @see https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
         */
        return lodash.escapeRegExp(module);
    }

    /**
     * Reference to the original require function.
     */
    private origRequire: typeof Module.prototype.require;

    /**
     * Reference to the regular expression used to match modules.
     *
     * This property was added to make testing easier.
     */
    private readonly regex: RegExp;

    /**
     * Construct the class and create hooks into require.
     * @param modules The modules that should be injected from the runtime instance
     */
    private constructor(private readonly modules: string[]) {
        if (PerfTiming.isEnabled) {
            // Stop tracking time of module imports before the module loader was created.
            // Effectively we are renaming the timer so we will have 2 metrics:
            //      All imports that happened before the module loader initialized
            //      All imports after the module loader initialized.
            Module.prototype.require = PerfTiming.api.unwatch(Module.prototype.require);
            Module.prototype.require = PerfTiming.api.watch(
                Module.prototype.require,
                `${Module.prototype.require.name} injected from module loader`
            );
        }

        const hostPackageRoot = path.join(
            findUp.sync("package.json", {cwd: ImperativeConfig.instance.callerLocation}),
            ".."
        );

        const hostPackageNameLength = ImperativeConfig.instance.hostPackageName.length;

        // We must remember to escape periods from modules for regular expression
        // purposes.
        const internalModules: string[] = [];

        for (const module of modules) {
            internalModules.push(PluginRequireProvider.sanitizeExpression(module));
        }

        /*
         * Check that the element (or module that we inject) is present at position 0.
         * It was designed this way to support submodule imports.
         *
         * Example:
         * If modules = ["@zowe/imperative"]
         *    request = "@zowe/imperative/lib/errors"
         */
        // This regular expression will match /(@zowe\/imperative)/.*/
        /*
         * The ?: check after the group in the regular expression is to explicitly
         * require that a submodule import has to match. This is to account for the
         * case where one of the packages to be injected is some-test-module and
         * we are requiring some-test-module-from-npm. Without the slash, that
         * module is incorrectly matched and injected.
         */
        const regex = this.regex = new RegExp(`^(${internalModules.join("|")})(?:\\/.*)?$`, "gm");
        const origRequire = this.origRequire = Module.prototype.require;

        // Timerify the function if needed
        // Gave it a name so that we can more easily track it
        Module.prototype.require = PerfTiming.api.watch<any>(function PluginModuleLoader(...args: any[]) {
            // Check to see if the module should be injected
            const request: string = args[0];
            const doesUseOverrides = request.match(regex);

            if (doesUseOverrides) {
                // Next we need to check if this is the root module. If so, then
                // we need to remap the import.
                if (request.startsWith(ImperativeConfig.instance.hostPackageName)) {
                    if (request === ImperativeConfig.instance.hostPackageName) {
                        args[0] = "./";
                    } else {
                        args[0] = `${hostPackageRoot}${request.substr(hostPackageNameLength)}`;
                    }
                }

                // Inject it from the main module dependencies
                return origRequire.apply(process.mainModule, args);
            } else {
                // Otherwise use the package dependencies
                return origRequire.apply(this, args);
            }
        });
    }
}
