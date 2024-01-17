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

/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";

import { ImperativeConfig } from "..//ImperativeConfig";
import { ImperativeError } from "../../error/ImperativeError";
import { IWebDiffGenerator } from "./doc/IWebDiffGenerator";

/**
 * Imperative web diff generator. Accepts the diffContent and constructs
 * the whole webb diff browser view
 *
 * @export
 * @class WebDiffGenerator
 */
class WebDiffGenerator implements IWebDiffGenerator {

    /**
     * Imperative config containing data about the CLI
     * @private
     * @memberof WebDiffGenerator
     */
    private mConfig: ImperativeConfig;

    private webDiffDir: string;

    /**
     * Create an instance of WebDiffGenerator.
     * @param {ImperativeConfig} - Imperative config containing data about the CLI
     * @param {string} - Output directory for web diff files
     */
    constructor(config: ImperativeConfig , webDiffDir: string) {
        this.mConfig = config;
        this.webDiffDir = webDiffDir;
    }

    /**
     * Diff directory builder at the cli home to open the diff strings comparison
     * in the browser.
     */
    public async buildDiffDir() {


        // requiring fs-extra for later use in copying the dir and files
        const fsExtra = await require("fs-extra");
        // Ensure web diff dir exists
        if (!fs.existsSync(this.webDiffDir)) {
            fs.mkdirSync(this.webDiffDir);
        }

        // getting the template directory for web-diff in the root of project
        const templateWebDiffDir: string = path.join(__dirname, "../../../web-diff");
        if (!fs.existsSync(templateWebDiffDir)) {
            throw new ImperativeError({
                msg: `The web-diff distribution directory does not exist:\n    "${templateWebDiffDir}"`
            });
        }

        // getting the files required to copied
        const dirsToCopy: string[] = [templateWebDiffDir];

        // copying files from template web diff dir to cli home web diff dir
        dirsToCopy.forEach((dir: string) => {
            const destDir = path.join(this.webDiffDir, path.relative(templateWebDiffDir, dir));

            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir);
            }

            fs.readdirSync(dir)
                .filter((pathname: string) => fs.statSync(path.join(dir, pathname)).isFile())
                .forEach((filename: string) => {
                    fsExtra.copySync(path.join(dir, filename), path.join(destDir, filename));
                });
        });

    }

}


export default WebDiffGenerator;
