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

import { ListRegistryInstances } from "../../../../index";

jest.mock("../../../../src/api/ListInstanceVariables");
import { ListInstanceVariables } from "../../../../../provisioning";
import { IHandlerParameters } from "@brightside/imperative";
import * as Handler from "../../../../src/cli/list/instanceVariables/InstanceVariables.handler";
import { instanceVariables } from "../../../../src/cli/list/instanceVariables/InstanceVariables.definition";
import { ProvisioningListMocks } from "../../../__resources__/api/ProvisioningListMocks";
import { UNIT_TEST_ZOSMF_PROF_OPTS, getMockedResponse, UNIT_TEST_PROFILES_ZOSMF } from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["provisioning", "list", "instance-variables"],
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    },
    response: getMockedResponse(),
    definition: instanceVariables,
    fullDefinition: instanceVariables,
    profiles: UNIT_TEST_PROFILES_ZOSMF
};

describe("list instance info handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });
    it("should be able to list instance vars", async () => {
        ListRegistryInstances.listFilteredRegistry = jest.fn((session, zOSMFVersion, instanceId) => {
            return ProvisioningListMocks.LIST_REGISTRY_INSTANCES_RESPONSE;
        });
        ListInstanceVariables.listVariablesCommon = jest.fn((session, zOSMFVersion, instanceId) => {
            return {};
        });
        const handler = new Handler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        await handler.process(params);
        expect( ListInstanceVariables.listVariablesCommon ).toHaveBeenCalledTimes(1);
    });

});
