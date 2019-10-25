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

import { Copy, IZosFilesResponse, ICopyDatasetOptions } from "../../../../src/api";
import DsHandler from "../../../../src/cli/copy/dsm/Dsm.handler";
import { ZosFilesBaseHandler } from "../../../../src/cli/ZosFilesBase.handler";

const dummySession = {
    user: "dummy",
    password: "dummy",
    hostname: "machine",
    port: 443,
    protocol: "https",
    type: "basic"
};

describe("DsmHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const copyDatasetSpy = jest.spyOn(Copy, "dataSetMember");

    beforeEach(() => {
        copyDatasetSpy.mockClear();
        copyDatasetSpy.mockImplementation(async () => defaultReturn);
    });
    describe("Succes scenarios", () => {
        it("should call Copy.dataSetMember", async () => {
            const handler = new DsHandler();

            expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

            const commandParameters: any = {
                arguments: {
                    fromDataSetName: "ABCD",
                    fromDataSetMemberName: "UVW",
                    toDataSetName: "EFGH",
                    toDataSetMemberName: "XYZ",
                }
            };

            const response = await handler.processWithSession(commandParameters, dummySession as any);

            expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
            expect(copyDatasetSpy).toHaveBeenLastCalledWith(
                dummySession,
                commandParameters.arguments.fromDataSetName,
                commandParameters.arguments.fromDataSetMemberName,
                commandParameters.arguments.toDataSetName,
                commandParameters.arguments.toDataSetMemberName,
                {},
            );
            expect(response).toBe(defaultReturn);
        });

        it("should call Copy.dataSetMember to copy all members", async () => {
            const handler = new DsHandler();

            expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

            const commandParameters: any = {
                arguments: {
                    fromDataSetName: "ABCD",
                    fromDataSetMemberName: "*",
                    toDataSetName: "EFGH",
                    toDataSetMemberName: "",
                }
            };

            const response = await handler.processWithSession(commandParameters, dummySession as any);

            expect(copyDatasetSpy).toHaveBeenCalledTimes(1);
            expect(copyDatasetSpy).toHaveBeenLastCalledWith(
                dummySession,
                commandParameters.arguments.fromDataSetName,
                commandParameters.arguments.fromDataSetMemberName,
                commandParameters.arguments.toDataSetName,
                commandParameters.arguments.toDataSetMemberName,
                {},
            );
            expect(response).toBe(defaultReturn);
        });
        it("should call Copy.dataSetMember with 'replace' set to true", async () => {
            const handler = new DsHandler();

            expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

            const commandParameters: any = {
                arguments: {
                    fromDataSetName: "ABCD",
                    fromDataSetMemberName: "UVW",
                    toDataSetName: "EFGH",
                    toDataSetMemberName: "XYZ",
                    replace: true
                }
            };

            const response = await handler.processWithSession(commandParameters, dummySession as any);

            expect(copyDatasetSpy).toHaveBeenCalledTimes(1);

            const expectedOptions: ICopyDatasetOptions = { replace: true };

            expect(copyDatasetSpy).toHaveBeenLastCalledWith(
                dummySession,
                commandParameters.arguments.fromDataSetName,
                commandParameters.arguments.fromDataSetMemberName,
                commandParameters.arguments.toDataSetName,
                commandParameters.arguments.toDataSetMemberName,
                expectedOptions,
            );
            expect(response).toBe(defaultReturn);
        });
    });
});
