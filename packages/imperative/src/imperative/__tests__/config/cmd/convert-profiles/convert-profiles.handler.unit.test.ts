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
    const handler = new ConvertProfilesHandler();

    // pretend that convert worked
    const convertSpy = jest.spyOn(ConvertV1Profiles, "convert").mockResolvedValue(Promise.resolve({
        msgs: [
            { msgFormat: 1, msgText: "Report Msg 1" },
            { msgFormat: 1, msgText: "Report Msg 2" },
            { msgFormat: 2, msgText: "Error Msg 1" },
            { msgFormat: 2, msgText: "Error Msg 2" }
        ],
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
    }));

    it("should report a set of converted profiles and NOT do any prompt", async () => {
        const params = getIHandlerParametersObject();

        await handler.process(params);

        expect(stdout).not.toContain("If you confirm the deletion of V1 profiles, they are deleted from disk");
        expect(stdout).not.toContain("after a successful conversion. Otherwise, they remain but no longer used.");
        expect(stdout).not.toContain("You can also delete your V1 profiles later.");
        expect(stdout).not.toContain("Do you want to delete your V1 profiles now [y/N]:");

        expect(stdout).toContain("Report Msg 1");
        expect(stdout).toContain("Report Msg 2");
        expect(stdout).toContain("Error Msg 1");
        expect(stdout).toContain("Error Msg 2");
        expect(stderr).toBe("");
    });

    it("should prompt for confirmation when delete is requested", async () => {
        const params = getIHandlerParametersObject();
        params.arguments.delete = true;
        params.arguments.prompt = true;

        await handler.process(params);

        expect(stdout).toContain("If you confirm the deletion of V1 profiles, they are deleted from disk");
        expect(stdout).toContain("after a successful conversion. Otherwise, they remain but no longer used.");
        expect(stdout).toContain("You can also delete your V1 profiles later.");
        expect(stdout).toContain("Do you want to delete your V1 profiles now [y/N]:");

        expect(stdout).toContain("Report Msg 1");
        expect(stdout).toContain("Report Msg 2");
        expect(stdout).toContain("Error Msg 1");
        expect(stdout).toContain("Error Msg 2");
        expect(stderr).toBe("");
    });
});
