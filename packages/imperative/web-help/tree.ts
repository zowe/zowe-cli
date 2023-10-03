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

declare const scrollIntoView: any;

// Recursive object used for command tree node
interface ITreeNode {
    id: string;
    text: string;
    children?: ITreeNode[];
}

// Declare variables loaded from tree-data.js
declare const headerStr: string;
declare const footerStr: string;
declare const treeNodes: ITreeNode[];
declare const aliasList: { [key: string]: string[] };

// Define global variables
const urlParams = new URLSearchParams(window.location.search);
let currentNodeId: string;
let currentView: number = +(urlParams.get("v") === "1");
let searchTimeout: number = 0;

/**
 * Generate flattened list of tree nodes
 * @param nestedNodes - Node list for command tree
 * @returns Flattened node list
 */
function flattenNodes(nestedNodes: ITreeNode[]): ITreeNode[] {
    const flattenedNodes: ITreeNode[] = [];
    nestedNodes.forEach((node: ITreeNode) => {
        if (node.children && node.children.length > 0) {
            flattenedNodes.push(...flattenNodes(node.children));
        } else {
            const fiveFromEnd = -5;
            flattenedNodes.push({
                id: node.id,
                text: node.id.slice(0, fiveFromEnd).replace(/_/g, " ")
            });
        }
    });
    return flattenedNodes;
}

/**
 * Get the preferred theme name for JSTree (light or dark).
 * @returns Theme name
 */
function getJstreeThemeName(): string {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "default-dark";
    }
    return "default";
}

/**
 * Find all possible combinations of a search string that exist with different aliases
 * @param searchStr - Search string input by user
 * @returns NUL-delimited list of search strings with all combinations of aliases
 */
function permuteSearchStr(searchStr: string): string {
    const searchWords: string[] = searchStr.split(" ");
    const searchWordsList: string[][] = [searchWords];

    for (let i = 0; i < searchWords.length; i++) {
        const word = searchWords[i];

        if (aliasList[word] !== undefined) {
            const newSearchWordsList: string[][] = [];
            searchWordsList.forEach((oldSearchWords: string[]) => {
                aliasList[word].forEach((alias: string) => {
                    newSearchWordsList.push([...oldSearchWords.slice(0, i), alias, ...oldSearchWords.slice(i + 1)]);
                });
            });
            searchWordsList.push(...newSearchWordsList);
        }
    }

    return searchWordsList.map((words: string[]) => words.join(" ")).join("\0");
}

/**
 * Update node that docs are displayed for
 * @param newNodeId - Node ID to select
 * @param goto - Whether to load docs page for node
 * @param expand - Whether to expand tree node
 * @param force - Whether to update node even if already selected
 */
function updateCurrentNode(newNodeId: string, goto: boolean, expand: boolean, force: boolean = false) {
    if (!force) {
        if (newNodeId === currentNodeId || !$("#cmd-tree").jstree(true).get_node(newNodeId)) {
            // Ignore if node already selected or does not exist
            return;
        }
    }
    currentNodeId = newNodeId;
    const fiveFromEnd = -5;
    const nodeIdWithoutExt: string = currentNodeId.slice(0, fiveFromEnd);

    if (goto) {
        // Load docs page for node in iframe
        if (currentView === 0) {
            $("#docs-page").attr("src", `./docs/${currentNodeId}`);
        } else {
            $("#docs-page").attr("src", `./docs/all.html#${nodeIdWithoutExt}`);
        }
    }

    // Update page title
    document.title = `${nodeIdWithoutExt.replace(/_/g, " ")} | ${headerStr} Docs`;

    // Select node in command tree
    $("#cmd-tree").jstree(true).deselect_all();
    $("#cmd-tree").jstree(true).select_node(currentNodeId);

    if (expand) {
        // Expand node in command tree
        $("#cmd-tree").jstree(true).open_node(currentNodeId);
    }

    // Scroll node into view if needed
    setTimeout(() => {
        const nodeElem = document.getElementById(currentNodeId);
        if (nodeElem) {
            scrollIntoView(nodeElem, {scrollMode: "if-needed", block: "nearest", inline: "nearest"});
        }
    }, 0);

    // Update URL in address bar to contain node ID
    const baseUrl: string = window.location.href.replace(window.location.search, "");
    let queryString: string = "";
    if (currentNodeId !== treeNodes[0].id) {
        queryString = "?p=" + nodeIdWithoutExt;
    }
    if (currentView === 1) {
        queryString = (queryString.length > 0) ? (queryString + "&v=1") : "?v=1";
    }
    window.history.replaceState(null, "", baseUrl + queryString);
}

/**
 * Generate list of context menu items for a node
 * @param node - Node that was right clicked
 * @return List of context menu items containing labels and actions
 */
function onTreeContextMenu(node: ITreeNode) {
    if (node.id !== treeNodes[0].id) {
        return {};
    }

    return {
        expandAll: {
            label: "Expand All",
            action: () => {
                $("#cmd-tree").jstree("open_all");
            }
        },
        collapseAll: {
            label: "Collapse All",
            action: () => {
                $("#cmd-tree").jstree("close_all");
                $("#cmd-tree").jstree(true).toggle_node(treeNodes[0].id);
            }
        }
    };
}

/**
 * Check if node is matched by a search string
 * @param permutedSearchStr - NUL-delimited list of search strings
 * @param node
 * @returns True if the node matches
 */
