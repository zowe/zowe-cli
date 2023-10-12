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

import { DefaultHelpGenerator } from "./DefaultHelpGenerator";
import { ICommandDefinition } from "../doc/ICommandDefinition";
import { ImperativeConfig } from "../../../utilities";
import { IHandlerResponseApi } from "../doc/response/api/handler/IHandlerResponseApi";
import { ImperativeError } from "../../../error";
import { IWebHelpTreeNode } from "./doc/IWebHelpTreeNode";

/**
 * Imperative web help generator. Accepts the command definitions and constructs
 * the full help text for the command node.
 *
 * @export
 * @class WebHelpGenerator
 */
export class WebHelpGenerator {
    /**
     * Specifies whether user's home directory should be redacted from help content
     * @memberof WebHelpGenerator
     */
    public sanitizeHomeDir: boolean = false;

    /**
     * Imperative command tree to build help for
     * @private
     * @memberof WebHelpGenerator
     */
    private mFullCommandTree: ICommandDefinition;

    /**
     * Imperative config containing data about the CLI
     * @private
     * @memberof WebHelpGenerator
     */
    private mConfig: ImperativeConfig;

    /**
     * Output directory for HTML doc pages
     * @private
     * @memberof WebHelpGenerator
     */
    private mDocsDir: string;

    /**
     * Markdown-it module used to convert markdown to HTML
     * @private
     * @memberof WebHelpGenerator
     */
    private markdownIt: any;

    /**
     * List of nodes in command tree
     * @private
     * @memberof WebHelpGenerator
     */
    private treeNodes: IWebHelpTreeNode[];

    /**
     * Key value list of commands and their aliases
     * @private
     * @memberof WebHelpGenerator
     */
    private aliasList: { [key: string]: string[] };

    /**
     * Used to build single page version of web help
     * @private
     * @memberof WebHelpGenerator
     */
    private singlePageHtml: string;

    /**
     * Create an instance of WebHelpGenerator.
     * @param {ICommandDefinition} - Imperative command tree to build help for
     * @param {ImperativeConfig} - Imperative config containing data about the CLI
     * @param {string} - Output directory for web help files
     */
    constructor(fullCommandTree: ICommandDefinition, config: ImperativeConfig, webHelpDir: string) {
        this.mFullCommandTree = fullCommandTree;
        this.mConfig = config;
        this.mDocsDir = path.join(webHelpDir, "docs");
        this.treeNodes = [];
        this.aliasList = {};
    }

