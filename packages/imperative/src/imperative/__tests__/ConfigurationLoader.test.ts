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

import { ConfigurationLoader } from "..";
import { IImperativeOverrides } from "../src/doc/IImperativeOverrides";
import { IApimlSvcAttrs } from "../src/doc/IApimlSvcAttrs";
import { homedir } from "os";
import * as path from "path";

function getCallerFile(file: string) {
    return require(file);
}

describe("ConfigurationLoader", () => {
    describe("overrides", () => {
        it("should return a config with an empty overrides", () => {
            const result = ConfigurationLoader.load(
                {
                    name: "some-name"
                },
                {},
                () => undefined
            );

            expect(result.overrides).toEqual({});
        });

        it("should return a config with the passed overrides", () => {
            const overrides: IImperativeOverrides = {
                CredentialManager: "./ABCD.ts"
            };

            const result = ConfigurationLoader.load(
                {
                    name: "some-name",
                    overrides
                },
                {},
                () => undefined
            );

            expect(result.overrides).toEqual(overrides);
        });

        it("should return a config with apimlConnLookup", () => {
            const apimlConnLookup: IApimlSvcAttrs[] = [
                {
                    apiId: "fake_apiId_1",
                    gatewayUrl: "fake_gatewayUrl_1",
                    connProfType: "fake_connProfType_1"
                },
                {
                    apiId: "fake_apiId_2",
                    gatewayUrl: "fake_gatewayUrl_2",
                    connProfType: "fake_connProfType_2"
                }
            ];

            const result = ConfigurationLoader.load(
                {
                    name: "some-name",
                    apimlConnLookup
                },
                {},
                () => undefined
            );

            expect(result.apimlConnLookup).toEqual(apimlConnLookup);
        });
    });

    describe("ConfigurationModule", () => {
        it("should return a config", () => {

            const result = ConfigurationLoader.load(
                {
                    configurationModule: path.join(__dirname, "__model__", "Sample.configuration.ts")
                },
                {},
                getCallerFile
            );

            expect(result.productDisplayName).toEqual("Zowe");
            expect(result.rootCommandDescription).toEqual("Sample");
            expect(result.envVariablePrefix).toEqual("Sample");
            expect(result.defaultHome).toEqual(homedir());
        });
        it("should return a config without changing the name", () => {

            const result = ConfigurationLoader.load(
                {
                    productDisplayName: "notZowe",
                    configurationModule: path.join(__dirname, "__model__", "Sample.configuration.ts")
                },
                {},
                getCallerFile
            );

            expect(result.productDisplayName).toEqual("Zowe");
            expect(result.rootCommandDescription).toEqual("Sample");
            expect(result.envVariablePrefix).toEqual("Sample");
            expect(result.defaultHome).toEqual(homedir());
        });
        it("should return a config with daemonMode", () => {

            const result = ConfigurationLoader.load(
                {
                    configurationModule: path.join(__dirname, "__model__", "Sample.configuration.ts"),
                    daemonMode: true
                },
                {},
                getCallerFile
            );

            expect(result.productDisplayName).toEqual("Zowe");
            expect(result.rootCommandDescription).toEqual("Sample");
            expect(result.envVariablePrefix).toEqual("Sample");
            expect(result.defaultHome).toEqual(homedir());
            expect(result.daemonMode).toEqual(true);
        });
    });
});
