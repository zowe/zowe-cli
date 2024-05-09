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
/* eslint-disable max-len */

describe("Imperative Secure Tests", () => {
    require("./imperative.integration.subtest");
    require("./../../packages/imperative/__tests__/src/packages/profiles/__integration__/CliProfileManager.credentials.integration.subtest");
    require("./../../packages/imperative/__tests__/src/packages/imperative/__integration__/PluginManagementFacility.integration.subtest");
    require("./../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/config/init/cli.imperative-test-cli.config.init.integration.subtest");
    require("./../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/config/auto-init/imperative.test.cli.config.auto-init.fruit.integration.subtest");
    require("./../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/config/convert-profiles/cli.imperative-test-cli.config.convert-profiles.integration.subtest");
    require("./../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/config/profiles/cli.imperative-test-cli.config.profiles.integration.subtest");
    require("./../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/config/secure/cli.imperative-test-cli.config.secure.integration.subtest");
    require("./../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/config/set/cli.imperative-test-cli.config.set.integration.subtest");
    require("./../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/profiles/cli.imperative-test-cli.profiles.create.secured-profile.integration.subtest");
    require("./../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/test/cli.imperative-test-cli.test.config-auto-store.integration.subtest");
    require("./../../packages/imperative/__tests__/__integration__/imperative/__tests__/__integration__/cli/test/cli.imperative-test-cli.test.config-override.integration.subtest");
});


