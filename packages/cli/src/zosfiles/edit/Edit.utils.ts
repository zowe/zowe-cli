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

import { IImperativeConfig, Imperative, ProcessUtils } from "@zowe/imperative";
import { PathLike } from "fs";
import { tmpdir } from "os";
import path = require("path");
import { ICompareFileOptions } from "../compare/doc/ICompareFileOptions";

/**
 * Get the Imperative config object which defines properties of the CLI.
 * This allows it to be accessed without calling Imperative.init.
 */
export function getImperativeConfig(): IImperativeConfig {
    return require("./imperative");
}

// 2. build tmp_dir
export function buildTempDir(sessionInfo, fileName, isUssFile): PathLike{
    return tmpdir
}
// 2a. hash uss file name
// 3. check for tmp_dir's existance as stash
// 4a. if prexisting tmp_dir: override stash
// 4b. if prexisting tmp_dir: use stash
// 4ba. perform file comparison, show output in terminal
// 4bb. overwrite ETAG 
// 5a. check for default editor and headless environment
ProcessUtils.isGuiAvailable
// 5b. open lf in editor or tell user to open up on their own if headless or no set default
// 6. wait for user input to continue
// 7. once input recieved, upload tmp file with saved ETAG
// 7a. if matching ETAG: sucessful upload, destroy tmp file -> END
// 7a. if non-matching ETAG: unsucessful upload -> 4a