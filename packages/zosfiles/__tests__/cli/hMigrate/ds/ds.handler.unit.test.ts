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

import { IZosFilesResponse, HMigrate } from "../../../../src/api";
import DSHandler from "../../../../src/cli/hMigrate/ds/Ds.handler";
import { ZosFilesBaseHandler } from "../../../../src/cli/ZosFilesBase.handler";
import { IMigrateOptions } from "../../../../src/api/methods/hMigrate/doc/IMigrateOptions";

describe("DsHandler", () => {
    const defaultReturn: IZosFilesResponse = {
        success        : true,
        commandResponse: "THIS IS A TEST"
    };

    const migrateDataSetSpy = jest.spyOn(HMigrate, "dataSet");

    beforeEach(() => {
        migrateDataSetSpy.mockClear();
        migrateDataSetSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call HMigrate.dataSet", async () => {
        const handler = new DSHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);

        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD",
            }
        };

        const dummySession = {
            user: "dummy",
            password: "dummy",
            hostname: "machine",
            port: 443,
            protocol: "https",
            type: "basic"
        };

        const response = await handler.processWithSession(commandParameters, dummySession as any, {});

        expect(migrateDataSetSpy).toHaveBeenCalledTimes(1);
        expect(migrateDataSetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            {},
        );
        expect(response).toBe(defaultReturn);
    });
    it("should call HMigrate.dataSet with wait = true", async () => {
        const handler = new DSHandler();

        expect(handler).toBeInstanceOf(ZosFilesBaseHandler);
        const options: IMigrateOptions = { wait : true }

        const commandParameters: any = {
            arguments: {
                dataSetName: "ABCD",
            },
            options,
        };

        const dummySession = {
            user: "dummy",
            password: "dummy",
            hostname: "machine",
            port: 443,
            protocol: "https",
            type: "basic"
        };

        const expectedOptions: IMigrateOptions = { wait : true };

        const response = await handler.processWithSession(commandParameters, dummySession as any, { wait: true });

        expect(migrateDataSetSpy).toHaveBeenCalledTimes(1);
        expect(migrateDataSetSpy).toHaveBeenLastCalledWith(
            dummySession,
            commandParameters.arguments.dataSetName,
            expectedOptions
        );
        expect(response).toBe(defaultReturn);
    });
});
