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

import { ListRegistryInstances } from "../../../../../../../packages/provisioning/index";

jest.mock("../../../../src/api/ListInstanceInfo");
import { ListInstanceInfo } from "../../../../../../provisioning";
import { CommandProfiles, IHandlerParameters, IProfile } from "@zowe/imperative";
import * as Handler from "../../../../src/list/instanceInfo/InstanceInfo.handler";
import { instanceInfo } from "../../../../src/list/instanceInfo/InstanceInfo.definition";
import { ProvisioningListMocks } from "../../../../../../../packages/provisioning/__tests__/__resources__/api/ProvisioningListMocks";
import { UNIT_TEST_ZOSMF_PROF_OPTS, getMockedResponse, UNIT_TEST_PROFILES_ZOSMF } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["provisioning", "list", "instance-info"],
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    },
    positionals: ["provisioning", "list", "instance-info"],
    response: getMockedResponse(),
    definition: instanceInfo,
    fullDefinition: instanceInfo,
    profiles: UNIT_TEST_PROFILES_ZOSMF
};

describe("list instance info handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });
    it("should be able to list instance info", async () => {
        ListRegistryInstances.listFilteredRegistry = jest.fn((session, zOSMFVersion, instanceId) => {
            return ProvisioningListMocks.LIST_REGISTRY_INSTANCES_RESPONSE;
        });
        ListInstanceInfo.listInstanceCommon = jest.fn((session, zOSMFVersion, instanceId) => {
            return {};
        });
        const handler = new Handler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        await handler.process(params);
        expect( ListInstanceInfo.listInstanceCommon).toHaveBeenCalledTimes(1);
    });

});
