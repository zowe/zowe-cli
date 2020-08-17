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

import { ProvisioningListMocks } from "../../../../../../../packages/provisioning/__tests__/__resources__/api/ProvisioningListMocks";
import { ListCatalogTemplates } from "../../../../../../provisioning";
import { IHandlerParameters } from "@zowe/imperative";
import * as Handler from "../../../../src/list/catalogTemplates/CatalogTemplates.handler";
import { catalogTemplates } from "../../../../src/list/catalogTemplates/CatalogTemplates.definition";
import { UNIT_TEST_ZOSMF_PROF_OPTS, UNIT_TEST_PROFILES_ZOSMF, getMockedResponse } from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

jest.mock("../../../../src/api/ListCatalogTemplates");

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["provisioning", "list", "catalog-templates"],
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    },
    positionals: ["provisioning", "list", "catalog-templates"],
    response: getMockedResponse(),
    definition: catalogTemplates,
    fullDefinition: catalogTemplates,
    profiles: UNIT_TEST_PROFILES_ZOSMF
};

describe("list catalog templates handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to list catalog", async () => {
        ListCatalogTemplates.listCatalogCommon = jest.fn((session, zOSMFVersion) => {
            return ProvisioningListMocks.LIST_CATALOG_TEMPLATES_RESPONSE;
        });
        const handler = new Handler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        await handler.process(params);
        expect(ListCatalogTemplates.listCatalogCommon).toHaveBeenCalledTimes(1);
    });

});
