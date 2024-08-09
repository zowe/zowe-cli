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

// These tests require access to the same values on the keyring, therefore they cannot run in parallel
// The test order is important - some tests depend on other tests not running first - do not change it
// All tests that mess with the keyring must go here - the MacOS Keyring is NOT thread safe, and cannot run anything in parallel
/* eslint-disable max-len */

describe("Imperative Secure Tests", () => {
    require("./../../packages/imperative/__tests__/src/packages/imperative/__integration__/ConfigLoading.integration.subtest");
    require("./../../packages/imperative/__tests__/src/packages/imperative/__integration__/PluginManagementFacility.integration.subtest");
    require("../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/cli.imperative-test-cli.integration.subtest");
    require("../../packages/imperative/__tests__/__integration__/cmd/__tests__/integration/cli/auth/Cmd.cli.auth.fruit.integration.subtest");
});
