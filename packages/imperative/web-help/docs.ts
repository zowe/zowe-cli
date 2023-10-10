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

declare const ClipboardJS: any;

// Array.from polyfill for IE11 support
function arrayFrom(items: any): any[] {
    if (typeof Array.from === "function") {
        return Array.from(items);
    }
    const tempArray = [];
    for (let i = 0; i < items.length; i++) {
        tempArray.push(items[i]);
    }
    return tempArray;
}

const isInIframe: boolean = window.location !== window.parent.location;
const links: any = arrayFrom(document.getElementsByTagName("a"));

// Process all <a> tags on page
links.forEach((link: any) => {
    const url = link.getAttribute("href");
    if (!url) {
        // Ignore links with no href
    } else if (url.indexOf("://") > 0 || url.indexOf("//") === 0) {
        // If link is absolute, assume it points to external site and open it in new tab
        link.setAttribute("target", "_blank");
    } else if (isInIframe) {
        // If link is relative and page is inside an iframe, then send signal to command tree when link is clicked to make it update selected node
        link.setAttribute("onclick", "window.parent.postMessage(this.href, '*'); return true;");
    }
});

// Show Print button if inside iframe
if (isInIframe) {
    const printBtn = document.getElementById("btn-print");
    if (printBtn) {
        printBtn.style.display = "block";
    }
}

/**
 * Show tooltip next to copy button that times out after 1 sec
 * @param btn - Button element the tooltip will show next to
 * @param message - Message to show in the tooltip
 */
function setTooltip(btn: any, message: string) {
    const oneSecAsMillis = 1000;
    btn.setAttribute("aria-label", message);
    btn.setAttribute("data-balloon-visible", "");
    setTimeout(() => {
        btn.removeAttribute("aria-label");
        btn.removeAttribute("data-balloon-visible");
    }, oneSecAsMillis);
}

// Enable clipboard access for copy buttons
const clipboard = new ClipboardJS(".btn-copy");
clipboard.on("success", (e: any) => setTooltip(e.trigger, "Copied!"));
clipboard.on("error", (e: any) => setTooltip(e.trigger, "Failed!"));

/**
 * Find the currently scrolled to command anchor in iframe
 * @returns Element with <a> tag
 */
function findCurrentCmdAnchor() {
    const anchors = arrayFrom(document.getElementsByClassName("cmd-anchor"));
    let lastAnchor: any;
    for (const anchor of anchors) {
        const headerBounds = (anchor.nextElementSibling as any).getBoundingClientRect();
        if (headerBounds.top > window.innerHeight) {
            break;
        }
        lastAnchor = anchor;
    }
    return lastAnchor;
}

// If in flat view, select currently scrolled to command in tree
if (isInIframe && window.location.href.indexOf("/all.html") !== -1) {
    let currentCmdName: string;
    window.onscroll = (_: any) => {
        const cmdName = findCurrentCmdAnchor().getAttribute("name");
        if (cmdName != null && cmdName !== currentCmdName) {
            window.parent.postMessage(cmdName + ".html", window.location.origin);
            currentCmdName = cmdName;
        }
    };
}
