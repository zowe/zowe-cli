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

import { getMockWrapper } from "../../../../__tests__/__src__/types/MockWrapper";

jest.mock("../../../utilities/src/ImperativeConfig");
jest.mock("find-up");
jest.mock("path");

import Module = require("module");

import * as findUp from "find-up";
import { ImperativeConfig } from "../../../utilities/src/ImperativeConfig";
import { PluginRequireProvider } from "../../src/plugins/PluginRequireProvider";
import { PluginRequireAlreadyCreatedError } from "../../src/plugins/errors/PluginRequireAlreadyCreatedError";
import { PluginRequireNotCreatedError } from "../../src/plugins/errors/PluginRequireNotCreatedError";
import * as path from "path";
import { generateRandomAlphaNumericString } from "../../../../__tests__/src/TestUtil";

describe("PluginRequireProvider", () => {
    /**
     * This is an indicator that helps our require method to determine if a require
     * for testing purposes only.
     *
     * @example <caption>Passing to a mocked require</caption>
     *
     * // Assume that all setup has been done
     * // Use Module.prototype.require because jest intercepts the real require call.
     * const moduleRequired = (Module.prototype.require as any).call("some_value", request, testRequireIndicator);
     *
     * // At this point moduleRequired should equal some_value if all went well.
     */
    const testRequireIndicator = "__TEST_REQUIRE__";

    /**
     * Object that allows access to internals of the PluginRequireProvider.
     */
    const mPluginRequireProvider: {
        /**
         * Private access to the instance of the PluginRequireProvider.
         */
        mInstance: {
            /**
             * Access to the private origRequire so tests can check that the module
             * loader is playing nice with the libraries.
             */
            origRequire: typeof Module.prototype.require,

            /**
             * Access to the private modules variable so tests can confirm that
             * the right information made it down to us.
             */
            modules: string[],

            /**
             * Access to the private regex variable used by the module loader
             * so tests can validate that our checks were created properly.
             */
            regex: RegExp
        },

        /**
         * Access to the private sanitizeExpression function so tests can
         * call it as a utility function and tests that the module loader
         * will properly sanitize regular expressions. It should be run before
         * the PluginRequireProvider creates the private regex variable.
         * @param module
         */
        sanitizeExpression: (module: string) => string
    } = PluginRequireProvider as any;

    /**
     * Gives us type access to the internals of ImperativeConfig items used
     * in the tests.
     */
    const mImperativeConfig: {
        /**
         * Access to the instance object through the getter of ImperativeConfig.
         */
        instance: {
            /**
             * The host package name is used by the module loader to determine
             * if a special override is necessary.
             */
            mHostPackageName: string
        }
    } = ImperativeConfig as any;

    /**
     * This gives us type access to the Module.prototype methods used in the tests.
     */
    const modulePrototype: {
        /**
         * Mapping to the require functionality that is tested.
         * @param module Same as what goes to `require`
         * @param check Flag that helps the mock decide if this is a real or
         *        fake require.
         */
        require: (module: string, check: typeof testRequireIndicator) => any
    } = Module.prototype as any;

    /**
     * This is a mock wrapper object so that we can easily access mocking
     * types of imported objects.
     */
    const mocks = getMockWrapper({
        findUpSync: findUp.sync,
        join: path.join
    });

    /**
     * Stores the original require passed at the beginning of testing.
     */
    let originalRequire: typeof Module.prototype.require;

    /**
     * Checks that the environment is clean both before and after a test. This check is done
     * in both the beforeEach and afterEach sections of the tests. I decided to
     * do it this way so that once a test fails, all other tests from this suite
     * should fail. This should protect the real Module.prototype.require from
     * being obliterated because of something we've done to cause a test to fail.
     *
     * @throws An error when the environment is not in a clean state.
     */
    const checkForCleanEnvironment = (isAfterEach = false) => {
        try {
            expect(mPluginRequireProvider.mInstance).toBeUndefined();
        } catch (e) {
            throw new Error(
                (isAfterEach ? "Bad environment state detected after running this test!\n\n" : "") +
                "The PluginRequireInstance was not properly cleaned up in a previous test. Please check that the failing " +
                "test is running PluginRequireProvider.destroyPluginHooks() or cleans up PluginRequireProvider.mInstance " +
                "before exiting."
            );
        }
    };

    /**
     * This function is responsible for overriding the require interface with
     * our dummy require. It will ensure that normal requires still happen as usual
     * while test requires don't try to load anything.
     */
    const getMockedRequire = () => {
        /*
         * Override the real require method with a jest mock method. Our function
         * will accept a string with an optional second parameter of the indicator.
         *
         * If the indicator variable is not present, then the mock will treat it as
         * a normal require.
         *
         * If the indicator variable is present, then the mock will return the this
         * parameter sent to the function. This can be used to check that the require
         * provider class used the proper this argument.
         *
         * This method protects the node module loader by allowing genuine requires
         * to still go through while preventing our test requires. This allows
         * the tests to still function correctly without us mucking up node with
         * bogus test requires.
         */
        return Module.prototype.require = jest.fn(function(...args: any[]) {
            if (args[1] === testRequireIndicator) {
                return this;
            } else {
                return originalRequire.apply(this, args);
            }
        });
    };

    // Gets a reference to the original require before each test
    beforeEach(() => {
        // Clean up the mocks present in the mock object
        for (const mock of Object.values(mocks)) {
            mock.mockClear();
        }

        originalRequire = Module.prototype.require;
        checkForCleanEnvironment();
    });

    // Restores the original require
    afterEach(() => {
        // Ensure that the proper module loader is set back as the prototype.
        Module.prototype.require = originalRequire;
        checkForCleanEnvironment(true);
    });

    it("should override and cleanup the module require", () => {
        // Inject a dummy require so we can check it.
        const mockedRequire = getMockedRequire();

        mocks.findUpSync.mockReturnValueOnce("will-be-tested");

        PluginRequireProvider.createPluginHooks(["test"]);

        // Checks that we have indeed overridden the module require
        expect(mPluginRequireProvider.mInstance.origRequire).toBe(mockedRequire);
        expect(Module.prototype.require).not.toBe(mockedRequire);
        expect(mPluginRequireProvider.mInstance.modules).toEqual(["test"]);

        expect(mocks.findUpSync).toHaveBeenLastCalledWith(
            "package.json",
            {cwd: ImperativeConfig.instance.callerLocation}
        );

        expect(mocks.join).toHaveBeenLastCalledWith("will-be-tested", "..");

        // Perform the cleanup
        PluginRequireProvider.destroyPluginHooks();

        expect(Module.prototype.require).toBe(mockedRequire);
        expect(mPluginRequireProvider.mInstance).toBeUndefined();
    });

    describe("environment stability", () => {
        it("should guard against adding multiple hooks", () => {
            mocks.findUpSync.mockReturnValue("does-not-matter");

            expect(() => {
                PluginRequireProvider.createPluginHooks(["test"]);
                PluginRequireProvider.createPluginHooks(["test"]);
            }).toThrow(PluginRequireAlreadyCreatedError);

            PluginRequireProvider.destroyPluginHooks();
        });

        it("should guard against destroying hooks that haven't been created", () => {
            expect(() => {
                PluginRequireProvider.destroyPluginHooks();
            }).toThrow(PluginRequireNotCreatedError);
        });
    });

    describe("injection tests", () => {
        const MAX_NPM_PACKAGE_NAME_LENGTH = 214;

        it("should properly prepare modules for injection into a regular expression", () => {
            expect(mPluginRequireProvider.sanitizeExpression("abcd")).toEqual("abcd");
            expect(mPluginRequireProvider.sanitizeExpression("this.is.a.test")).toEqual("this\\.is\\.a\\.test");
        });

        describe("use proper regex format", () => {
            /**
             * This function will escape modules for testing purposes. Goes through
             * the same process as the real module loader for consistency. The
             * sanitize function is tested earlier in the unit tests.
             *
             * @param modules An array of modules to escape
             *
             * @returns An array of escaped modules
             */
            const escapeModules = (modules: string[]) => {
                const escaped: string[] = [];

                for (const module of modules) {
                    escaped.push(mPluginRequireProvider.sanitizeExpression(module));
                }

                return escaped;
            };

            // We don't need to worry about checking anything with a special character
            // including the | since an npm package must be url safe :)
            const tests = {
                "1 module": ["this-is-a-test"],
                "3 modules": ["this-is-a-test", "@another/module", "and_another_one"],
                "3 modules of max length": [
                    generateRandomAlphaNumericString(MAX_NPM_PACKAGE_NAME_LENGTH).toLowerCase(),
                    generateRandomAlphaNumericString(MAX_NPM_PACKAGE_NAME_LENGTH).toLowerCase(),
                    generateRandomAlphaNumericString(MAX_NPM_PACKAGE_NAME_LENGTH).toLowerCase(),
                ],
                "1 module with periods": ["test.with.periods.for.package"]
            };

            // Loop through the tests object so we can quickly check that
            // the requires are correct
            Object.entries(tests).forEach( ([testName, injectedModules]) => {
                it(`should pass test: ${testName}`, () => {
                    // Inject a dummy require so we can check it.
                    getMockedRequire();

                    const modulesForRegex = escapeModules(injectedModules);

                    mocks.findUpSync.mockReturnValue("does-not-matter");
                    mocks.join.mockReturnValue("does-not-matter");

                    // Inject our test modules
                    PluginRequireProvider.createPluginHooks(injectedModules);

                    try {
                        expect(mPluginRequireProvider.mInstance.regex).toEqual(
                            new RegExp(`^(${modulesForRegex.join("|")})(?:\\/.*)?$`, "gm")
                        );
                    } catch (e) {
                        PluginRequireProvider.destroyPluginHooks();
                        throw e;
                    }

                    PluginRequireProvider.destroyPluginHooks();
                });
            });
        });

        describe("module injection", () => {
            interface ITestStructure {
                /**
                 * The modules to provide to the test.
                 */
                modules: string[];
                shouldRequireDirectly: string[];
            }

            const randomModuleMaxLength = [
                generateRandomAlphaNumericString(MAX_NPM_PACKAGE_NAME_LENGTH).toLowerCase(),
                generateRandomAlphaNumericString(MAX_NPM_PACKAGE_NAME_LENGTH).toLowerCase(),
                generateRandomAlphaNumericString(MAX_NPM_PACKAGE_NAME_LENGTH).toLowerCase()
            ];

            const tests: {[key: string]: ITestStructure} = {
                "1 module": {
                    modules: ["this-is-a-test"],
                    shouldRequireDirectly: [
                        "./anything",
                        "this-is-a-test-module",
                        "this-is",
                        "@zowe/imperative",
                        "this-is-a-tests"
                    ]
                },
                "3 modules": {
                    modules: ["this-is-a-test", "@another/module", "and_another_one"],
                    shouldRequireDirectly: ["./anything", "@another/module2", "./another/module", "@scope/and_another_one"]
                },
                "3 modules of max length": {
                    modules: randomModuleMaxLength,
                    shouldRequireDirectly: [
                        "./anything/goes/here",
                        randomModuleMaxLength[0].substr(15),
                        randomModuleMaxLength[1].substr(200),
                        randomModuleMaxLength[2].substr(59)
                    ]
                },
                "1 module with periods": {
                    modules: ["test.with.periods.for.package"],
                    shouldRequireDirectly: [
                        "./",
                        "some-random-module",
                        "test-with-periods-for-package", // This one might break the regex with .'s
                        "./test.with.periods.for.package"
                    ]
                }
            };

            // Maintain the imperative config integrity
            let rememberHostPackageName: string;
            beforeEach(() => {
                rememberHostPackageName = mImperativeConfig.instance.mHostPackageName;
            });

            afterEach(() => {
                mImperativeConfig.instance.mHostPackageName = rememberHostPackageName;
            });

            Object.entries(tests).forEach(([testName, testData]) => {
                describe(`${testName}`, () => {
                    describe("should redirect to the original require", () => {
                        for (const requireDirect of testData.shouldRequireDirectly) {
                            it(`passes with value "${requireDirect}"`, () => {
                                const thisObject = "This string gets attached as the this to require so we can track if it got called correctly";
                                const mockedRequire = getMockedRequire();

                                mocks.findUpSync.mockReturnValue("does-not-matter");
                                mocks.join.mockReturnValue("does-not-matter");

                                PluginRequireProvider.createPluginHooks(testData.modules);

                                try {
                                    // If all went well, this should be dispatched to the mockedRequire
                                    // which should abort the require due to the input being an object.
                                    expect(modulePrototype.require.call(thisObject, requireDirect, testRequireIndicator)).toBe(thisObject);

                                    expect(mockedRequire).toHaveBeenCalledTimes(1);
                                    expect(mockedRequire).toHaveBeenCalledWith(requireDirect, testRequireIndicator);
                                } catch (e) {
                                    PluginRequireProvider.destroyPluginHooks();

                                    throw e;
                                }

                                PluginRequireProvider.destroyPluginHooks();
                            });
                        }
                    });

                    describe("should redirect to an injected module", () => {
                        for (const module of testData.modules) {
                            it(`passes with module "${module}"`, () => {
                                const thisObject = "This should not be returned";
                                const mockedRequire = getMockedRequire();

                                // The host package can't match the module for the purpose of this test
                                // that test will come at a later date.
                                const nonMatchingHostPackage = module.split("").reverse().join("");

                                // Account for the possibility that someone made a palindrome
                                expect(module).not.toEqual(nonMatchingHostPackage);

                                mocks.findUpSync.mockReturnValue("does-not-matter");
                                mocks.join.mockReturnValue("does-not-matter");

                                // Set the imperative config to what we need
                                mImperativeConfig.instance.mHostPackageName = nonMatchingHostPackage;

                                PluginRequireProvider.createPluginHooks(testData.modules);

                                try {
                                    // The return should be the main module as that is what the module loader does.
                                    expect(modulePrototype.require.call(thisObject, module, testRequireIndicator)).toBe(process.mainModule);

                                    // Expect that the require was just called with the module
                                    expect(mockedRequire).toHaveBeenCalledTimes(1);
                                    expect(mockedRequire).toHaveBeenCalledWith(module, testRequireIndicator);

                                    // Reset the call stack of the require
                                    mockedRequire.mockClear();

                                    // Do it again but to a submodule import
                                    const submodule = `${module}/submodule/import`;
                                    expect(modulePrototype.require.call(
                                        thisObject, submodule, testRequireIndicator
                                    )).toBe(process.mainModule);

                                    // Expect that the require was just called with the submodule
                                    expect(mockedRequire).toHaveBeenCalledTimes(1);
                                    expect(mockedRequire).toHaveBeenCalledWith(submodule, testRequireIndicator);
                                } catch (e) {
                                    PluginRequireProvider.destroyPluginHooks();

                                    throw e;
                                }

                                // Clean up after ourselves
                                PluginRequireProvider.destroyPluginHooks();
                            });
                        }
                    });

                    describe("should redirect to the proper host package", () => {
                        for (const module of testData.modules) {
                            it(`passes with module ${module}`, () => {
                                const packageRoot = "/the/path/to/the/package/";
                                const thisObject = "This should not be returned";
                                const mockedRequire = getMockedRequire();

                                mocks.join.mockReturnValue(packageRoot);

                                mImperativeConfig.instance.mHostPackageName = module;

                                PluginRequireProvider.createPluginHooks(testData.modules);

                                try {
                                    expect(modulePrototype.require.call(
                                        thisObject, module, testRequireIndicator
                                    )).toBe(process.mainModule);

                                    expect(mockedRequire).toHaveBeenCalledTimes(1);
                                    expect(mockedRequire).toHaveBeenCalledWith("./", testRequireIndicator);
                                } catch (e) {
                                    PluginRequireProvider.destroyPluginHooks();
                                    throw e;
                                }

                                PluginRequireProvider.destroyPluginHooks();
                            });
                        }
                    });

                    describe("should redirect to the proper host package submodule import", () => {
                        for (const module of testData.modules) {
                            it(`passes with module ${module}`, () => {
                                const packageRoot = "/the/path/to/the/package/";
                                const thisObject = "This should not be returned";
                                const mockedRequire = getMockedRequire();
                                const submoduleImport = "/some/submodule/import";

                                mocks.join.mockReturnValue(packageRoot);

                                mImperativeConfig.instance.mHostPackageName = module;

                                PluginRequireProvider.createPluginHooks(testData.modules);

                                try {
                                    expect(modulePrototype.require.call(
                                        thisObject, module + submoduleImport, testRequireIndicator
                                    )).toBe(process.mainModule);

                                    expect(mockedRequire).toHaveBeenCalledTimes(1);
                                    expect(mockedRequire).toHaveBeenCalledWith(packageRoot + submoduleImport, testRequireIndicator);
                                } catch (e) {
                                    PluginRequireProvider.destroyPluginHooks();
                                    throw e;
                                }

                                PluginRequireProvider.destroyPluginHooks();
                            });
                        }
                    });
                });
            });
        });
    });
});
