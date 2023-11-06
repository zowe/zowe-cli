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

jest.mock("@zowe/provisioning-for-zowe-sdk");
import { ListTemplateInfo } from "@zowe/provisioning-for-zowe-sdk";
import { IHandlerParameters } from "@zowe/core-for-zowe-sdk";
import * as Handler from "../../../../../src/provisioning/list/templateInfo/TemplateInfo.handler";
import { templateInfo } from "../../../../../src/provisioning/list/templateInfo/TemplateInfo.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";
import { mockHandlerParameters } from "@zowe/cli-test-utils";

const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
    arguments: UNIT_TEST_ZOSMF_PROF_OPTS,
    positionals: ["provisioning", "list", "catalog-templates"],
    definition: templateInfo,
    profiles: UNIT_TEST_PROFILES_ZOSMF
});

describe("list template info handler tests", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to list catalog", async () => {
        ListTemplateInfo.listTemplateCommon = jest.fn(
            async () => {
                return {} as any;
            }
        );
        const handler = new Handler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        await handler.process(params);
        expect(ListTemplateInfo.listTemplateCommon).toHaveBeenCalledTimes(1);
    });
});
