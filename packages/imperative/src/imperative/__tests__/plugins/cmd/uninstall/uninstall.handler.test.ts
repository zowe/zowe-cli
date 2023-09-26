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

/* eslint-disable jest/expect-expect */
import Mock = jest.Mock;

jest.mock("child_process");
jest.mock("jsonfile");
jest.mock("../../../../src/plugins/utilities/npm-interface/uninstall");
jest.mock("../../../../src/plugins/utilities/PMFConstants");
jest.mock("../../../../../cmd/src/response/CommandResponse");
jest.mock("../../../../../cmd/src/doc/handler/IHandlerParameters");
jest.mock("../../../../../logger");

import { CommandResponse, IHandlerParameters } from "../../../../../cmd";
import { Console } from "../../../../../console";
import { ConfigurationLoader } from "../../../../src/ConfigurationLoader";
import { CredentialManagerOverride } from "../../../../../security";
import { execSync } from "child_process";
import { IImperativeConfig } from "../../../../src/doc/IImperativeConfig";
import { IPluginJson } from "../../../../src/plugins/doc/IPluginJson";
import { PluginManagementFacility } from "../../../../src/plugins/PluginManagementFacility";
import { AbstractPluginLifeCycle } from "../../../../src/plugins/AbstractPluginLifeCycle";
import { ImperativeError } from "../../../../../error";
import { Logger } from "../../../../../logger";
import { readFileSync, writeFileSync } from "jsonfile";
import { TextUtils } from "../../../../../utilities";
import { uninstall } from "../../../../src/plugins/utilities/npm-interface";
import UninstallHandler from "../../../../src/plugins/cmd/uninstall/uninstall.handler";

import * as NpmFunctions from "../../../../src/plugins/utilities/NpmFunctions";

describe("Plugin Management Facility uninstall handler", () => {

    // Objects created so types are correct.
    const mocks = {
        execSync: execSync as Mock<typeof execSync>,
        readFileSync: readFileSync as Mock<typeof readFileSync>,
        writeFileSync: writeFileSync as Mock<typeof writeFileSync>,
        uninstall: uninstall as Mock<typeof uninstall>
    };

    // two plugin set of values
    const packageName = "a";
    const packageVersion = "22.1.0";
    const packageRegistry = "http://imperative-npm-registry:4873/";

    const packageName2 = "plugin1";
    const packageVersion2 = "2.0.3";
    const packageRegistry2 = "http://imperative-npm-registry:4873/";

    beforeEach(() => {
    // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();

        // This needs to be mocked before running process function of uninstall handler
        (Logger.getImperativeLogger as Mock<typeof Logger.getImperativeLogger>).mockReturnValue(new Logger(new Console()));
        mocks.execSync.mockReturnValue(packageRegistry);
        mocks.readFileSync.mockReturnValue({});
    });

    /**
     *  Create object to be passed to process function
     *
     * @returns {IHandlerParameters}
     */
    const getIHandlerParametersObject = (): IHandlerParameters => {
        const x: any = {
            response: new (CommandResponse as any)(),
            arguments: {
                package: undefined
            },
        };
        return x as IHandlerParameters;
    };

    afterAll(() => {
        jest.restoreAllMocks();
    });

    /**
     * Validates that an uninstall call was valid based on the parameters passed.
     *
     * @param {string}   packageNameParm  expected package location that uninstall was called with.
     */
    const wasUninstallCallValid = (
        packageNameParm: string
    ) => {
        expect(mocks.uninstall).toHaveBeenCalledWith(
            packageNameParm
        );
    };

    /**
     * Checks that the successful message was written.
     *
     * @param {IHandlerParameters} params The parameters that were passed to the
     *                                    process function.
     */
    const wasUninstallSuccessful = (params: IHandlerParameters) => {
        expect(params.response.console.log).toHaveBeenCalledWith("Removal of the npm package(s) was successful.\n");
    };

    test("uninstall specified package", async () => {
        // plugin definitions mocking file contents
        const fileJson: IPluginJson = {
            a: {
                package: packageName,
                registry: undefined,
                version: packageVersion
            },
            plugin1: {
                package: packageName2,
                registry: packageRegistry2,
                version: packageVersion2
            }
        };

        // Override the return value for this test only
        mocks.readFileSync.mockReturnValueOnce(fileJson);

        const handler = new UninstallHandler();

        const params = getIHandlerParametersObject();
        params.arguments.plugin = ["a"];

        await handler.process(params as IHandlerParameters);

        wasUninstallCallValid(`${fileJson.a.package}`);

        wasUninstallSuccessful(params);
    });

    it("should handle an error during the uninstall", async () => {
        const chalk = TextUtils.chalk;

        const handler = new UninstallHandler();
        let expectedError: ImperativeError;
        const params = getIHandlerParametersObject();
        params.arguments.plugin = [];

        try {
            await handler.process(params as IHandlerParameters);
        } catch (e) {
            expectedError = e;
        }

        expect(expectedError.message).toBe(`${chalk.yellow.bold("Package name")} is required.`);

        // const installError = new Error("This is a test");
        // let expectedError: ImperativeError;
        //
        // mocks.install.mockImplementationOnce(() => {
        //   throw installError;
        // });
        //
        // try {
        //   await handler.process(params);
        // } catch (e) {
        //   expectedError = e;
        // }
        //
        // expect(expectedError.message).toBe("Install Failed");
    });
}); // end Plugin Management Facility uninstall handler


