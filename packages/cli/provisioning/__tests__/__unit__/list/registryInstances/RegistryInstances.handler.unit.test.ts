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

import { ListRegistryInstances } from "../../../../../../provisioning";
import {
    CommandProfiles,
    IHandlerParameters,
    IProfile,
} from "@zowe/imperative";
import * as Handler from "../../../../src/list/registry/RegistryInstances.handler";
import { registryInstances } from "../../../../src/list/registry/RegistryInstances.definition";

jest.mock("../../../../src/api/ListCatalogTemplates");

const ZOSMF_PROF_OPTS = {
    host: "somewhere.com",
    port: "43443",
    user: "someone",
    password: "somesecret",
};

const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set("zosmf", [
    {
        name: "zosmf",
        type: "zosmf",
        ...ZOSMF_PROF_OPTS,
    },
]);
const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);

const DEFAULT_PARAMTERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["provisioning", "list", "catalog-templates"],
        ...ZOSMF_PROF_OPTS,
    },
    positionals: ["provisioning", "list", "catalog-templates"],
    response: {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                expect(setMsgArgs).toMatchSnapshot();
            }),
            setObj: jest.fn((setObjArgs) => {
                expect(setObjArgs).toMatchSnapshot();
            }),
            setExitCode: jest.fn(),
        },
        console: {
            log: jest.fn((logs) => {
                expect(logs).toMatchSnapshot();
            }),
            error: jest.fn((errors) => {
                expect(errors).toMatchSnapshot();
            }),
            errorHeader: jest.fn(() => undefined),
        },
        progress: {
            startBar: jest.fn((parms) => undefined),
            endBar: jest.fn(() => undefined),
        },
        format: {
            output: jest.fn((parms) => {
                expect(parms).toMatchSnapshot();
            }),
        },
    },
    definition: registryInstances,
    fullDefinition: registryInstances,
    profiles: PROFILES,
};

describe("list catalog templates handler tests", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should be able to list registry", async () => {
        ListRegistryInstances.listFilteredRegistry = jest.fn(
            (session, zOSMFVersion) => {
                return {};
            }
        );
        const handler = new Handler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMTERS]);
        await handler.process(params);
        expect(
            ListRegistryInstances.listFilteredRegistry
        ).toHaveBeenCalledTimes(1);
    });
});
