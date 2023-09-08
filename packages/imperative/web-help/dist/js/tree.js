"use strict";
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
// Define global variables
var urlParams = new URLSearchParams(window.location.search);
var currentNodeId;
var currentView = +(urlParams.get("v") === "1");
var searchTimeout = 0;
/**
 * Generate flattened list of tree nodes
 * @param nestedNodes - Node list for command tree
 * @returns Flattened node list
 */
function flattenNodes(nestedNodes) {
    var flattenedNodes = [];
    nestedNodes.forEach(function (node) {
        if (node.children && node.children.length > 0) {
            flattenedNodes.push.apply(flattenedNodes, flattenNodes(node.children));
        }
        else {
            flattenedNodes.push({
                id: node.id,
                text: node.id.slice(0, -5).replace(/_/g, " ")
            });
        }
    });
    return flattenedNodes;
}
/**
 * Find all possible combinations of a search string that exist with different aliases
 * @param searchStr - Search string input by user
 * @returns NUL-delimited list of search strings with all combinations of aliases
 */
function permuteSearchStr(searchStr) {
    var searchWords = searchStr.split(" ");
    var searchWordsList = [searchWords];
    var _loop_1 = function (i) {
        var word = searchWords[i];
        if (aliasList[word] !== undefined) {
            var newSearchWordsList_1 = [];
            searchWordsList.forEach(function (oldSearchWords) {
                aliasList[word].forEach(function (alias) {
                    newSearchWordsList_1.push(__spreadArrays(oldSearchWords.slice(0, i), [alias], oldSearchWords.slice(i + 1)));
                });
            });
            searchWordsList.push.apply(searchWordsList, newSearchWordsList_1);
        }
    };
    for (var i = 0; i < searchWords.length; i++) {
        _loop_1(i);
    }
    return searchWordsList.map(function (words) { return words.join(" "); }).join("\0");
}
/**
 * Update node that docs are displayed for
 * @param newNodeId - Node ID to select
 * @param goto - Whether to load docs page for node
 * @param expand - Whether to expand tree node
 * @param force - Whether to update node even if already selected
 */
function updateCurrentNode(newNodeId, goto, expand, force) {
    if (force === void 0) { force = false; }
    if (!force) {
        if (newNodeId === currentNodeId || !$("#cmd-tree").jstree(true).get_node(newNodeId)) {
            // Ignore if node already selected or does not exist
            return;
        }
    }
    currentNodeId = newNodeId;
    var nodeIdWithoutExt = currentNodeId.slice(0, -5);
    if (goto) {
        // Load docs page for node in iframe
        if (currentView === 0) {
            $("#docs-page").attr("src", "./docs/" + currentNodeId);
        }
        else {
            $("#docs-page").attr("src", "./docs/all.html#" + nodeIdWithoutExt);
        }
    }
    // Update page title
    document.title = nodeIdWithoutExt.replace(/_/g, " ") + " | " + headerStr + " Docs";
    // Select node in command tree
    $("#cmd-tree").jstree(true).deselect_all();
    $("#cmd-tree").jstree(true).select_node(currentNodeId);
    if (expand) {
        // Expand node in command tree
        $("#cmd-tree").jstree(true).open_node(currentNodeId);
    }
    // Scroll node into view if needed
    setTimeout(function () {
        var nodeElem = document.getElementById(currentNodeId);
        if (nodeElem) {
            scrollIntoView(nodeElem, { scrollMode: "if-needed", block: "nearest", inline: "nearest" });
        }
    }, 0);
    // Update URL in address bar to contain node ID
    var baseUrl = window.location.href.replace(window.location.search, "");
    var queryString = "";
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
function onTreeContextMenu(node) {
    if (node.id !== treeNodes[0].id) {
        return {};
    }
    return {
        expandAll: {
            label: "Expand All",
            action: function () {
                $("#cmd-tree").jstree("open_all");
            }
        },
        collapseAll: {
            label: "Collapse All",
            action: function () {
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
function onTreeSearch(permutedSearchStr, node) {
    if (node.parent === "#" && currentView === 0) {
        return false; // Don't match root node
    }
    // Strip off ".html" to get full command name
    var fullCmd = node.id.slice(0, -5).replace(/_/g, " ");
    var searchStrList = permutedSearchStr.split("\0");
    // Do fuzzy search that allows space or no char to be substituted for hyphen
    for (var _i = 0, _a = [fullCmd, fullCmd.replace(/-/g, " "), fullCmd.replace(/-/g, "")]; _i < _a.length; _i++) {
        var haystack = _a[_i];
        for (var _b = 0, searchStrList_1 = searchStrList; _b < searchStrList_1.length; _b++) {
            var needle = searchStrList_1[_b];
            var matchIndex = haystack.lastIndexOf(needle);
            if (matchIndex !== -1) { // A search string was matched
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
    var tempNodeId = currentNodeId;
    if (!tempNodeId) {
        var cmdToLoad = urlParams.get("p");
        tempNodeId = (cmdToLoad != null) ? cmdToLoad + ".html" : treeNodes[0].id;
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
function onTreeSelectionChanged(_, data) {
    // Change src attribute of iframe when item selected
    if (data.selected.length > 0) {
        updateCurrentNode(data.selected[0], true, true);
    }
}
/**
 * Search command tree after text in search box has changed
 * @param noDelay - If true, searches instantly rather than delaying 250 ms
 */
function onSearchTextChanged(noDelay) {
    if (noDelay === void 0) { noDelay = false; }
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    searchTimeout = window.setTimeout(function () {
        var searchStr = ($("#tree-search").val() || "").toString().trim();
        $("#cmd-tree").jstree(true).search(permuteSearchStr(searchStr));
        if (!searchStr) {
            updateCurrentNode(currentNodeId, false, false, true);
        }
    }, noDelay ? 0 : 250);
}
/**
 * Update selected node in command tree after new page loaded in iframe
 * @param e - Event object sent by postMessage
 */
function onDocsPageChanged(e) {
    var tempNodeId = e.data.slice(e.data.lastIndexOf("/") + 1);
    updateCurrentNode(tempNodeId, false, false);
}
/**
 * Load command tree components
 */
function loadTree() {
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
            themes: { icons: false },
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
    $("#tree-search").on("change keyup mouseup paste", function () { return onSearchTextChanged(); });
    window.addEventListener("message", onDocsPageChanged, false);
}
/**
 * Toggle visibility of command tree
 * @param splitter - Split.js object
 */
function toggleTree(splitter) {
    if ($("#panel-left").is(":visible")) {
        $("#panel-left").children().hide();
        $("#panel-left").hide();
        splitter.setSizes([0, 100]);
    }
    else {
        splitter.setSizes([20, 80]);
        $("#panel-left").show();
        $("#panel-left").children().show();
    }
}
/**
 * Change display mode of page
 * @param newMode - 0 = Tree View, 1 = Flat View
 */
function changeView(newMode) {
    if (newMode === currentView) {
        return;
    }
    currentView = newMode;
    $("#tree-view-link").toggleClass("active");
    $("#flat-view-link").toggleClass("active");
    var newNodes = (currentView === 0) ? treeNodes : flattenNodes(treeNodes);
    $("#cmd-tree").jstree(true).settings.core.data = newNodes;
    $("#cmd-tree").jstree(true).refresh(false, true);
}
