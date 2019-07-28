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

import { ImperativeError, TextUtils } from "@zowe/imperative";
import { Create, CreateDataSetTypeEnum, ZosFilesConstants, CreateDefaults, Invoke, ICreateVsamOptions } from "../../../../";
import { ZosmfRestClient } from "../../../../../rest/";
import { ZosFilesMessages } from "../../../../src/api/constants/ZosFiles.messages";

describe("Create data set", () => {
    const dummySession: any = {};
    const dataSetName = "testing";
    const dsOptions: any = {alcunit: "CYL"};
    const endpoint = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_DS_FILES + "/" + dataSetName;

    let mySpy: any;

    beforeEach(() => {
        mySpy = jest.spyOn(ZosmfRestClient, "postExpectString").mockReturnValue("");
    });

    afterEach(() => {
        mySpy.mockReset();
        mySpy.mockRestore();
    });

    describe("Success scenarios", () => {
        it("should be able to create a partitioned data set (PDS)", async () => {
            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({...CreateDefaults.DATA_SET.PARTITIONED, ...dsOptions}));
        });

        it("should be able to create an extended partitioned data set (PDSE) - test with LIBRARY", async () => {

            dsOptions.dsntype = "LIBRARY";

            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({...CreateDefaults.DATA_SET.PARTITIONED, ...dsOptions}));
            dsOptions.dsntype = undefined;
        });

        it("should be able to create an extended partitioned data set (PDSE) - test with PDS", async () => {

            dsOptions.dsntype = "PDS";

            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({...CreateDefaults.DATA_SET.PARTITIONED, ...dsOptions}));
            dsOptions.dsntype = undefined;
        });

        it("explicit testing of dsntype", async () => {
            let success: boolean = false;
            const dsntypes = ["BASIC", "EXTPREF", "EXTREQ", "HFS", "LARGE", "PDS", "LIBRARY", "PIPE"];
            for (const type of dsntypes) {
                dsOptions.dsntype = type;
                try {
                    await Create.dataSetValidateOptions(dsOptions);
                } catch (err) {
                    expect(success).toBe(true);
                }
            }
            try {
                dsOptions.dsntype = "PDSE";
                await Create.dataSetValidateOptions(dsOptions);
            } catch (err) {
                success = true;
            }
            expect(success).toBe(true);
        });

        it("should be able to create a sequential data set (PS)", async () => {

            dsOptions.dsntype = "PDS";

            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_SEQUENTIAL, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({...CreateDefaults.DATA_SET.SEQUENTIAL, ...dsOptions}));
        });

        it("should be able to create a classic data set", async () => {
            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_CLASSIC, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({...CreateDefaults.DATA_SET.CLASSIC, ...dsOptions}));
        });

        it("should be able to create a classic data set and override multiple options", async () => {
            const dsClassicOptions: any = {
                dsorg: "PO",
                size: "3TRK",
                secondary: 2,
                recfm: "VB",
                blksize: 4096,
                lrecl: 4096,
                dirblk: 5
            };

            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_BINARY, dataSetName, dsClassicOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({
                ...CreateDefaults.DATA_SET.BINARY,
                ...dsClassicOptions,
                ...{
                    size: undefined,
                    primary: 3,
                    alcunit: "TRK"
                }
            }));
        });

        it("should be able to create a C data set", async () => {
            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_C, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({...CreateDefaults.DATA_SET.C, ...dsOptions}));
        });

        it("should be able to create a C data set and override multiple options", async () => {
            const dsCOptions: any = {
                dsorg: "PO",
                size: "TRK",
                secondary: 2,
                recfm: "VB",
                blksize: 4096,
                lrecl: 4096,
                dirblk: 5
            };

            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_BINARY, dataSetName, dsCOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({
                ...CreateDefaults.DATA_SET.BINARY,
                ...dsCOptions,
                ...{
                    size: undefined,
                    alcunit: "TRK"
                }
            }));
        });

        it("should be able to create a binary data set", async () => {
            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_BINARY, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({...CreateDefaults.DATA_SET.BINARY, ...dsOptions}));
        });

        it("should be able to create a binary data set and override multiple options. Secondary will be set to 10% (rounded up)", async () => {
            const dsBinaryOptions: any = {
                dsorg: "PO",
                size: "55",
                recfm: "U",
                blksize: 1000,
                lrecl: 1000,
                dirblk: 5
            };

            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_BINARY, dataSetName, dsBinaryOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({
                ...CreateDefaults.DATA_SET.BINARY,
                ...dsBinaryOptions,
                ...{
                    size: undefined,
                    primary: 55,
                    secondary: 6
                }
            }));
        });

        it("should be able to create a binary data set and override multiple options. Secondary will be set to 10% (rounded down)", async () => {
            const dsBinaryOptions: any = {
                dsorg: "PO",
                size: "54",
                recfm: "U",
                blksize: 1000,
                lrecl: 1000,
                dirblk: 5
            };

            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_BINARY, dataSetName, dsBinaryOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({
                ...CreateDefaults.DATA_SET.BINARY,
                ...dsBinaryOptions,
                ...{
                    size: undefined,
                    primary: 54,
                    secondary: 5
                }
            }));
        });

        it("should be able to create a partinioned data set without specifying an options object", async () => {
            const response = await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSetName);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify(CreateDefaults.DATA_SET.PARTITIONED));
        });

        it("should be able to create a partinioned data set without printing the attributes", async () => {
            const response = await Create.dataSet(
                dummySession,
                CreateDataSetTypeEnum.DATA_SET_PARTITIONED,
                dataSetName,
                {
                    showAttributes: false
                } as any
            );

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(response.commandResponse).not.toMatch(/alcunit.*CYL/);
            expect(response.commandResponse).not.toMatch(/dsorg.*PO/);
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify(CreateDefaults.DATA_SET.PARTITIONED));
        });

        it("should be able to create a partinioned data set and print all the attributes", async () => {
            const response = await Create.dataSet(
                dummySession,
                CreateDataSetTypeEnum.DATA_SET_PARTITIONED,
                dataSetName,
                {
                    showAttributes: true
                } as any
            );

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(response.commandResponse).toMatch(/alcunit.*CYL/);
            expect(response.commandResponse).toMatch(/dsorg.*PO/);
            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify(CreateDefaults.DATA_SET.PARTITIONED));
        });
    });

    describe("Expected failures", () => {
        it("should fail if the zOSMF REST client fails", async () => {
            const errorMsg = "Dummy error message";
            mySpy.mockImplementation(() => {
                throw new ImperativeError({msg: errorMsg});
            });

            let error;
            try {
                await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(mySpy).toHaveBeenCalledWith(dummySession, endpoint, [], JSON.stringify({...CreateDefaults.DATA_SET.PARTITIONED, ...dsOptions}));
            expect(error).toContain(errorMsg);
        });

        it("should fail if passed an unexpected command type", async () => {
            let error;
            try {
                await Create.dataSet(dummySession, -1, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toMatch(/.*Unsupported.*data.*set.*type.*/);
            expect(mySpy).not.toHaveBeenCalled();
        });

        it("should fail if missing data set type", async () => {
            let error;
            try {
                await Create.dataSet(dummySession, undefined, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toMatch(/.*Specify.*the.*data.*set.*type.*/);
            expect(mySpy).not.toHaveBeenCalled();
        });

        it("should fail if missing data set name", async () => {
            let error;
            try {
                await Create.dataSet(dummySession, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, undefined, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toMatch(/.*Specify.*the.*data.*set.*name.*/);
            expect(mySpy).not.toHaveBeenCalled();
        });
    });
});

describe("Create data set  Validator", () => {
    describe("Success scenarios", () => {

        it("alcunit should default to 'TRK' if not specified", async () => {
            const testOptioins: any = {
                alcunit: undefined,
            };

            Create.dataSetValidateOptions(testOptioins);

            expect(testOptioins.alcunit).toEqual("TRK");  // Should be changed during create validation to zOSMF default of "TRK"
        });

        it("blksize should default to lrecl if not specified", async () => {
            const testOptioins: any = {
                blksize: undefined,
                lrecl: 160
            };

            Create.dataSetValidateOptions(testOptioins);

            expect(testOptioins.blksize).toEqual(testOptioins.blksize);  // Should be changed during create validation to zOSMF default of lrecl value
        });

        it("secondary should default to 0 if not specified", async () => {
            const testOptioins: any = {
                secondary: undefined,
            };

            Create.dataSetValidateOptions(testOptioins);

            expect(testOptioins.secondary).toEqual(0);  // Should be changed during create validation to zOSMF default of 0
        });

        it("recfm should default to 'F' if not specified", async () => {
            const testOptioins: any = {
                recfm: undefined,
            };

            Create.dataSetValidateOptions(testOptioins);

            expect(testOptioins.recfm).toEqual("F");  // Should be changed during create validation to zOSMF default of 'F'
        });
    });

    describe("Expected failures", () => {

        it("should fail when alcunit specified with invalid value", async () => {
            let error;
            try {

                const testOptions: any = {alcunit: "CYLTRK"};
                Create.dataSetValidateOptions(testOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(`Invalid zos-files create command 'alcunit' option`);
        });

        it("should fail when dsntype specified with invalid value", async () => {
            let error;
            try {

                const testOptions: any = {dsntype: "NOTLIBRARY"};
                Create.dataSetValidateOptions(testOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(`Invalid zos-files create command 'dsntype' option`);
        });

        it("should fail when lrecl not specified", async () => {
            let error;
            try {

                const testOptions: any = {lrecl: undefined};
                Create.dataSetValidateOptions(testOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(`Specify the record length (lrecl)`);
        });

        it("should fail when dsorg is PS and dirblk is non-zero", async () => {
            let error;
            try {

                const testOptions: any = {dsorg: "PS", dirblk: 10};
                Create.dataSetValidateOptions(testOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(`'PS' data set organization (dsorg) specified and the directory blocks (dirblk) is not zero`);
        });

        it("should fail when dsorg is PO and dirblk is 0", async () => {
            let error;
            try {

                const testOptions: any = {dsorg: "PO", dirblk: 0};
                Create.dataSetValidateOptions(testOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(`'PO' data set organization (dsorg) specified and the directory blocks (dirblk) is zero`);
        });

        it("should fail when primary value exceeds maximum", async () => {
            let error;
            try {

                const testOptions: any = {primary: ZosFilesConstants.MAX_ALLOC_QUANTITY + 1};
                Create.dataSetValidateOptions(testOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(`Maximum allocation quantity of`);
        });

        it("should fail when secondary value exceeds maximum", async () => {
            let error;
            try {

                const testOptions: any = {secondary: ZosFilesConstants.MAX_ALLOC_QUANTITY + 1};
                Create.dataSetValidateOptions(testOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(`Maximum allocation quantity of`);
        });

        it("should fail if invalid option provided", async () => {
            let error;
            try {

                const testOptions: any = {madeup: "bad"};
                Create.dataSetValidateOptions(testOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(`Invalid zos-files create command option`);
        });
    });
});

describe("Create VSAM Data Set", () => {
    const dummySession: any = {};
    const dataSetName = "TESTING";
    const TEN: number = 10;
    const THIRTY: number = 30;
    let dsOptions: ICreateVsamOptions = {};

    // setting to local variable to avoid too long lines.
    const primary: number = CreateDefaults.VSAM.primary;
    const secondary: number = CreateDefaults.VSAM.primary / TEN; // secondary is 10% of primary

    let mySpy: any;

    beforeEach(() => {
        mySpy = jest.spyOn(Invoke, "ams").mockReturnValue("");
        dsOptions = {};
    });

    afterEach(() => {
        mySpy.mockReset();
        mySpy.mockRestore();
    });

    describe("Success scenarios", () => {

        it("should be able to create a VSAM data set with default values", async () => {

            const expectedCommand: string[] =
                [`DEFINE CLUSTER -\n(NAME('${dataSetName}') -\n${CreateDefaults.VSAM.dsorg} -\nKB(${primary} ${secondary}) -\n)`];

            const response = await Create.vsam(dummySession, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, expectedCommand);
        });

        it("should be able to create a VSAM data set with dsorg of NUMBERED", async () => {

            const expectedCommand: string[] =
                [`DEFINE CLUSTER -\n(NAME('${dataSetName}') -\nNUMBERED -\nKB(${primary} ${secondary}) -\n)`];

            dsOptions.dsorg = "NUMBERED";

            const response = await Create.vsam(dummySession, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, expectedCommand);
        });

        it("should be able to create a VSAM data set with retention for 10 days", async () => {

            const expectedCommand: string[] =
                [`DEFINE CLUSTER -\n(NAME('${dataSetName}') -\nINDEXED -\nKB(${primary} ${secondary}) -\nFOR(${TEN}) -\n)`];

            dsOptions.retainFor = TEN;

            const response = await Create.vsam(dummySession, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, expectedCommand);
        });

        it("should be able to create a VSAM data set and over-ride multiple options", async () => {

            const expectedCommand: string[] =
                [`DEFINE CLUSTER -\n(NAME('${dataSetName}') -\nNONINDEXED -\nCYL(${THIRTY} ${TEN}) -\nFOR(${TEN}) -\nVOLUMES(STG100, STG101) -\n)`];

            dsOptions.dsorg = "NONINDEXED";
            dsOptions.retainFor = TEN;
            dsOptions.alcunit = "CYL";
            dsOptions.primary = THIRTY;
            dsOptions.secondary = TEN;
            dsOptions.volumes = "STG100, STG101";

            const response = await Create.vsam(dummySession, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, expectedCommand);
        });

        it("should be able to create a VSAM data set with storeclass, mgntclass and dataclass provided",async () => {

            const expectedCommand: string[] =
                [`DEFINE CLUSTER -\n(NAME('${dataSetName}') -\nINDEXED -\nKB(${primary} ${secondary}) -\nVOLUMES(STG100) -` +
                `\nSTORAGECLASS(STORE) -\nMANAGEMENTCLASS(MANAGEMENT) -\nDATACLASS(DATA) -\n)`];

            dsOptions.storeclass = "STORE";
            dsOptions.mgntclass = "MANAGEMENT";
            dsOptions.dataclass = "DATA";
            dsOptions.volumes = "STG100";

            const response = await Create.vsam(dummySession, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, expectedCommand);
        });

        it("should be able to create a VSAM data set with retention to a specific date",async () => {

            const expectedCommand: string[] =
                [`DEFINE CLUSTER -\n(NAME('${dataSetName}') -\nINDEXED -\nKB(${primary} ${secondary}) -\nTO(2019001) -` +
                `\nVOLUMES(STG100) -\n)`];

            dsOptions.retainTo = "2019001";
            dsOptions.volumes = "STG100";

            const response = await Create.vsam(dummySession, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, expectedCommand);
        });

        it("should be able to create a VSAM data set while printing (or not) the attributes",async () => {

            const expectedCommand: string[] =
                [`DEFINE CLUSTER -\n(NAME('${dataSetName}') -\nINDEXED -\nKB(${primary} ${secondary}) -` +
                `\nVOLUMES(STG100) -\n)`];

            dsOptions.showAttributes = true;
            dsOptions.volumes = "STG100";

            const response = await Create.vsam(dummySession, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, expectedCommand);
        });

        it("should be able to create a VSAM data set with a given size and print attributes false",async () => {

            const expectedCommand: string[] =
                [`DEFINE CLUSTER -\n(NAME('${dataSetName}') -\nINDEXED -\nTRK(30 3) -` +
                `\nVOLUMES(STG100) -\n)`];

            dsOptions.primary = THIRTY;
            dsOptions.showAttributes = false;
            dsOptions.alcunit = "TRK";
            dsOptions.volumes = "STG100";

            const response = await Create.vsam(dummySession, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, expectedCommand);
        });

        it("should be able to create a VSAM data set using --size",async () => {

            const expectedCommand: string[] =
                [`DEFINE CLUSTER -\n(NAME('${dataSetName}') -\nINDEXED -\nTRK(30 3) -` +
                `\nVOLUMES(STG100) -\n)`];

            (dsOptions as any).size = THIRTY + "TRK";
            dsOptions.volumes = "STG100";

            const response = await Create.vsam(dummySession, dataSetName, dsOptions);

            expect(response.success).toBe(true);
            expect(response.commandResponse).toContain("created successfully");
            expect(mySpy).toHaveBeenCalledWith(dummySession, expectedCommand);
        });
    });

    describe("Expected failures", () => {

        it("should fail if data set name is not provided", async () => {

            const dataSetNameLocal: string = undefined;

            let error;
            try {
                await Create.vsam(dummySession, dataSetNameLocal, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(ZosFilesMessages.missingDatasetName.message);
            expect(mySpy).not.toHaveBeenCalled();
        });

        it("should fail if passed an invalid 'alcunit'", async () => {

            dsOptions.alcunit = "MBCYL";

            let error;
            try {
                await Create.vsam(dummySession, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(ZosFilesMessages.invalidAlcunitOption.message + dsOptions.alcunit);
            expect(mySpy).not.toHaveBeenCalled();
        });

        it("should fail if passed an invalid 'dsorg'", async () => {

            dsOptions.dsorg = "INVALID";

            let error;
            try {
                await Create.vsam(dummySession, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(ZosFilesMessages.invalidDsorgOption.message + dsOptions.dsorg);
            expect(mySpy).not.toHaveBeenCalled();
        });

        it("should fail if 'primary' exceeds maximum", async () => {

            dsOptions.primary = ZosFilesConstants.MAX_ALLOC_QUANTITY + 1;

            let error;
            try {
                await Create.vsam(dummySession, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(ZosFilesMessages.maximumAllocationQuantityExceeded.message +
                " for 'primary' with value = " + dsOptions.primary + ".");
            expect(mySpy).not.toHaveBeenCalled();
        });

        it("should fail if 'secondary' exceeds maximum", async () => {

            dsOptions.secondary = ZosFilesConstants.MAX_ALLOC_QUANTITY + 1;

            let error;
            try {
                await Create.vsam(dummySession, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(ZosFilesMessages.maximumAllocationQuantityExceeded.message +
                " for 'secondary' with value = " + dsOptions.secondary + ".");
            expect(mySpy).not.toHaveBeenCalled();
        });

        it("should fail if 'retain-for' exceeds maximum", async () => {

            dsOptions.retainFor = ZosFilesConstants.MAX_RETAIN_DAYS + 1;

            let error;
            try {
                await Create.vsam(dummySession, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(TextUtils.formatMessage(ZosFilesMessages.valueOutOfBounds.message, {
                optionName: "retainFor",
                value: dsOptions.retainFor,
                minValue: ZosFilesConstants.MIN_RETAIN_DAYS,
                maxValue: ZosFilesConstants.MAX_RETAIN_DAYS}));
            expect(mySpy).not.toHaveBeenCalled();
        });

        it("should fail if 'retain-for' exceeds minimum", async () => {

            dsOptions.retainFor = ZosFilesConstants.MIN_RETAIN_DAYS - 1;

            let error;
            try {
                await Create.vsam(dummySession, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(TextUtils.formatMessage(ZosFilesMessages.valueOutOfBounds.message, {
                optionName: "retainFor",
                value: dsOptions.retainFor,
                minValue: ZosFilesConstants.MIN_RETAIN_DAYS,
                maxValue: ZosFilesConstants.MAX_RETAIN_DAYS}));
            expect(mySpy).not.toHaveBeenCalled();
        });

        it("should fail if passed an invalid option", async () => {

            (dsOptions as any).retainFor1 = ZosFilesConstants.MIN_RETAIN_DAYS;

            let error;
            try {
                await Create.vsam(dummySession, dataSetName, dsOptions);
            } catch (err) {
                error = err.message;
            }

            expect(error).toContain(TextUtils.formatMessage(ZosFilesMessages.invalidFilesCreateOption.message));
            expect(mySpy).not.toHaveBeenCalled();
        });
    });
});

describe("Create ZFS", () => {
    const dummySession: any = {};
    const fileSystemName = "TEST.ZFS";

    it("should succeed with correct parameters", async () => {
        (ZosmfRestClient as any).postExpectString = jest.fn(() => {
            // Do nothing
        });
        const options = {
            perms: 755,
            cylsPri: 100,
            cylsSec: 10,
            timeout: 20
        };
        await Create.zfs(dummySession, fileSystemName, options);
    });

    it("should fail if perms parameter omitted", async () => {
        let caughtError;
        (ZosmfRestClient as any).postExpectString = jest.fn(() => {
            // Do nothing
        });
        const options = {
            cylsPri: 100,
            cylsSec: 10,
            timeout: 20
        };

        try {
            await Create.zfs(dummySession, fileSystemName, options);
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain(ZosFilesMessages.missingZfsOption.message);
        expect(caughtError.message).toContain("perms");
    });

    it("should fail if cylsPri parameter omitted", async () => {
        let caughtError;
        (ZosmfRestClient as any).postExpectString = jest.fn(() => {
            // Do nothing
        });
        const options = {
            perms: 755,
            cylsSec: 10,
            timeout: 20
        };

        try {
            await Create.zfs(dummySession, fileSystemName, options);
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain(ZosFilesMessages.missingZfsOption.message);
        expect(caughtError.message).toContain("cyls-pri");
    });

    it("should fail if cylsSec parameter omitted", async () => {
        let caughtError;
        (ZosmfRestClient as any).postExpectString = jest.fn(() => {
            // Do nothing
        });
        const options = {
            perms: 755,
            cylsPri: 100,
            timeout: 20
        };

        try {
            await Create.zfs(dummySession, fileSystemName, options);
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain(ZosFilesMessages.missingZfsOption.message);
        expect(caughtError.message).toContain("cyls-sec");
    });

    it("should fail if timeout parameter omitted", async () => {
        let caughtError;
        (ZosmfRestClient as any).postExpectString = jest.fn(() => {
            // Do nothing
        });
        const options = {
            perms: 755,
            cylsPri: 100,
            cylsSec: 10
        };

        try {
            await Create.zfs(dummySession, fileSystemName, options);
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toContain(ZosFilesMessages.missingZfsOption.message);
        expect(caughtError.message).toContain("timeout");
    });

    it("should fail if REST client throws error", async () => {
        const error = new Error("This is a test");

        let caughtError;
        (ZosmfRestClient as any).postExpectString = jest.fn(() => {
            throw error;
        });
        const options = {
            perms: 755,
            cylsPri: 100,
            cylsSec: 10,
            timeout: 20
        };

        try {
            await Create.zfs(dummySession, fileSystemName, options);
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError).toBe(error);
    });
});
