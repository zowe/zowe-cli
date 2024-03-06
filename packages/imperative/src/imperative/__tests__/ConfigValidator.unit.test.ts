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

import { ConfigurationValidator, IImperativeConfig } from "../index";

describe("Imperative should validate config provided by the consumer", () => {

    const getGoodConfig: () => IImperativeConfig = () => {
        return {
            definitions: [
                {
                    name: "hello",
                    type: "command",
                    options: [],
                    description: "my command"
                }
            ],
            productDisplayName: "My product",
            defaultHome: "~/.myproduct",
            rootCommandDescription: "My Product CLI"
        };
    };

    it("If we omit productDisplayName from config," +
        " our validation should throw an error ", () => {
        const config = getGoodConfig();
        delete config.productDisplayName;
        try {
            ConfigurationValidator.validate(config);
            expect(false).toBe(true);
        }
        catch (e) {
            expect(e.message)
                .toContain("productDisplayName");
        }
    });

    it("If we omit commandModuleGlobs and definitions from our config, " +
        "our validator should throw an error  ", () => {
        const config = getGoodConfig();
        delete config.definitions;
        try {
            ConfigurationValidator.validate(config);
            expect(false).toBe(true);
        }
        catch (e) {
            expect(e.message)
                .toContain("definitions");
        }
    });

    it("If we specify multiple option definitions on a profile field, " +
        "but no custom create profile handler, we should get an error", () => {
        const config = getGoodConfig();
        config.profiles = [
            {
                type: "myprofile",
                schema: {
                    type: "object",
                    title: "My Profile",
                    description: "My very good profile",
                    properties: {
                        myProperty: {
                            type: "string",
                            optionDefinitions: [
                                {
                                    name: "my-property-a",
                                    type: "string",
                                    description: "First half of my property"
                                },
                                {
                                    name: "my-property-b",
                                    type: "string",
                                    description: "Second half of my property"
                                }
                            ]
                        }
                    }
                }
            }
        ];
        try {
            ConfigurationValidator.validate(config);
            expect(false).toBe(true);
        }
        catch (e) {
            expect(e.message).toContain(
                'Your Imperative profile configuration of type "myprofile" ' +
                'has the schema property "myProperty", which has multiple option definitions.'
            );
            expect(e.message).toContain("Imperative is not be able to map multiple command line arguments to a single profile property.");
        }
    });
});
