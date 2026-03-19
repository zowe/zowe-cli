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

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const bundleJsFiles = [
    // JQuery must come before Bootstrap
    "jquery/dist/jquery.min.js",
    "bootstrap/dist/js/bootstrap.min.js",
    "jstree/dist/jstree.min.js",
    "scroll-into-view-if-needed/umd/scroll-into-view-if-needed.min.js",
    "split.js/dist/split.min.js"
];
const bundleCssFiles = [
    // JSTree must come before Bootstrap
    "jstree/dist/themes/default/style.min.css",
    "jstree/dist/themes/default-dark/style.min.css",
    "bootstrap/dist/css/bootstrap.min.css"
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
        const filePath = require.resolve(file);
        const data = await fsp.readFile(filePath);
        bundle.push(transform != null ? await transform(data, filePath) : data);
    }
    await fsp.writeFile(outFile, bundle.join("\n"));
}

const inlineUrlsPlugin = () => ({
    postcssPlugin: "postcss-inline-urls",
    Declaration(decl) {
        if (!decl.value.includes("url(") || !decl.source?.input?.file) return;
        const urlPattern = /url\(["']?(?!data:)([^"')]+)["']?\)/g;
        const mimeTypes = { ".gif": "image/gif", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
        const fromDir = path.dirname(decl.source.input.file);
        decl.value = decl.value.replace(urlPattern, (match, filePath) => {
            const absPath = path.resolve(fromDir, filePath);
            if (!fsSync.existsSync(absPath)) return match;
            const ext = path.extname(absPath).toLowerCase();
            const mime = mimeTypes[ext] || "application/octet-stream";
            return `url(data:${mime};base64,${fsSync.readFileSync(absPath).toString("base64")})`;
        });
    }
});
inlineUrlsPlugin.postcss = true;

function postcssTransform(data, filePath) {
    // Bundle JSTree images inline in the CSS
    return require("postcss")([inlineUrlsPlugin])
        .process(data, { from: filePath, to: filePath })
        .then((result) => result.css);
}

process.stdout.write("compiling web help bundle");
Promise.all([
    fsp.mkdir(__dirname + "/dist/js", { recursive: true }),
    concatFiles(bundleJsFiles, __dirname + "/dist/js/bundle.js"),
    concatFiles(bundleCssFiles, __dirname + "/dist/css/bundle.css", postcssTransform),
    concatFiles(bundleDocsCssFiles, __dirname + "/dist/css/bundle-docs.css")
]).then(() => console.log(" done"));