    /**
     * Build web help files and copy dependencies to output folder
     * @param {IHandlerResponseApi} - Command response object to use for output
     */
    public buildHelp(cmdResponse: IHandlerResponseApi) {
        // Log using buffer to prevent trailing newline from getting added
        // This allows printing dot characters on the same line to show progress
        cmdResponse.console.log(Buffer.from("Generating web help"));

        // Ensure web-help/docs folder exists and is empty
        const fsExtra = require("fs-extra");
        fsExtra.emptyDirSync(this.mDocsDir);
        const webHelpDir: string = path.join(this.mDocsDir, "..");

        // Find web help dist folder
        const distDir: string = path.join(__dirname, "../../../../web-help/dist");
        if (!fs.existsSync(distDir)) {
            throw new ImperativeError({
                msg: `The web-help distribution directory does not exist:\n    "${distDir}"`
            });
        }

        // Copy files from dist folder to .zowe home dir
        const dirsToCopy: string[] = [distDir, path.join(distDir, "css"), path.join(distDir, "js")];
        dirsToCopy.forEach((dir: string) => {
            const destDir = path.join(webHelpDir, path.relative(distDir, dir));

            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir);
            }

            fs.readdirSync(dir)
                .filter((pathname: string) => fs.statSync(path.join(dir, pathname)).isFile())
                .forEach((filename: string) => fsExtra.copySync(path.join(dir, filename), path.join(destDir, filename)));
        });

        // Copy header image if it exists
        if (this.mConfig.loadedConfig.webHelpLogoImgPath) {
            fsExtra.copySync(this.mConfig.loadedConfig.webHelpLogoImgPath, path.join(webHelpDir, "header-image.png"));
        }

        // Replace main.css with custom CSS file if it exists
        if (this.mConfig.loadedConfig.webHelpCustomCssPath) {
            fsExtra.copySync(this.mConfig.loadedConfig.webHelpCustomCssPath, path.join(webHelpDir, "css/main.css"));
        }

        // Sort all items in the command tree and remove duplicates
        const uniqueDefinitions: ICommandDefinition = this.mFullCommandTree;
        uniqueDefinitions.children = uniqueDefinitions.children
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter((a, pos, self) => self.findIndex((b) => a.name === b.name) === pos);

        // Generate HTML help file for the root CLI command
        const rootCommandName: string = this.mConfig.rootCommandName;
        const rootHelpHtmlPath: string = path.join(this.mDocsDir, `${rootCommandName}.html`);
        this.treeNodes.push({ id: `${rootCommandName}.html`, text: rootCommandName });

        let rootHelpContent: string = this.genDocsHeader(rootCommandName);
        rootHelpContent += `<h2><a href="${rootCommandName}.html" name="${rootCommandName}">${rootCommandName}</a>${this.genPrintButton()}</h2>\n`;
        rootHelpContent += this.renderMarkdown(this.mConfig.loadedConfig.rootCommandDescription) + "\n";
        const helpGen = new DefaultHelpGenerator({ produceMarkdown: true, rootCommandName } as any,
            { commandDefinition: uniqueDefinitions, fullCommandTree: uniqueDefinitions, skipTextWrap: true });
        rootHelpContent += this.renderMarkdown(this.buildChildrenSummaryTables(helpGen, rootCommandName) + "\n\n" +
            helpGen.buildGlobalOptionsSection().replace("# Global options", "# Global Options"));
        this.singlePageHtml = rootHelpContent.replace(/<h4>Groups.+?<\/ul>/s, "");
        rootHelpContent += this.genDocsFooter();
        fs.writeFileSync(rootHelpHtmlPath, rootHelpContent);
        cmdResponse.console.log(Buffer.from("."));

        // Generate HTML help files for every CLI command
        uniqueDefinitions.children.forEach((def) => {
            cmdResponse.console.log(Buffer.from("."));
            this.genCommandHelpPage(def, def.name, this.mDocsDir, this.treeNodes[0]);
        });

        // Generate single HTML file for all CLI commands
        this.singlePageHtml += this.genDocsFooter();
        this.singlePageHtml = this.singlePageHtml.replace(new RegExp(`<a href="(${rootCommandName}.*?)\\.html"`, "g"), "<a href=\"#$1\"");
        let cmdTreeHtml: string = "<ul>";
        this.treeNodes[0].children.forEach((node: IWebHelpTreeNode) => {
            cmdTreeHtml += this.buildCmdTreeHtml(node);
        });
        cmdTreeHtml += "</ul>";
        cmdTreeHtml = `<div class="page-break print-only"><h4>Table of Contents</h4>\n${cmdTreeHtml}</div>\n`;
        const insertIndex = this.singlePageHtml.indexOf("<hr ");
        this.singlePageHtml = this.singlePageHtml.slice(0, insertIndex) + cmdTreeHtml + this.singlePageHtml.slice(insertIndex);
        fs.writeFileSync(path.join(this.mDocsDir, "all.html"), this.singlePageHtml);

        this.writeTreeData();
        cmdResponse.console.log("done!");
    }

    /**
     * Converts Markdown string to HTML string. Any HTML tags contained in the
     * input Markdown string will be escaped.
     * @param markdownContent String containing Markdown content
     * @returns String containing HTML content
     */
    private renderMarkdown(markdownContent: string): string {
        if (this.markdownIt == null) {
            this.markdownIt = require("markdown-it")({ breaks: true, linkify: true });
            this.markdownIt.linkify.set({ fuzzyLink: false });  // Only linkify URLs that have a protocol
        }

        return this.markdownIt.render(markdownContent);
    }

    /**
     * Returns header HTML for help page
     * @private
     * @param title - Title string for the page
     */
    private genDocsHeader(title: string): string {
        return `<!DOCTYPE html>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>${title}</title>
<link rel="stylesheet" href="../css/bundle-docs.css">
<link rel="stylesheet" href="../css/docs.css">
<article class="markdown-body">
`;
    }

    /**
     * Returns footer HTML for help page
     * @private
     */
    private genDocsFooter(): string {
        return `</article>
<script src="../js/bundle-docs.js"></script>
<script src="../js/docs.js"></script>
`;
    }

    /**
     * Returns print button to show in header of help page
     * @private
     */
    private genPrintButton(): string {
        return `<button id="btn-print" class="no-print" onclick="window.print();" title="Print">🖨️</button>`;
    }

    /**
     * Builds breadcrumb of HTML links to show command ancestry
     * @private
     * @param {string} rootCommandName
     * @param {string} fullCommandName
     */
    private genBreadcrumb(rootCommandName: string, fullCommandName: string): string {
        const crumbs: string[] = [];
        let hrefPrefix: string = "";
        [rootCommandName, ...fullCommandName.split("_")].forEach((linkText: string) => {
            crumbs.push(`<a href="${hrefPrefix}${linkText}.html">${linkText}</a>`);
            hrefPrefix += `${linkText}_`;
        });
        return crumbs.join(" › ");
    }

    /**
     * Builds list of groups/commands with HTML links added
     * @private
     * @param {DefaultHelpGenerator} helpGen
     * @param {string} fullCommandName
     */
    private buildChildrenSummaryTables(helpGen: DefaultHelpGenerator, fullCommandName: string): string {
        const hrefPrefix = fullCommandName + "_";
        return helpGen.buildChildrenSummaryTables().split(/\r?\n/g)
            .map((line: string) => {
                // Wrap group/command names inside links
                const match = line.match(/^\s{0,4}([a-z0-9-]+(?:\s\|\s[a-z0-9-]+)*)\s+\S/i);
                if (match) {
                    const href = `${hrefPrefix}${match[1].split(" ")[0]}.html`;
                    return `\n* [${match[1]}](${href}) -` + line.slice(match[0].length - 2);
                }
                return (line.startsWith("#### ") ? "\n" : " ") + line.trim();
            }).join("");
    }

    /**
     * Appends help content for individual command/group to single page HTML
     * @private
     * @param {ICommandDefinition} definition
     * @param {string} rootCommandName
     * @param {string} fullCommandName
     * @param {string} htmlContent
     */
    private appendToSinglePageHtml(definition: ICommandDefinition, rootCommandName: string, fullCommandName: string, htmlContent: string) {
        // Add horizontal line/page break at start of a new top level group
        if (fullCommandName.indexOf("_") === -1) {
            this.singlePageHtml += "<hr class=\"no-print\">\n";
            htmlContent = htmlContent.replace(/<h2/, "<h2 class=\"page-break\"");
        }

        // Generate HTML anchor in front of header
        const anchorText = `<a${(definition.type !== "group") ? " class=\"cmd-anchor\"" : ""} name="${rootCommandName}_${fullCommandName}"></a>`;

        if (definition.type === "group") {
            // Remove sections from HTML that would be redundant
            this.singlePageHtml += anchorText + htmlContent.slice(0, htmlContent.indexOf("<h4"));
        } else {
            // Make header smaller for commands
            this.singlePageHtml += anchorText + htmlContent.replace(/<h2/, "<h3").replace(/h2>/, "h3>");
        }
    }

    /**
     * Generates HTML help page for Imperative command
     * @private
     * @param {ICommandDefinition} definition
     * @param {string} fullCommandName
     * @param {string} docsDir
     * @param {ITreeNode} parentNode
     */
    private genCommandHelpPage(definition: ICommandDefinition, fullCommandName: string, docsDir: string, parentNode: IWebHelpTreeNode) {
        const rootCommandName: string = this.treeNodes[0].text;
        const helpGen = new DefaultHelpGenerator({ produceMarkdown: true, rootCommandName } as any,
            { commandDefinition: definition, fullCommandTree: this.mFullCommandTree, skipTextWrap: true });

        let markdownContent = helpGen.buildHelp() + "\n";
        if (definition.type === "group") {
            // this is disabled for the CLIReadme.md but we want to show children here
            // so we'll call the help generator's children summary function even though
            // it's usually skipped when producing markdown
            markdownContent += this.buildChildrenSummaryTables(helpGen, rootCommandName + "_" + fullCommandName);
        }

        let htmlContent = "<h2>" + this.genBreadcrumb(rootCommandName, fullCommandName) + this.genPrintButton() + "</h2>\n";
        htmlContent += this.renderMarkdown(markdownContent);

        // Add Copy buttons after command line examples
        htmlContent = htmlContent.replace(/<code>\$\s*([^<]+)<\/code>/g,
            `<code>$1</code> <button class="btn-copy no-print" data-balloon-pos="right" data-clipboard-text="$1">Copy</button>`);

        // Sanitize references to user's home directory
        if (this.sanitizeHomeDir) {
            const homeDir = path.dirname(this.mConfig.loadedConfig.defaultHome);
            htmlContent = htmlContent.replace(new RegExp(homeDir.replace(/[\\/]/g, "."), "g"),
                homeDir.slice(0, homeDir.lastIndexOf(path.sep) + 1) + "&lt;user&gt;");
        }

        this.appendToSinglePageHtml(definition, rootCommandName, fullCommandName, htmlContent);
        htmlContent = this.genDocsHeader(fullCommandName.replace(/_/g, " ")) + htmlContent + this.genDocsFooter();

        const helpHtmlFile = `${rootCommandName}_${fullCommandName.trim()}.html`;
        const helpHtmlPath = path.join(docsDir, helpHtmlFile);
        fs.writeFileSync(helpHtmlPath, htmlContent);

        // Add command node and list of aliases to tree data
        const childNode: IWebHelpTreeNode = {
            id: helpHtmlFile,
            text: [definition.name, ...definition.aliases].join(" | ")
        };
        parentNode.children = [...(parentNode.children || []), childNode];

        definition.aliases.forEach((alias: string) => {
            if (alias !== definition.name) {
                if (this.aliasList[alias] === undefined) {
                    this.aliasList[alias] = [definition.name];
                } else if (this.aliasList[alias].indexOf(definition.name) === -1) {
                    this.aliasList[alias].push(definition.name);
                }
            }
        });

        // Recursively generate HTML help pages if this group/command has children
        if (definition.children) {
            definition.children.forEach((child: any) => {
                this.genCommandHelpPage(child, `${fullCommandName}_${child.name}`, docsDir, childNode);
            });
        }
    }

    /**
     * Builds table of contents for flat view
     * @private
     * @param node - Parent node whose children will be listed
     * @returns - HTML list of child nodes
     */
    private buildCmdTreeHtml(node: IWebHelpTreeNode): string {
        let cmdTreeHtml = `<li><a href="#${node.id.slice(0, node.id.lastIndexOf("."))}">${node.text}</a>`;
        if (node.children) {
            node.children.forEach((childNode: IWebHelpTreeNode) => {
                cmdTreeHtml += `<ul>${this.buildCmdTreeHtml(childNode)}</ul>`;
            });
        }
        cmdTreeHtml += "</li>\n";
        return cmdTreeHtml;
    }

    /**
     * Writes data for building web help command tree to JS file
     * @private
     */
    private writeTreeData() {
        const treeDataPath = path.join(this.mDocsDir, "..", "tree-data.js");
        fs.writeFileSync(treeDataPath,
            "/* This file is automatically generated, do not edit manually! */\n" +
            `const headerStr = "${this.mConfig.loadedConfig.productDisplayName}";\n` +
            `const footerStr = "${this.mConfig.callerPackageJson.name} ${this.mConfig.callerPackageJson.version}";\n` +
            "const treeNodes = " + JSON.stringify(this.treeNodes) + ";\n" +
            "const aliasList = " + JSON.stringify(this.aliasList) + ";");
    }
}