function onTreeSearch(permutedSearchStr: string, node: any): boolean {
    if (node.parent === "#" && currentView === 0) {
        return false;  // Don't match root node
    }

    // Strip off ".html" to get full command name
    const fiveFromEnd = -5;
    const fullCmd: string = node.id.slice(0, fiveFromEnd).replace(/_/g, " ");
    const searchStrList = permutedSearchStr.split("\0");

    // Do fuzzy search that allows space or no char to be substituted for hyphen
    for (const haystack of [fullCmd, fullCmd.replace(/-/g, " "), fullCmd.replace(/-/g, "")]) {
        for (const needle of searchStrList) {
            const matchIndex: number = haystack.lastIndexOf(needle);
            if (matchIndex !== -1) {  // A search string was matched
                if (currentView === 1 || haystack.indexOf(" ", matchIndex + needle.length) === -1) {
                    // Don't match node if text that matches is only in label of parent node
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Update current node and search bar after command tree (re)loaded
 */
function onTreeLoaded() {
    let tempNodeId: string = currentNodeId;
    if (!tempNodeId) {
        const cmdToLoad = urlParams.get("p");
        tempNodeId = (cmdToLoad != null) ? `${cmdToLoad}.html` : treeNodes[0].id;
    }
    updateCurrentNode(tempNodeId, true, true, true);

    if ($("#tree-search").val()) {
        onSearchTextChanged(true);
    }
}

/**
 * Update current node after new node selected in tree
 * @param _
 * @param data - jsTree event data
 */
function onTreeSelectionChanged(_: any, data: any) {
    // Change src attribute of iframe when item selected
    if (data.selected.length > 0) {
        updateCurrentNode(data.selected[0], true, true);
    }
}

/**
 * Search command tree after text in search box has changed
 * @param noDelay - If true, searches instantly rather than delaying 250 ms
 */
function onSearchTextChanged(noDelay: boolean = false) {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    const defaultDelay250 = 250;
    searchTimeout = window.setTimeout(() => {
        const searchStr = ($("#tree-search").val() || "").toString().trim();
        $("#cmd-tree").jstree(true).search(permuteSearchStr(searchStr));

        if (!searchStr) {
            updateCurrentNode(currentNodeId, false, false, true);
        }
    }, noDelay ? 0 : defaultDelay250);
}

/**
 * Update selected node in command tree after new page loaded in iframe
 * @param e - Event object sent by postMessage
 */
function onDocsPageChanged(e: any) {
    const tempNodeId = e.data.slice(e.data.lastIndexOf("/") + 1);
    updateCurrentNode(tempNodeId, false, false);
}

/**
 * Load command tree components
 */
/* eslint-disable unused-imports/no-unused-vars */
function loadTree() {
    /* eslint-enable */
    // Set header and footer strings
    $("#header-text").text(headerStr);
    $("#footer").text(footerStr);

    // Change active tab if not loading default view
    if (currentView === 1) {
        $("#tree-view-link").toggleClass("active");
        $("#flat-view-link").toggleClass("active");
    }

    // Load jsTree
    $("#cmd-tree").jstree({
        core: {
            animation: 0,
            multiple: false,
            themes: { name: getJstreeThemeName(), icons: false },
            data: (currentView === 0) ? treeNodes : flattenNodes(treeNodes)
        },
        plugins: ["contextmenu", "search", "wholerow"],
        contextmenu: {
            items: onTreeContextMenu
        },
        search: {
            show_only_matches: true,
            show_only_matches_children: true,
            search_callback: onTreeSearch
        }
    })
        .on("ready.jstree refresh.jstree", onTreeLoaded)
        .on("changed.jstree", onTreeSelectionChanged);

    // Connect events to search box and iframe
    $("#tree-search").on("change keyup mouseup paste", () => onSearchTextChanged());
    window.addEventListener("message", onDocsPageChanged, false);
    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", () => $("#cmd-tree").jstree(true).set_theme(getJstreeThemeName()));
    }
}

/**
 * Toggle visibility of command tree
 * @param splitter - Split.js object
 */
/* eslint-disable unused-imports/no-unused-vars */
function toggleTree(splitter: any) {
    /* eslint-enable */
    if ($("#panel-left").is(":visible")) {
        $("#panel-left").children().hide();
        $("#panel-left").hide();
        const splitterWidth = 0;
        const splitterHeight = 100;
        splitter.setSizes([splitterWidth, splitterHeight]);
    } else {
        const splitterWidth = 20;
        const splitterHeight = 80;
        splitter.setSizes([splitterWidth, splitterHeight]);
        $("#panel-left").show();
        $("#panel-left").children().show();
    }
}

/**
 * Change display mode of page
 * @param newMode - 0 = Tree View, 1 = Flat View
 */
/* eslint-disable unused-imports/no-unused-vars */
function changeView(newMode: number) {
    /* eslint-enable */
    if (newMode === currentView) {
        return;
    }
    currentView = newMode;
    $("#tree-view-link").toggleClass("active");
    $("#flat-view-link").toggleClass("active");
    const newNodes = (currentView === 0) ? treeNodes : flattenNodes(treeNodes);
    ($("#cmd-tree").jstree(true) as any).settings.core.data = newNodes;
    $("#cmd-tree").jstree(true).refresh(false, true);
}
