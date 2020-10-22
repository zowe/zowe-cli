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

import * as Path from "path";
import { Imperative, ImperativeError } from "@zowe/imperative";
import { IPropertiesInput, ProvisioningService, IProvisionOptionals } from "../../src";


const domainName: string = "domain_name1";
const tenantName: string = "tenant_name1";
const inputProperties: string = "name=CSQ_MQ,value=ABCD";
const badInputFormat: string = "name:CSQ_MQ. value: ABCD";
const testFileName: string = "provisioning_prompt_variables.yml";
const emptyTestFileName: string = "empty.yml";
const propertiesFilePath: string = Path.resolve(__dirname + "../../../../../__tests__/__resources__/provisioning/" + testFileName);
const emptyPropertiesFilePath: string = Path.resolve(__dirname + "../../../../../__tests__/__resources__/provisioning/" + emptyTestFileName);
const parsedArrayOfObjects: IPropertiesInput[] = [{name: "name", value: "CSQ_MQ"}, {name: "value", value: "ABCD"}];
const readFromFileProperties: IPropertiesInput[] = [{name: "key1", value: "val1"}, {name: "key2", value: "val2"}, {name: "key3", value: "val3"}];

describe("ProvisionService", () => {

    it("parseProperties should parse the string and return an array of objects", () => {
        let parsedObject: IPropertiesInput[];
        let error: ImperativeError;
        try {
            parsedObject = ProvisioningService.parseProperties(inputProperties);
            Imperative.console.info(`Response ${parsedObject}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect(error).not.toBeDefined();
        expect(parsedObject).toBeDefined();
        expect(parsedObject).toEqual(parsedArrayOfObjects);
    });

    it("parseProperties should throw an error if the format of the passed text is bad", () => {
        let parsedObject: IPropertiesInput[];
        let error: ImperativeError;
        try {
            parsedObject = ProvisioningService.parseProperties(badInputFormat);
            Imperative.console.info(`Response ${parsedObject}`);
        } catch (thrownError) {
            error = thrownError;
            Imperative.console.info(`Error ${error}`);
        }
        expect(error).toBeDefined();
        expect(parsedObject).not.toBeDefined();
        expect(error.message).toEqual(`Incorrect properties format: ${badInputFormat}`);
    });

    it("readPropertiesFromYamlFile should read from yaml file, parse and return a parsed array of objects", () => {
        const parsedObject: IPropertiesInput[] = ProvisioningService.readPropertiesFromYamlFile(propertiesFilePath);
        Imperative.console.info(`Response ${parsedObject}`);

        expect(parsedObject).toBeDefined();
        expect(parsedObject).toEqual(readFromFileProperties);
    });

    it("readPropertiesFromYamlFile should read from empty yaml file, parse and return an empty array", () => {
        const parsedObject: IPropertiesInput[] = ProvisioningService.readPropertiesFromYamlFile(emptyPropertiesFilePath);
        Imperative.console.info(`Response ${parsedObject}`);

        expect(parsedObject).toBeDefined();
        expect(parsedObject).toEqual([]);
    });

    it("checkForPassedOptionalParms should parse passed optional parameters and return a parsed object", () => {
        const parsedObject: IProvisionOptionals = ProvisioningService.checkForPassedOptionalParms(inputProperties, null, domainName, tenantName);
        Imperative.console.info(`Response ${parsedObject}`);

        expect(parsedObject).toBeDefined();
        expect(parsedObject["input-variables"]).toEqual(parsedArrayOfObjects);
        expect(parsedObject["domain-name"]).toEqual(domainName);
        expect(parsedObject["tenant-name"]).toEqual(tenantName);
        expect(parsedObject["systems-nicknames"]).toBeNull();
    });

    it("checkForPassedOptionalParms should return an object with null properties if no parameters were supplied", () => {
        const parsedObject: IProvisionOptionals = ProvisioningService.checkForPassedOptionalParms();
        Imperative.console.info(`Response ${parsedObject}`);

        expect(parsedObject).toBeDefined();
        expect(parsedObject["input-variables"]).toBeNull();
        expect(parsedObject["domain-name"]).toBeNull();
        expect(parsedObject["tenant-name"]).toBeNull();
        expect(parsedObject["systems-nicknames"]).toBeNull();
    });
});
