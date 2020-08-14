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

jest.mock("../../../../src/api/ProvisionPublishedTemplate");
import { ProvisioningConstants, ProvisionPublishedTemplate } from "../../../../../provisioning";
import { ProvisionTemplateData } from "../../../__resources__/api/ProvisionTemplateData";
import { IHandlerParameters, ImperativeError } from "@zowe/imperative";
import * as TemplateHandler from "../../../../src/cli/provision/template/Template.handler";
import * as TemplateDefinition from "../../../../src/cli/provision/template/Template.definition";
import { UNIT_TEST_ZOSMF_PROF_OPTS, UNIT_TEST_PROFILES_ZOSMF, getMockedResponse } from "../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["provisioning", "provision", "template"],
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    },
    positionals: ["provisioning", "provision", "template"],
    response: getMockedResponse(),
    definition: TemplateDefinition.TemplateDefinition,
    fullDefinition: TemplateDefinition.TemplateDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
};

describe("provision template handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to provision a template", async () => {
        ProvisionPublishedTemplate.provisionTemplate = jest.fn((session, zOSMFVersion, templateName) => {
            return ProvisionTemplateData.PROVISION_TEMPLATE_RESPONSE;
        });
        const handler = new TemplateHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        params.arguments.zOSMFVersion = ProvisioningConstants.ZOSMF_VERSION;
        params.arguments.templateName = "some_name1";
        await handler.process(params);
        expect(ProvisionPublishedTemplate.provisionTemplate).toHaveBeenCalledTimes(1);
    });

    it("should be able respond with error message", async () => {
        const failMessage = "IYUCM0004E:The resource was not found. The resource type is Template" +
            " and the identifier or name is some_bad_name.";
        let error;
        ProvisionPublishedTemplate.provisionTemplate = jest.fn((session, zOSMFVersion, templateName) => {
            throw new ImperativeError({msg: failMessage});
        });
        const handler = new TemplateHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        params.arguments.templateName = "some_bad_name";
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(ProvisionPublishedTemplate.provisionTemplate).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
