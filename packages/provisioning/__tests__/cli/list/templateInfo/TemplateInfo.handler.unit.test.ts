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

import { ProvisioningListMocks } from "../../../__resources__/api/ProvisioningListMocks";

jest.mock("../../../../src/api/ListTemplateInfo");
import { ListTemplateInfo } from "../../../../../provisioning";
import { IHandlerParameters } from "@brightside/imperative";
import * as Handler from "../../../../src/cli/list/templateInfo/TemplateInfo.handler";
import { templateInfo } from "../../../../src/cli/list/templateInfo/TemplateInfo.definition";
import { UNIT_TEST_ZOSMF_PROF_OPTS, getMockedResponse, UNIT_TEST_PROFILES_ZOSMF } from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["provisioning", "list", "catalog-templates"],
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    },
    response: getMockedResponse(),
    definition: templateInfo,
    fullDefinition: templateInfo,
    profiles: UNIT_TEST_PROFILES_ZOSMF
};

describe("list catalog templates handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to list catalog", async () => {
        ListTemplateInfo.listTemplateCommon = jest.fn((session, zOSMFVersion) => {
            return {};
        });
        const handler = new Handler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        await handler.process(params);
        expect(ListTemplateInfo.listTemplateCommon).toHaveBeenCalledTimes(1);
    });
});
