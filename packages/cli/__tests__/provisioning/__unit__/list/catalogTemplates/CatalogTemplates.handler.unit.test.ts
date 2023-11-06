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

import { ProvisioningListMocks } from "../../../__resources__/ProvisioningListMocks";
import { ListCatalogTemplates } from "@zowe/provisioning-for-zowe-sdk";
import { IHandlerParameters } from "@zowe/core-for-zowe-sdk";
import * as Handler from "../../../../../src/provisioning/list/catalogTemplates/CatalogTemplates.handler";
import { catalogTemplates } from "../../../../../src/provisioning/list/catalogTemplates/CatalogTemplates.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

jest.mock("../../../../../../../packages/provisioning/src/ListCatalogTemplates");

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["provisioning", "list", "catalog-templates"],
    definition: catalogTemplates,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("list catalog templates handler tests", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to list catalog", async () => {
        ListCatalogTemplates.listCatalogCommon = jest.fn(
            async (session, zOSMFVersion) => {
                return ProvisioningListMocks.LIST_CATALOG_TEMPLATES_RESPONSE;
            }
        );
        const handler = new Handler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        await handler.process(params);
        expect(ListCatalogTemplates.listCatalogCommon).toHaveBeenCalledTimes(1);
    });
});
