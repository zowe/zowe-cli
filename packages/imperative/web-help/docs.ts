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

const isInIframe: boolean = window.location !== window.parent.location;
const links: any = Array.from(document.getElementsByTagName("a"));
const sameOrigin: string = window.location.protocol !== "file:" ? window.location.origin : "*";

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
        link.onclick = (e: any) => {
            window.parent.postMessage(e.target.href, sameOrigin);
            return true;
        };
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
const copyButtons = Array.from(document.getElementsByClassName("btn-copy"));
copyButtons.forEach((btn: any) => {
    btn.addEventListener("click", async () => {
        let success = false;
        try {
            const textToCopy = btn.dataset.clipboardText;
            if (textToCopy) {
                await navigator.clipboard.writeText(textToCopy);
                success = true;
            }
        } catch {}
        setTooltip(btn, success ? "Copied!" : "Failed!");
    });
});

/**
 * Find the currently scrolled to command anchor in iframe
 * @returns Element with <a> tag
 */
function findCurrentCmdAnchor() {
    const anchors = Array.from(document.getElementsByClassName("cmd-anchor"));
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
        const cmdName = findCurrentCmdAnchor()?.getAttribute("name");
        if (cmdName != null && cmdName !== currentCmdName) {
            window.parent.postMessage(cmdName + ".html", sameOrigin);
            currentCmdName = cmdName;
        }
    };
}
