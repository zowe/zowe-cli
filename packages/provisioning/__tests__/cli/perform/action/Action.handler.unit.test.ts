/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { ProvisioningListMocks } from "../../../__resources__/api/ProvisioningListMocks";

jest.mock("../../../../src/api/ProvisionPublishedTemplate");
import { ListRegistryInstances, PerformAction, ProvisioningConstants } from "../../../../../provisioning";
import { CommandProfiles, IHandlerParameters, IProfile } from "@brightside/imperative";
import * as ActionHandler from "../../../../src/cli/perform/action/Action.handler";
import * as ActionDefinition from "../../../../src/cli/perform/action/Action.definition";

const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set(
    "zosmf", [{
        name: "zosmf",
        type: "zosmf",
        host: "somewhere.com",
        port: "43443",
        user: "someone",
        pass: "somesecret"
    }]
);
const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["provisioning", "perform", "action"],
    },
    response: {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                expect(setMsgArgs).toMatchSnapshot();
            }),
            setObj: jest.fn((setObjArgs) => {
                expect(setObjArgs).toMatchSnapshot();
            })
        },
        console: {
            log: jest.fn((logs) => {
                expect(logs).toMatchSnapshot();
            }),
            error: jest.fn((errors) => {
                expect(errors).toMatchSnapshot();
            }),
            errorHeader: jest.fn(() => undefined)
        },
        progress: {
            startBar: jest.fn((parms) => undefined),
            endBar: jest.fn(() => undefined)
        },
        format: {
            output: jest.fn((parms) => {
                expect(parms).toMatchSnapshot();
            })
        }
    },
    definition: ActionDefinition.ActionDefinition,
    fullDefinition: ActionDefinition.ActionDefinition,
    profiles: PROFILES
};

describe("provision template handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to provision template", async () => {
        ListRegistryInstances.listFilteredRegistry = jest.fn((session, zOSMFVersion, instanceId) => {
            return ProvisioningListMocks.LIST_REGISTRY_INSTANCES_RESPONSE;
        });
        PerformAction.doProvisioningActionCommon = jest.fn((session, zOSMFVersion, templateName) => {
            return {};
        });
        const handler = new ActionHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        params.arguments.zOSMFVersion = ProvisioningConstants.ZOSMF_VERSION;
        params.arguments.templateName = "some_name1";
        await handler.process(params);
        expect(PerformAction.doProvisioningActionCommon).toHaveBeenCalledTimes(1);
    });

});
