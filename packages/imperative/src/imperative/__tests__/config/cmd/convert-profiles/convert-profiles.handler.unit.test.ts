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

import { ConvertV1Profiles } from "../../../../../config";
import { IHandlerParameters } from "../../../../../cmd";

import ConvertProfilesHandler from "../../../../src/config/cmd/convert-profiles/convert-profiles.handler";

let stdout: string = "";
let stderr: string = "";

const getIHandlerParametersObject = (): IHandlerParameters => {
    const x: any = {
        response: {
            data: {
                setMessage: jest.fn((setMsgArgs) => {
                    // Nothing
                }),
                setObj: jest.fn((setObjArgs) => {
                    // Nothing
                })
            },
            console: {
                log: jest.fn((logs) => {
                    stdout += logs;
                }),
                error: jest.fn((errors) => {
                    stderr += errors;
                }),
                errorHeader: jest.fn(() => undefined),
                prompt: jest.fn((promptString) => {
                    stdout += promptString;
                    return "y";
                })
            }
        },
        arguments: {},
    };
    return x as IHandlerParameters;
};

describe("Configuration Convert Profiles command handler", () => {
    const convProfHandler = new ConvertProfilesHandler();
    let convertSpy: any;

    const fakeConvertResult = {
        msgs: [
            { msgFormat: 1, msgText: "Report Msg 1" },
            { msgFormat: 1, msgText: "Report Msg 2" },
            { msgFormat: 2, msgText: "Error Msg 1" },
            { msgFormat: 2, msgText: "Error Msg 2" }
        ],
        v1ScsPluginName: null as any,
        reInitCredMgr: false,
        cfgFilePathNm: ConvertV1Profiles["noCfgFilePathNm"],
        numProfilesFound: 0,
        profilesConverted: {
            zosmf: ["zosmfProfNm1", "zosmfProfNm2", "zosmfProfNm3"],
            tso: ["tsoProfNm1", "tsoProfNm2", "tsoProfNm3"],
            ssh: ["sshProfNm1", "sshProfNm2", "sshProfNm3"]
        },
        profilesFailed: [
            { name: "zosmfProfNm4:", type: "zosmf", error: new Error("This profile stinks") },
            { name: "zosmfProfNm5:", type: "zosmf", error: new Error("This profile also stinks") }
        ]
    };

    it("should report a set of converted profiles and NOT do any prompt", async () => {
        // pretend that convert works
        convertSpy = jest.spyOn(ConvertV1Profiles, "convert").mockResolvedValue(Promise.resolve(fakeConvertResult));

        // call the function that we want to test
        const params = getIHandlerParametersObject();
        await convProfHandler.process(params);

        expect(stdout).not.toContain("If you confirm the deletion of V1 profiles, they are deleted from disk");
        expect(stdout).not.toContain("after a successful conversion. Otherwise, they remain but no longer used.");
        expect(stdout).not.toContain("You can also delete your V1 profiles later.");
        expect(stdout).not.toContain("Do you want to delete your V1 profiles now [y/N]:");

        expect(stdout).toContain("Report Msg 1");
        expect(stdout).toContain("Report Msg 2");
        expect(stderr).toContain("Error Msg 1");
        expect(stderr).toContain("Error Msg 2");
    });

    it("should prompt for confirmation and delete profiles when requested", async () => {
        // pretend that convert works
        convertSpy = jest.spyOn(ConvertV1Profiles, "convert").mockResolvedValue(Promise.resolve(fakeConvertResult));

        // call the function that we want to test
        const params = getIHandlerParametersObject();
        params.arguments.delete = true;
        params.arguments.prompt = true;
        await convProfHandler.process(params);

        expect(stdout).toContain("If you confirm the deletion of V1 profiles, they are deleted from disk after");
        expect(stdout).toContain("a successful conversion. Otherwise, they remain but are no longer used.");
        expect(stdout).toContain("You can also delete your V1 profiles later.");
        expect(stdout).toContain("Do you want to delete your V1 profiles now [y/N]:");

        expect(convertSpy).toHaveBeenCalledWith({ deleteV1Profs: true });

        expect(stdout).toContain("Report Msg 1");
        expect(stdout).toContain("Report Msg 2");
        expect(stderr).toContain("Error Msg 1");
        expect(stderr).toContain("Error Msg 2");
    });

    it("should not delete profiles when answer to prompt is to not delete", async () => {
        // pretend that convert works
        convertSpy = jest.spyOn(ConvertV1Profiles, "convert").mockResolvedValue(Promise.resolve(fakeConvertResult));

        // pretend that the user answers no when prompted
        const params = getIHandlerParametersObject();
        params.arguments.delete = true;
        params.arguments.prompt = true;
        params.response.console.prompt = jest.fn((promptString) => {
            stdout += promptString;
            return "n";
        }) as any;

        // call the function that we want to test
        await convProfHandler.process(params);

        expect(stdout).toContain("If you confirm the deletion of V1 profiles, they are deleted from disk after");
        expect(stdout).toContain("a successful conversion. Otherwise, they remain but are no longer used.");
        expect(stdout).toContain("You can also delete your V1 profiles later.");
        expect(stdout).toContain("Do you want to delete your V1 profiles now [y/N]:");

        expect(convertSpy).toHaveBeenCalledWith({ deleteV1Profs: false });

        expect(stdout).toContain("Report Msg 1");
        expect(stdout).toContain("Report Msg 2");
        expect(stderr).toContain("Error Msg 1");
        expect(stderr).toContain("Error Msg 2");
    });

    it("should report any discovered old SCS plugin and uninstall it", async () => {
        // pretend convert reported an SCS plugin
        fakeConvertResult.v1ScsPluginName = "fakeScsPluginName" as any;
        convertSpy = jest.spyOn(ConvertV1Profiles, "convert").mockResolvedValue(Promise.resolve(fakeConvertResult));

        // avoid calling the real plugin uninstall
        const uninstallPlugin = require("../../../../src/plugins/utilities/npm-interface/uninstall");
        const uninstallSpy = jest.spyOn(uninstallPlugin, "uninstall").mockReturnValue(0);

        // call the function that we want to test
        const params = getIHandlerParametersObject();
        await convProfHandler.process(params);

        expect(uninstallSpy).toHaveBeenCalled();
        expect(stdout).toContain("Report Msg 1");
        expect(stdout).toContain("Report Msg 2");
        expect(stdout).toContain('Uninstalled plug-in "fakeScsPluginName"');
        expect(stderr).toContain("Error Msg 1");
        expect(stderr).toContain("Error Msg 2");
    });

    it("should catch an error from uninstalling an old SCS plugin and report it", async () => {
        // pretend convert reported an SCS plugin
        fakeConvertResult.v1ScsPluginName = "fakeScsPluginName" as any;
        convertSpy = jest.spyOn(ConvertV1Profiles, "convert").mockResolvedValue(Promise.resolve(fakeConvertResult));

        // pretend that plugin uninstall crashes
        const fakeUninstallErr = "Plugin uninstall crashed and burned";
        const uninstallPlugin = require("../../../../src/plugins/utilities/npm-interface/uninstall");
        const uninstallSpy = jest.spyOn(uninstallPlugin, "uninstall").mockImplementation(() => {
            throw new Error(fakeUninstallErr);
        });

        // call the function that we want to test
        const params = getIHandlerParametersObject();
        await convProfHandler.process(params);

        expect(uninstallSpy).toHaveBeenCalled();
        expect(stdout).toContain("Report Msg 1");
        expect(stdout).toContain("Report Msg 2");
        expect(stderr).toContain("Error Msg 1");
        expect(stderr).toContain("Error Msg 2");
        expect(stderr).toContain('Failed to uninstall plug-in "fakeScsPluginName"');
        expect(stderr).toContain(fakeUninstallErr);
    });
});