describe("callPluginPreUninstall", () => {
    const knownCredMgrPlugin = "@zowe/secrets-for-kubernetes-for-zowe-cli";
    const knownCredMgrDispNm = "Secrets for Kubernetes";
    const preUninstallErrText = "Pretend that the plugin's preUninstall function threw an error";
    let callPluginPreUninstallPrivate : any;
    let cfgLoaderLoadSpy;
    let fakePluginConfig: IImperativeConfig;
    let getPackageInfoSpy;
    let LifeCycleClass;
    let preUninstallWorked = false;
    let recordDefaultCredMgrInConfigSpy;
    let requirePluginModuleCallbackSpy;
    let uninstallHndlr;

    /**
     *  Set config to reflect if a plugin has a lifecycle class.
     */
    const pluginShouldHaveLifeCycle = (shouldHaveIt: boolean): void => {
        if (shouldHaveIt) {
            fakePluginConfig = {
                pluginLifeCycle: "fake/path/to/file/with/LC/class"
            };
        } else {
            fakePluginConfig = {
                // no LifeCycle
            };
        }

        // make ConfigurationLoader.load return a fake plugin configuration
        cfgLoaderLoadSpy = jest.spyOn(ConfigurationLoader, "load").mockReturnValue(
            fakePluginConfig
        );
    };

    /**
     *  Create a lifecycle class to reflect if preUninstall should work or not
     */
    const preUninstallShouldWork = (shouldWork: boolean): void => {
        if (shouldWork) {
            LifeCycleClass = class extends AbstractPluginLifeCycle {
                postInstall() {
                    return;
                }
                preUninstall() {
                    preUninstallWorked = true;
                }
            };
        } else {
            LifeCycleClass = class extends AbstractPluginLifeCycle {
                postInstall() {
                    return;
                }
                preUninstall() {
                    throw new ImperativeError({
                        msg: preUninstallErrText
                    });
                }
            };
        }
    };

    beforeAll(() => {
        // Prevent the logger from writing files during our tests
        jest.spyOn(Logger, "getImperativeLogger").mockImplementation((): Logger => {
            return  new Logger(new Console());
        });

        // prevent the real recordDefaultCredMgrInConfig from running
        recordDefaultCredMgrInConfigSpy =
            jest.spyOn(CredentialManagerOverride, "recordDefaultCredMgrInConfig").mockImplementation(() => {
                return;
            });

        // make getPackageInfo return a fake value
        getPackageInfoSpy = jest.spyOn(NpmFunctions, "getPackageInfo").mockImplementation(async () => {
            return {
                name: knownCredMgrPlugin,
                version: "9.9.9"
            };
        });

        // make requirePluginModuleCallback return our fake LifeCycleClass
        requirePluginModuleCallbackSpy = jest.spyOn(
            PluginManagementFacility.instance, "requirePluginModuleCallback").
            mockImplementation((_pluginName: string) => {
                return () => {
                    return LifeCycleClass as any;
                };
            });

        // Use uninstallHndlr["callPluginPreUninstall"] so that we can access a private function.
        uninstallHndlr = new UninstallHandler();
        callPluginPreUninstallPrivate = uninstallHndlr["callPluginPreUninstall"];
    });

    beforeEach(() => {
        preUninstallWorked = false;
    });

    it("should throw an error if a known credMgr does not implement preUninstall", async () => {
        // force our plugin to have NO LifeCycle class
        pluginShouldHaveLifeCycle(false);

        let thrownErr: any = null;
        try {
            await callPluginPreUninstallPrivate(knownCredMgrPlugin);
        } catch (err) {
            thrownErr = err;
        }

        expect(recordDefaultCredMgrInConfigSpy).toHaveBeenCalledWith(knownCredMgrDispNm);
        expect(requirePluginModuleCallbackSpy).toHaveBeenCalledTimes(1);
        expect(cfgLoaderLoadSpy).toHaveBeenCalledTimes(1);
        expect(thrownErr).not.toBeNull();
        expect(thrownErr.message).toContain(
            `The plugin '${knownCredMgrPlugin}', which overrides the CLI ` +
            `Credential Manager, does not implement the 'pluginLifeCycle' class. ` +
            `The CLI default Credential Manager ` +
            `(${CredentialManagerOverride.DEFAULT_CRED_MGR_NAME}) was automatically reinstated.`
        );
    });

    it("should do nothing if a non-credMgr does not implement preUninstall", async () => {
        // force our plugin to have NO LifeCycle class
        pluginShouldHaveLifeCycle(false);

        let thrownErr: any = null;
        try {
            callPluginPreUninstallPrivate("plugin_does_not_override_cred_mgr");
        } catch (err) {
            thrownErr = err;
        }
        expect(thrownErr).toBeNull();
    });

    it("should call the preUninstall function of a plugin", async () => {
        // force our plugin to have a LifeCycle class
        pluginShouldHaveLifeCycle(true);

        // force our plugin's preUninstall function to succeed
        preUninstallShouldWork(true);

        let thrownErr: any = null;
        try {
            await callPluginPreUninstallPrivate(knownCredMgrPlugin);
        } catch (err) {
            thrownErr = err;
        }

        expect(thrownErr).toBeNull();
        expect(preUninstallWorked).toBe(true);
    });

    it("should catch an error from a plugin's preUninstall function", async () => {
        // force our plugin to have a LifeCycle class
        pluginShouldHaveLifeCycle(true);

        // force our plugin's preUninstall function to fail
        preUninstallShouldWork(false);

        let thrownErr: any = null;
        try {
            await callPluginPreUninstallPrivate(knownCredMgrPlugin);
        } catch (err) {
            thrownErr = err;
        }

        expect(preUninstallWorked).toBe(false);
        expect(thrownErr).not.toBeNull();
        expect(thrownErr.message).toContain(
            `Unable to perform the 'preUninstall' action of plugin '${knownCredMgrPlugin}'`
        );
        expect(thrownErr.message).toContain(preUninstallErrText);
    });
}); // end callPluginPreUninstall
