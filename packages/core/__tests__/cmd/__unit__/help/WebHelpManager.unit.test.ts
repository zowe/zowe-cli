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
import * as fsExtra from "fs-extra";
import * as path from "path";
import * as rimraf from "rimraf";
import {
    IImperativeConfig, ImperativeConfig, CommandResponse, Imperative, WebHelpGenerator,
    ProcessUtils, GuiResult, WebHelpManager, IO
} from "../../../../src";

describe("WebHelpManager", () => {
    describe("buildHelp", () => {
        const configForHelp: IImperativeConfig = {
            definitions: [
                {
                    name: "hello",
                    type: "command",
                    options: [],
                    description: "my command"
                }
            ],
            productDisplayName: "WinHelp Test",
            defaultHome: "~/.myproduct",
            rootCommandDescription: "Some Product CLI"
        };
        const mockCliHome = path.resolve("./packages/__tests__/mockCliHome");
        const webHelpDirNm = path.join(mockCliHome, "web-help");
        const impCfg: ImperativeConfig = ImperativeConfig.instance;
        const cmdReponse = new CommandResponse({ silent: false });
        const mainModule = process.mainModule;
        let opener: any;
        let instPluginsFileNm: string;
        let oldProcessEnv: any;

        beforeAll(async () => {
            jest.mock("opener");
            opener = require("opener");

            rimraf.sync(mockCliHome);

            /* getResolvedCmdTree calls getCallerLocation, and we need it to return some string.
             * getCallerLocation is a getter of a property, so we mock the property.
             */
            (process.mainModule as any) = {
                filename: "FakeCli"
            };

            // cliHome is a getter of a property, so mock the property
            Object.defineProperty(impCfg, "cliHome", {
                configurable: true,
                get: jest.fn(() => {
                    return mockCliHome;
                })
            });

            // imperative.init does all the setup for WebHelp to be run
            await Imperative.init(configForHelp);
        });

        beforeEach(() => {
            oldProcessEnv = { ...process.env };
        });

        afterEach(() => {
            jest.clearAllMocks();
            process.env = oldProcessEnv;
        });

        afterAll(() => {
            process.mainModule = mainModule;
            rimraf.sync(mockCliHome);
        });

        it("when there is no GUI available should not display help", async () => {
            const realBuildHelp = WebHelpGenerator.prototype.buildHelp;
            const mockBuildHelp = jest.fn();
            WebHelpGenerator.prototype.buildHelp = mockBuildHelp;

            ProcessUtils.isGuiAvailable = jest.fn(() => GuiResult.NO_GUI_NO_DISPLAY);
            WebHelpManager.instance.openRootHelp(cmdReponse);

            expect(mockBuildHelp).not.toHaveBeenCalled();
            const jsonResult = cmdReponse.buildJsonResponse();
            expect(jsonResult.stdout.toString()).toContain(
                "You are running in an environment with no graphical interface"
            );
            expect(fs.existsSync(webHelpDirNm)).toBe(false);

            expect(opener).not.toHaveBeenCalled();

            // restore real function
            WebHelpGenerator.prototype.buildHelp = realBuildHelp;
        });

        describe("when there is a GUI available", () => {
            beforeAll( async () => {
                // ensure that the plugins directory exists
                instPluginsFileNm = path.join(mockCliHome, "plugins");
                if (!fs.existsSync(instPluginsFileNm)) {
                    IO.mkdirp(instPluginsFileNm);
                }

                // add the plugins file name to the directory, and create an empty object
                instPluginsFileNm = path.join(instPluginsFileNm, "plugins.json");
                fs.writeFileSync(instPluginsFileNm, "{}");

                // copy our webhelp distribution files to our test's src directory
                fsExtra.copySync(__dirname + "/../../../../web-help/dist", webHelpDirNm + "/dist");

                /* When jenkins machine runs this test as an integration test,
                * it needs the path to docs to exist, even though Windows does not care.
                */
                const webHelpDocsDirNm = webHelpDirNm + "/docs";
                if (!fs.existsSync(webHelpDocsDirNm)) {
                    IO.mkdirp(webHelpDocsDirNm);
                }
            });

            it("should generate and display help", async () => {
                ProcessUtils.isGuiAvailable = jest.fn(() => GuiResult.GUI_AVAILABLE);
                WebHelpManager.instance.openRootHelp(cmdReponse);

                // do our generated files contain some of the right stuff?
                let fileNmToTest = webHelpDirNm + "/index.html";
                let fileText = fs.readFileSync(fileNmToTest, "utf8");
                expect(fileText).toContain('div id="panel-container"');
                expect(fileText).toContain('div id="tree-tabs"');
                expect(fileText).toContain('div id="cmd-tree"');

                fileNmToTest = webHelpDirNm + "/tree-data.js";
                fileText = fs.readFileSync(fileNmToTest, "utf8");
                expect(fileText).toContain('"id":"FakeCli.html"');

                // do a reasonable set of generated files exist?
                expect(fs.existsSync(webHelpDirNm + "/docs/FakeCli.html")).toBe(true);
                expect(fs.existsSync(webHelpDirNm + "/docs/FakeCli_config.html")).toBe(true);
                expect(fs.existsSync(webHelpDirNm + "/docs/FakeCli_hello.html")).toBe(true);
                expect(fs.existsSync(webHelpDirNm + "/docs/FakeCli_plugins_install.html")).toBe(true);
                expect(fs.existsSync(webHelpDirNm + "/docs/FakeCli_plugins_uninstall.html")).toBe(true);

                expect(opener).toHaveBeenCalledTimes(1);
                expect(opener).toHaveBeenCalledWith(`file:///${webHelpDirNm}/index.html`);
            });

            it("should display existing help", async () => {
                const realBuildHelp = WebHelpGenerator.prototype.buildHelp;
                const mockBuildHelp = jest.fn();
                WebHelpGenerator.prototype.buildHelp = mockBuildHelp;

                ProcessUtils.isGuiAvailable = jest.fn(() => GuiResult.GUI_AVAILABLE);
                WebHelpManager.instance.openRootHelp(cmdReponse);

                expect(mockBuildHelp).not.toHaveBeenCalled();

                expect(opener).toHaveBeenCalledTimes(1);
                expect(opener).toHaveBeenLastCalledWith(`file:///${webHelpDirNm}/index.html`);

                // restore real function
                WebHelpGenerator.prototype.buildHelp = realBuildHelp;
            });

            it("should display existing help for a specific command", async () => {
                const realBuildHelp = WebHelpGenerator.prototype.buildHelp;
                const mockBuildHelp = jest.fn();
                WebHelpGenerator.prototype.buildHelp = mockBuildHelp;

                ProcessUtils.isGuiAvailable = jest.fn(() => GuiResult.GUI_AVAILABLE);
                WebHelpManager.instance.openHelp("fakeCmd", cmdReponse);

                expect(mockBuildHelp).not.toHaveBeenCalled();

                expect(opener).toHaveBeenCalledTimes(1);
                expect(opener).toHaveBeenLastCalledWith(`file:///${webHelpDirNm}/launcher.html`);

                // restore real function
                WebHelpGenerator.prototype.buildHelp = realBuildHelp;
            });

            it("should regenerate and display help in development mode", async () => {
                const realBuildHelp = WebHelpGenerator.prototype.buildHelp;
                const mockBuildHelp = jest.fn();
                WebHelpGenerator.prototype.buildHelp = mockBuildHelp;

                ProcessUtils.isGuiAvailable = jest.fn(() => GuiResult.GUI_AVAILABLE);
                process.env.NODE_ENV = "development";
                WebHelpManager.instance.openRootHelp(cmdReponse);

                expect(mockBuildHelp).toHaveBeenCalled();

                expect(opener).toHaveBeenCalledTimes(1);
                expect(opener).toHaveBeenLastCalledWith(`file:///${webHelpDirNm}/index.html`);

                // restore real function
                WebHelpGenerator.prototype.buildHelp = realBuildHelp;
            });
        });
    });
});
