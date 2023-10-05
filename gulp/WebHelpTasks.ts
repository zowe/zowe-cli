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

import * as gulp from "gulp";

const bundleJsFiles = [
    // JQuery must come before Bootstrap
    "../node_modules/jquery/dist/jquery.min.js",
    "../node_modules/bootstrap/dist/js/bootstrap.min.js",
    "../node_modules/jstree/dist/jstree.min.js",
    "../node_modules/scroll-into-view-if-needed/umd/scroll-into-view-if-needed.min.js",
    "../node_modules/split.js/dist/split.min.js",
    "../node_modules/url-search-params-polyfill/index.js"
];
const bundleCssFiles = [
    // JSTree must come before Bootstrap
    "../node_modules/jstree/dist/themes/default/style.min.css",
    "../node_modules/bootstrap/dist/css/bootstrap.min.css"
];
const bundleDocsJsFiles = [
    "../node_modules/clipboard/dist/clipboard.min.js"
];
const bundleDocsCssFiles = [
    "../node_modules/balloon-css/balloon.min.css",
    "../node_modules/github-markdown-css/github-markdown.css"
];

const genBundleJs = () => {
    return gulp.src(bundleJsFiles.map(relPath => __dirname + "/" + relPath))
        .pipe(require("gulp-concat")("bundle.js"))
        .pipe(gulp.dest(__dirname + "/../packages/imperative/web-help/dist/js"));
};
genBundleJs.displayName = "generate bundle.js";

const genBundleCss = () => {
    // Bundle JSTree images inline in the CSS
    const postcssUrl = require("postcss-url")({ url: "inline" });
    return gulp.src(bundleCssFiles.map(relPath => __dirname + "/" + relPath))
        .pipe(require("gulp-postcss")([postcssUrl]))
        .pipe(require("gulp-concat")("bundle.css"))
        .pipe(gulp.dest(__dirname + "/../packages/imperative/web-help/dist/css"));
};
genBundleCss.displayName = "generate bundle.css";

const genBundleDocsJs = () => {
    return gulp.src(bundleDocsJsFiles.map(relPath => __dirname + "/" + relPath))
        .pipe(require("gulp-concat")("bundle-docs.js"))
        .pipe(gulp.dest(__dirname + "/../packages/imperative/web-help/dist/js"));
};
genBundleDocsJs.displayName = "generate bundle-docs.js";

const genBundleDocsCss = () => {
    return gulp.src(bundleDocsCssFiles.map(relPath => __dirname + "/" + relPath))
        .pipe(require("gulp-concat")("bundle-docs.css"))
        .pipe(gulp.dest(__dirname + "/../packages/imperative/web-help/dist/css"));
};
genBundleDocsCss.displayName = "generate bundle-docs.css";

const bundle = gulp.parallel(genBundleJs, genBundleCss, genBundleDocsJs, genBundleDocsCss);
bundle.description = "Bundle CSS and JS dependencies for web help";

exports.bundle = bundle;
