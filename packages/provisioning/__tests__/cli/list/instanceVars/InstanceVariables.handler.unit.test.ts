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

import { ListRegistryInstances } from "../../../../index";

jest.mock("../../../../src/api/ListInstanceVariables");
import { ListInstanceVariables } from "../../../../../provisioning";
import { CommandProfiles, IHandlerParameters, IProfile } from "@brightside/imperative";
import * as Handler from "../../../../src/cli/list/instanceVariables/InstanceVariables.handler";
import { instanceVariables } from "../../../../src/cli/list/instanceVariables/InstanceVariables.definition";
import { ProvisioningListMocks } from "../../../__resources__/api/ProvisioningListMocks";

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
        _: ["provisioning", "list", "instance-variables"],
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
    definition: instanceVariables,
    fullDefinition: instanceVariables,
    profiles: PROFILES
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
