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

import { ListRegistryInstances, ListInstanceVariables } from "@zowe/provisioning-for-zowe-sdk";

jest.mock("@zowe/provisioning-for-zowe-sdk");
import { IHandlerParameters } from "@zowe/imperative";
import * as Handler from "../../../../../src/provisioning/list/instanceVariables/InstanceVariables.handler";
import { instanceVariables } from "../../../../../src/provisioning/list/instanceVariables/InstanceVariables.definition";
import { ProvisioningListMocks } from "../../../__resources__/ProvisioningListMocks";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["provisioning", "list", "instance-variables"],
    definition: instanceVariables
});

describe("list instance variables handler tests", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    it("should be able to list instance vars", async () => {
        ListRegistryInstances.listFilteredRegistry = jest.fn(
            async (_session, _zOSMFVersion, _instanceId) => {
                return ProvisioningListMocks.LIST_REGISTRY_INSTANCES_RESPONSE;
            }
        );
        ListInstanceVariables.listVariablesCommon = jest.fn(
            async (_session, _zOSMFVersion, _instanceId) => {
                return {} as any;
            }
        );
        const handler = new Handler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        await handler.process(params);
        expect(ListInstanceVariables.listVariablesCommon).toHaveBeenCalledTimes(
            1
        );
    });
});
