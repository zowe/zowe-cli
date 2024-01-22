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

import { IssueSeverity, PluginIssues } from "../../../../../src/imperative/plugins/utilities/PluginIssues";

describe("PluginIssues", () => {

    it("should initialize properly", () => {
        expect(PluginIssues.instance).toBeTruthy();
    });

    describe("test public functions", () => {
        const pluginIssues = PluginIssues.instance;
        const pluginName = "testPlugin";

        beforeEach(() => {
            PluginIssues.instance.removeIssuesForPlugin(pluginName);
        });

        describe("doesPluginHaveError", () => {
            it("should return true when have error", () => {
                pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, "test Error");
                expect(pluginIssues.doesPluginHaveIssueSev(pluginName, [IssueSeverity.CMD_ERROR])).toBeTruthy();
            });

            it("should return false when no error", () => {
                expect(pluginIssues.doesPluginHaveIssueSev(pluginName, [
                    IssueSeverity.CFG_ERROR,
                    IssueSeverity.CMD_ERROR,
                    IssueSeverity.OVER_ERROR
                ])).toBeFalsy();
            });
        });

        describe("getAllIssues", () => {
            it("should return the list of all recorded errors", () => {
                pluginIssues.recordIssue("test1", IssueSeverity.CMD_ERROR, "test1");
                pluginIssues.recordIssue("test2", IssueSeverity.CMD_ERROR, "test2");

                const issues = pluginIssues.getAllIssues();
                expect(Object.prototype.hasOwnProperty.call(issues, "test1")).toBeTruthy();
                expect(Object.prototype.hasOwnProperty.call(issues, "test2")).toBeTruthy();

                pluginIssues.removeIssuesForPlugin("test1");
                pluginIssues.removeIssuesForPlugin("test2");
            });
        });

        describe("getIssueListForPlugin", () => {
            it("should return list of all error for plugin", () => {
                pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, "test1");

                expect(pluginIssues.getIssueListForPlugin(pluginName).length).toBe(1);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueSev).toBe(IssueSeverity.CMD_ERROR);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueText).toBe("test1");

                pluginIssues.recordIssue(pluginName, IssueSeverity.WARNING, "test2");

                expect(pluginIssues.getIssueListForPlugin(pluginName).length).toBe(2);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[1].issueSev).toBe(IssueSeverity.WARNING);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[1].issueText).toBe("test2");
            });
        });

        describe("removeIssuesForPlugin", () => {
            it("should remove error when located", () => {
                pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, "test1");

                expect(pluginIssues.getIssueListForPlugin(pluginName).length).toBe(1);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueSev).toBe(IssueSeverity.CMD_ERROR);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueText).toBe("test1");

                pluginIssues.removeIssuesForPlugin(pluginName);

                expect(pluginIssues.getIssueListForPlugin(pluginName).length).toBe(0);
            });

            it("should not throw error when bad pluginName is provide", () => {
                pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, "test1");

                expect(pluginIssues.getIssueListForPlugin(pluginName).length).toBe(1);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueSev).toBe(IssueSeverity.CMD_ERROR);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueText).toBe("test1");

                pluginIssues.removeIssuesForPlugin("badName");

                expect(pluginIssues.getIssueListForPlugin(pluginName).length).toBe(1);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueSev).toBe(IssueSeverity.CMD_ERROR);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueText).toBe("test1");
            });
        });

        describe("recordIssue", () => {
            it("should record issue properly", () => {
                pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, "test1");

                expect(pluginIssues.getIssueListForPlugin(pluginName).length).toBe(1);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueSev).toBe(IssueSeverity.CMD_ERROR);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueText).toBe("test1");
            });

            it("should record multiple instances of the same issue", () => {
                pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, "test");
                pluginIssues.recordIssue(pluginName, IssueSeverity.CMD_ERROR, "test");

                expect(pluginIssues.getIssueListForPlugin(pluginName).length).toBe(2);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueSev).toBe(IssueSeverity.CMD_ERROR);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[0].issueText).toBe("test");
                expect(pluginIssues.getIssueListForPlugin(pluginName)[1].issueSev).toBe(IssueSeverity.CMD_ERROR);
                expect(pluginIssues.getIssueListForPlugin(pluginName)[1].issueText).toBe("test");
            });
        });
    });
});
