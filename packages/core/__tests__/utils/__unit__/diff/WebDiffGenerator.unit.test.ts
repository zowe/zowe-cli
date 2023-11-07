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

import * as  fs from 'fs';
import * as path from 'path';

import WebDiffGenerator from "../../../../src/utils/diff/WebDiffGenerator";
import { IO, ImperativeConfig } from "../../../../src";

describe("WebDiffGenerator", () => {
    // setting up fake cli home and web diff dir for testing
    const cliHome: string = "packages/__tests__/fakeCliHome";
    const webDiffDir: string = path.join(cliHome, 'web-diff');


    describe("buildDiffDir", () => {
        beforeAll(async () => {
            // checking if fakewebdiffdir exists or not
            if (!fs.existsSync(webDiffDir)) {
                IO.mkdirp(webDiffDir);
            }
        });
        afterAll(async () => {
            const rimraf = require('rimraf');
            rimraf.sync('packages/__tests__');
        });
        it("should build the web diff dir at cli home", async () => {

            const generator = new WebDiffGenerator(ImperativeConfig.instance, webDiffDir);
            await generator.buildDiffDir();

            // expecting if the function created the dirs
            expect(fs.existsSync(webDiffDir)).toBeTruthy();
            expect(fs.existsSync(`${webDiffDir}/index.html`)).toBeTruthy();
        });
    });
});
