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

import * as fs from "fs";
import * as path from "path";

import { Imperative } from "../../../imperative/src/Imperative";
import { WebHelpGenerator } from "../../src/help/WebHelpGenerator";
import { WebHelpManager } from "../../src/help/WebHelpManager";
import { CommandResponse } from "../../src/response/CommandResponse";
import { IImperativeConfig } from "../../../imperative/src/doc/IImperativeConfig";
import { ImperativeConfig } from "../../../utilities/src/ImperativeConfig";
import { IO } from "../../../io";
import { ICommandDefinition } from "../../../cmd/src/doc/ICommandDefinition";

describe("WebHelpGenerator", () => {
    describe("buildHelp", () => {
        const mainModule = process.mainModule;
        let moduleFileNm: string;
        let cliHome: string;
        let configForHelp: IImperativeConfig;
        let webHelpDirNm: string;
        let rimraf: any;
        let loremIpsum: string;

        beforeAll(async () => {
            rimraf = require("rimraf");

            // any file that lives under the imperative directory will work for our test
            moduleFileNm = "fakeCliCmd";
            cliHome = "packages/__tests__/fakeCliHome";
            webHelpDirNm = path.join(cliHome, "web-help");

            loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore\n" +
            "et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo\n" +
            "consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n"+
            "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
            const exampleCommand: ICommandDefinition = {
                name: "world",
                type: "command",
                options: [],
                description: "my command"
            };
            configForHelp = {
                definitions: [
                    {
                        name: "hello",
                        type: "group",
                        options: [],
                        description: "my group",
                        children: [
                            exampleCommand,
                            {
                                name: "universe",
                                type: "group",
                                options: [],
                                description: "my subgroup",
                                children: [exampleCommand]
                            },
                            {
                                name: "wordWrap",
                                aliases: ["ww"],
                                type: "command",
                                options: [
                                    {
                                        name: "test-option",
                                        aliases: ["to"],
                                        type: "string",
                                        description: loremIpsum,
                                        allowableValues: {
                                            values: ["banana", "coconut"]
                                        },
                                        defaultValue: "banana"
                                    }
                                ],
                                description: "this is a test for wordwrap and default/allowed values"
                            },
                            {
                                name: "linkify",
                                aliases: ["l"],
                                type: "command",
                                options: [],
                                description: "this is a test for hyperlinks: database.name and https://example.com"
                            }
                        ]
                    }
                ],
                name: moduleFileNm,
                productDisplayName: "WinHelp Test",
                defaultHome: cliHome,
                rootCommandDescription: "Some Product CLI"
            };

            rimraf.sync(cliHome);

            /* process.mainModule.filename was null, so we must give it a value.
             * mainModule is a getter of a property, so we mock the property.
             */
            (process.mainModule as any) = {
                filename: moduleFileNm
            };

            // imperative.init does all the setup for WebHelp to be run
            await Imperative.init(configForHelp);
        });

        afterAll(() => {
            process.mainModule = mainModule;
            rimraf.sync(cliHome);
        });

        it("should create Help files", async () => {
            const cmdResp = new CommandResponse({ silent: false });
            const existsSync = jest.requireActual("fs").existsSync;

            /* When jenkins machine runs this test as an integration test,
             * it needs the path to docs to exist, even though Windows does not care.
             */
            const webHelpDocsDirNm = webHelpDirNm + "/docs";
            if (!existsSync(webHelpDocsDirNm)) {
                IO.mkdirp(webHelpDocsDirNm);
            }

            const webHelpGen = new WebHelpGenerator(
                WebHelpManager.instance.fullCommandTree,
                ImperativeConfig.instance,
                webHelpDirNm
            );
            webHelpGen.buildHelp(cmdResp);

            // do our generated files contain some of the right stuff?
            let fileNmToTest = webHelpDirNm + "/index.html";
            let fileText = fs.readFileSync(fileNmToTest, "utf8");
            expect(fileText).toContain('div id="panel-container"');
            expect(fileText).toContain('div id="tree-tabs"');
            expect(fileText).toContain('div id="cmd-tree"');

            fileNmToTest = webHelpDirNm + "/tree-data.js";
            fileText = fs.readFileSync(fileNmToTest, "utf8");
            expect(fileText).toContain('"id":"' + moduleFileNm + '.html"');

            fileNmToTest = webHelpDocsDirNm + "/" + moduleFileNm + "_hello.html";
            fileText = fs.readFileSync(fileNmToTest, "utf8");
            expect(fileText).toContain("<h4>Commands</h4>");
            expect(fileText).toContain("<h4>Groups</h4>");

            fileNmToTest = webHelpDocsDirNm + "/" + moduleFileNm + "_hello_wordWrap.html";
            fileText = fs.readFileSync(fileNmToTest, "utf8");
            expect(fileText).toContain("<h4>Usage</h4>");
            // Single space after the binary/cli name
            expect(fileText).toContain(`<p>${moduleFileNm} hello wordWrap [options]</p>`);
            expect(fileText).toContain(`
<li>
<p>${loremIpsum.split("\n").join("<br>\n")}</p>
<p>Default value: banana<br>
Allowed values: banana, coconut</p>
</li>
`);

            fileNmToTest = webHelpDocsDirNm + "/" + moduleFileNm + "_hello_linkify.html";
            fileText = fs.readFileSync(fileNmToTest, "utf8");
            expect(fileText).toContain("<h4>Usage</h4>");
            expect(fileText).toContain(`<p>${moduleFileNm} hello linkify [options]</p>`);
            expect(fileText).toContain(`<p>this is a test for hyperlinks: database.name and ` +
                `<a href="https://example.com">https://example.com</a></p>`);

            // do a reasonable set of generated files exist?
            expect(existsSync(webHelpDocsDirNm + "/" + moduleFileNm + ".html")).toBe(true);
            expect(existsSync(webHelpDocsDirNm + "/" + moduleFileNm + "_config.html")).toBe(true);
            expect(existsSync(webHelpDocsDirNm + "/" + moduleFileNm + "_hello_wordWrap.html")).toBe(true);
            expect(existsSync(webHelpDocsDirNm + "/" + moduleFileNm + "_hello_universe.html")).toBe(true);
            expect(existsSync(webHelpDocsDirNm + "/" + moduleFileNm + "_hello_world.html")).toBe(true);
            expect(existsSync(webHelpDocsDirNm + "/" + moduleFileNm + "_plugins_install.html")).toBe(true);
            expect(existsSync(webHelpDocsDirNm + "/" + moduleFileNm + "_plugins_uninstall.html")).toBe(true);
        });
    });
});
