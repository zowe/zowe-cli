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

import { ListRegistryInstances } from "@zowe/provisioning-for-zowe-sdk";
import { IHandlerParameters } from "@zowe/imperative";
import * as Handler from "../../../../../src/provisioning/list/registry/RegistryInstances.handler";
import { registryInstances } from "../../../../../src/provisioning/list/registry/RegistryInstances.definition";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

jest.mock("@zowe/provisioning-for-zowe-sdk");

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["provisioning", "list", "catalog-templates"],
    definition: registryInstances
});

describe("list registry instances handler tests", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to list registry", async () => {
        ListRegistryInstances.listFilteredRegistry = jest.fn(
            async (_session, _zOSMFVersion) => {
                return {} as any;
            }
        );
        const handler = new Handler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        await handler.process(params);
        expect(
            ListRegistryInstances.listFilteredRegistry
        ).toHaveBeenCalledTimes(1);
    });
});
