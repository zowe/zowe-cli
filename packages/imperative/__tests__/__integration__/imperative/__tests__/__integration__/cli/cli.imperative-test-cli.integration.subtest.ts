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

describe("Imperative Test CLI Secure Tests", () => {
    // require("./auth/imperative.test.cli.auth.login.fruit.integration.subtest");
    // require("./auth/imperative.test.cli.auth.logout.fruit.integration.subtest");

    require("./config/auto-init/imperative.test.cli.config.auto-init.fruit.integration.subtest");
    require("./config/convert-profiles/cli.imperative-test-cli.config.convert-profiles.integration.subtest");
    require("./config/edit/cli.imperative-test-cli.config.edit.integration.subtest");
    require("./config/import/cli.imperative-test-cli.config.import.integration.subtest");
    require("./config/init/cli.imperative-test-cli.config.init.integration.subtest");
    require("./config/list/cli.imperative-test-cli.config.list.integration.subtest");
    require("./config/profiles/cli.imperative-test-cli.config.profiles.integration.subtest");
    require("./config/secure/cli.imperative-test-cli.config.secure.integration.subtest");
    require("./config/set/cli.imperative-test-cli.config.set.integration.subtest");
    require("./test/cli.imperative-test-cli.test.config-auto-store.integration.subtest");
    require("./test/cli.imperative-test-cli.test.config-override.integration.subtest");
});
