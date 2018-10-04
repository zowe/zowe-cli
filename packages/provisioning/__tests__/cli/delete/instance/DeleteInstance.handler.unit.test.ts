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

jest.mock("../../../../src/api/ProvisionPublishedTemplate");
import { CommandProfiles, IHandlerParameters, IProfile } from "@brightside/imperative";
import * as DeleteInstanceHandler from "../../../../src/cli/delete/instance/DeleteInstance.handler";
import * as DeleteInstanceDefinition from "../../../../src/cli/delete/instance/DeleteInstance.definition";
import { ProvisioningListMocks } from "../../../__resources__/api/ProvisioningListMocks";
import { DeleteInstance, ListRegistryInstances, ProvisioningConstants } from "../../../../../provisioning";

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
        _: ["provisioning", "delete", "instance"],
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
    definition: DeleteInstanceDefinition.DeleteInstanceDefinition,
    fullDefinition: DeleteInstanceDefinition.DeleteInstanceDefinition,
    profiles: PROFILES
};

describe("delete deprovisioned instance handler tests", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to delete deprovisioned instance", async () => {
        ListRegistryInstances.listFilteredRegistry = jest.fn((session, zOSMFVersion, type, externalName) => {
            return ProvisioningListMocks.LIST_REGISTRY_INSTANCES_RESPONSE;
        });
        DeleteInstance.deleteDeprovisionedInstance = jest.fn((session, zOSMFVersion, name) => {
            return "";
        });
        const handler = new DeleteInstanceHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        params.arguments.zOSMFVersion = ProvisioningConstants.ZOSMF_VERSION;
        params.arguments.name = "some_name1";
        await handler.process(params);
        expect(ListRegistryInstances.listFilteredRegistry).toHaveBeenCalledTimes(1);
        expect(DeleteInstance.deleteDeprovisionedInstance).toHaveBeenCalledTimes(1);
    });
});
