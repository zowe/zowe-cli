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

jest.mock("../../../../../../../packages/provisioning/src/ProvisionPublishedTemplate");
import { IHandlerParameters } from "@zowe/imperative";
import * as DeleteInstanceHandler from "../../../../../src/provisioning/delete/instance/DeleteInstance.handler";
import * as DeleteInstanceDefinition from "../../../../../src/provisioning/delete/instance/DeleteInstance.definition";
import { ProvisioningListMocks } from "../../../__resources__/ProvisioningListMocks";
import {
    DeleteInstance,
    ListRegistryInstances,
    ProvisioningConstants
} from "@zowe/provisioning-for-zowe-sdk";
import { UNIT_TEST_ZOSMF_PROF_OPTS } from "../../../../../../../__tests__/__src__/TestConstants";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["provisioning", "delete", "instance"],
    definition: DeleteInstanceDefinition.DeleteInstanceDefinition
});

describe("delete deprovisioned instance handler tests", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to delete deprovisioned instance", async () => {
        ListRegistryInstances.listFilteredRegistry = jest.fn(
            async (_session, _zOSMFVersion, _type, _externalName) => {
                return ProvisioningListMocks.LIST_REGISTRY_INSTANCES_RESPONSE;
            }
        );
        DeleteInstance.deleteDeprovisionedInstance = jest.fn(
            async (_session, _zOSMFVersion, _name) => {
                return "";
            }
        );
        const handler = new DeleteInstanceHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments.zOSMFVersion = ProvisioningConstants.ZOSMF_VERSION;
        params.arguments.name = "some_name1";
        await handler.process(params);
        expect(
            ListRegistryInstances.listFilteredRegistry
        ).toHaveBeenCalledTimes(1);
        expect(
            DeleteInstance.deleteDeprovisionedInstance
        ).toHaveBeenCalledTimes(1);
    });
});
