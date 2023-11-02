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

const fs = require("fs/promises");

const bundleJsFiles = [
    // JQuery must come before Bootstrap
    "jquery/dist/jquery.min.js",
    "bootstrap/dist/js/bootstrap.min.js",
    "jstree/dist/jstree.min.js",
    "scroll-into-view-if-needed/umd/scroll-into-view-if-needed.min.js",
    "split.js/dist/split.min.js",
    "url-search-params-polyfill/index.js"
];
const bundleCssFiles = [
    // JSTree must come before Bootstrap
    "jstree/dist/themes/default/style.min.css",
    "jstree/dist/themes/default-dark/style.min.css",
    "bootstrap/dist/css/bootstrap.min.css"
];
const bundleDocsJsFiles = [
    "clipboard/dist/clipboard.min.js"
];
const bundleDocsCssFiles = [
    "balloon-css/balloon.min.css",
    "github-markdown-css/github-markdown.css"
];

async function concatFiles(inFiles, outFile, transform) {
    // Concatenate CSS/JS files into a bundle
    const bundle = [];
    for (const file of inFiles) {
        process.stdout.write(".");
        const path = require.resolve(file);
        const data = await fs.readFile(path);
        bundle.push(transform != null ? await transform(data, path) : data);
    }
    await fs.writeFile(outFile, bundle.join("\n"));
}

function postcssTransform(data, path) {
    // Bundle JSTree images inline in the CSS
    const postcss = require("postcss");
    const postcssUrl = require("postcss-url")({ url: "inline" });
    return new Promise((resolve) => {
        postcss([postcssUrl])
        .process(data, { from: path, to: path })
        .then((result) => resolve(result.css));
    });
}

process.stdout.write("compiling web help bundle");
Promise.all([
    fs.mkdir(__dirname + "/dist/js", { recursive: true }),
    concatFiles(bundleJsFiles, __dirname + "/dist/js/bundle.js"),
    concatFiles(bundleCssFiles, __dirname + "/dist/css/bundle.css", postcssTransform),
    concatFiles(bundleDocsJsFiles, __dirname + "/dist/js/bundle-docs.js"),
    concatFiles(bundleDocsCssFiles, __dirname + "/dist/css/bundle-docs.css")
]).then(() => console.log(" done"));
