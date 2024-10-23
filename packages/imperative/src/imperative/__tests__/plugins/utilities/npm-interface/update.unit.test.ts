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

jest.mock("cross-spawn");
jest.mock("jsonfile");
jest.mock("../../../../src/plugins/utilities/PMFConstants");

import { Console } from "../../../../../console";
import { IPluginJson } from "../../../../src/plugins/doc/IPluginJson";
import { Logger } from "../../../../../logger";
import { PMFConstants } from "../../../../src/plugins/utilities/PMFConstants";
import * as jsonfile from "jsonfile";
import { update } from "../../../../src/plugins/utilities/npm-interface";
import * as npmFns from "../../../../src/plugins/utilities/NpmFunctions";

describe("PMF: update Interface", () => {
    // Objects created so types are correct.
    const mocks = {
        installPackages: jest.spyOn(npmFns, "installPackages"),
        readFileSync: jest.spyOn(jsonfile, "readFileSync"),
        getPackageInfo: jest.spyOn(npmFns, "getPackageInfo")
    };

    const packageName = "pretty-format";
    const packageVersion = "1.2.3";
    const packageRegistry = "https://registry.npmjs.org/";

    beforeEach(() => {
        // Mocks need cleared after every test for clean test runs
        jest.resetAllMocks();

        // This needs to be mocked before running update
        jest.spyOn(Logger, "getImperativeLogger").mockReturnValue(new Logger(new Console()));

        /* Since update() adds new plugins into the value returned from
        * readFileSync(plugins.json), we must reset readFileSync to return an empty set before each test.
        */
        mocks.readFileSync.mockReturnValue({});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    /**
   * Validates that an spawnSync npm install call was valid based on the parameters passed.
   *
   * @param {string} expectedPackage The package that should be sent to npm update
   * @param {string} expectedRegistry The registry that should be sent to npm update
   * @param {boolean} [updateFromFile=false] was the update from a file. This affects
   *                                          the pipe sent to spawnSync stdio option.
   */
    const wasNpmInstallCallValid = (expectedPackage: string, expectedRegistry: Record<string, string>) => {
        expect(mocks.installPackages).toHaveBeenCalledWith(expectedPackage,
            { prefix: PMFConstants.instance.PLUGIN_INSTALL_LOCATION, ...expectedRegistry });
    };

    it("should update from the npm registry", async () => {

        // value for our plugins.json
        const oneOldPlugin: IPluginJson = {
            plugin1: {
                package: packageName,
                location: packageRegistry,
                version: packageVersion
            }
        };

        mocks.getPackageInfo.mockResolvedValue({ name: packageName, version: packageVersion });
        mocks.readFileSync.mockReturnValue(oneOldPlugin);

        const registryInfo = new npmFns.NpmRegistryInfo(packageRegistry);
        registryInfo.setPackage(oneOldPlugin.plugin1);
        const data = await update(packageName, registryInfo);
        expect(data).toEqual(packageVersion);

        // Validate the update
        wasNpmInstallCallValid(packageName, { registry: packageRegistry });
    });

    it("should update from scoped npm registry", async () => {

        // value for our plugins.json
        const scopedPackageName = `@org/${packageName}`;
        const oneOldPlugin: IPluginJson = {
            plugin1: {
                package: scopedPackageName,
                location: packageRegistry,
                version: packageVersion
            }
        };

        mocks.getPackageInfo.mockResolvedValue({ name: scopedPackageName, version: packageVersion });
        mocks.readFileSync.mockReturnValue(oneOldPlugin);

        const registryInfo = new npmFns.NpmRegistryInfo(packageRegistry);
        registryInfo.setPackage(oneOldPlugin.plugin1);
        const data = await update(scopedPackageName, registryInfo);
        expect(data).toEqual(packageVersion);

        // Validate the update
        wasNpmInstallCallValid(scopedPackageName, { "@org:registry": packageRegistry });
    });
});
