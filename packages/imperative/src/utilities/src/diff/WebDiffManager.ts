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

import { Constants } from "../../../constants/src/Constants";
import { ProcessUtils, GuiResult } from "../../../utilities/src/ProcessUtils";
import { ImperativeConfig } from "../../../utilities/src/ImperativeConfig";
import WebDiffGenerator from "./WebDiffGenerator";
import { IWebDiffManager } from "./doc/IWebDiffManager";
import { ImperativeError } from "../../../error";
import { html } from "diff2html";

/**
 * Imperative Web Differences Manager handles the opening of diffs and
 * constructs the dirs and files if necessary
 * @export
 * @class WebDiffManager
 */
export class WebDiffManager implements IWebDiffManager {
    /**
     * Singleton instance of this class
     * @private
     * @static
     * @type {WebDiffManager}
     * @memberof WebDiffManager
     */
    private static mInstance: WebDiffManager = null;

    /**
     * Return a singleton instance of this class
     * @static
     * @readonly
     */
    public static get instance(): WebDiffManager {
        if (this.mInstance == null) {
            this.mInstance = new WebDiffManager();
        }

        return this.mInstance;
    }


    /**
     * Launch diffs page in browser.
     * @memberof WebDiffManager
     */
    public async openDiffs(patchDiff: string) {
        const doWeHaveGui = ProcessUtils.isGuiAvailable();
        if (doWeHaveGui !== GuiResult.GUI_AVAILABLE) {
            let errMsg = "You are running in an environment with no graphical interface." +
                "\nAlternatively, you can run '" + ImperativeConfig.instance.findPackageBinName() +
                " --help' for text-based help.";
            if (doWeHaveGui === GuiResult.NO_GUI_NO_DISPLAY) {
                errMsg += "\n\nIf you are running in an X Window environment," +
                    "\nensure that your DISPLAY environment variable is set." +
                    "\nFor example, type the following:" +
                    "\n    echo $DISPLAY" +
                    "\nIf it is not set, assign a valid value. For example:" +
                    "\n    export DISPLAY=:0.0" +
                    "\nThen try the --help-web option again.";

                throw new ImperativeError({
                    msg: errMsg
                });
            }

            return;
        }

        if (!fs.existsSync(this.webDiffDir)) await new WebDiffGenerator(ImperativeConfig.instance, this.webDiffDir).buildDiffDir();

        const htmlDiff = html(patchDiff, {
            outputFormat: "side-by-side",
            matching: "lines",
            diffStyle: "char",
        });

        if (htmlDiff != null) {
            // writing the diff content into a text file
            fs.writeFileSync(path.join(this.webDiffDir, 'index.html'), this.genHtmlForDiffs(htmlDiff, patchDiff));
            try {
                ProcessUtils.openInDefaultApp(`file://${this.webDiffDir}/index.html`);
            } catch (e) {
                throw new ImperativeError({
                    msg: "Failed to launch web diff, try running -h for console help instead",
                    causeErrors: [e]
                });
            }
        }
    }


    /**
     * Gets the directory where built copy of web diff launcher is stored
     * @readonly
     * @private
     * @returns {string} Absolute path of directory
     */
    private get webDiffDir(): string {
        return path.join(ImperativeConfig.instance.cliHome, Constants.WEB_DIFF_DIR);
    }

    /**
     * Returns header HTML for web diff page
     * @private
     * @param htmlDiff - html diffs of the file changes
     * @param unifiedStringDiff - unified string of difference between two files
     */
    private genHtmlForDiffs(htmlDiff: string, unifiedStringDiff: string): string {
        return `<!DOCTYPE html>
        <html>
          <head>
          <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.1/styles/github.min.css"
          integrity="sha384-yaOEEinoAKxVHv1ZCY3vqJeRItlRVwZ9pyTCCJLHlyHNndGZIF+S30C1+8oRQ2sz"
          crossorigin="anonymous"
          />
          <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/diff2html@3.4.17/bundles/css/diff2html.min.css"
          integrity="sha384-SqVaGvqd1A6pQfywL1yrJwftrR6C959ImMNnuqO5DbCpiRI4OepQ9eGhnFlj02Sw"
          crossorigin="anonymous"
          />
            <script
            src="https://cdn.jsdelivr.net/npm/diff2html@3.4.17/bundles/js/diff2html-ui.min.js"
            integrity="sha384-TIP1pakMMiVbwLawU7P/eb6fvLfX981YfIqvX9kc7EPlXcmDH8swvWieaA5kfv/q"
            crossorigin="anonymous">
            </script>

            <script>
                const fr = new FileReader()

                fr.onload(()=>{
                    document.getElementById('diffOutput').textContent = fr.result
                })

                fr.readAsText()
            const diffString = ${unifiedStringDiff}

              document.addEventListener('DOMContentLoaded', function () {
                var targetElement = document.getElementsByClassName('d2h-file-list-wrapper')[0];
                var configuration = {
                  drawFileList: true,
                  fileListToggle: false,
                  fileListStartVisible: false,
                  fileContentToggle: false,
                  matching: 'none',
                  outputFormat: 'side-by-side',
                  synchronisedScroll: true,
                  highlight: true,
                  renderNothingWhenEmpty: false,
                };
                var diff2htmlUi = new Diff2HtmlUI(targetElement, diffString, configuration);
                diff2htmlUi.draw();
                diff2htmlUi.highlightCode();
              });
            </script>

            <meta content="0; url=diff.html?p=" />
          </head>
          <body>
            ${htmlDiff}
          </body>
        </html>
    `;
    }
}
