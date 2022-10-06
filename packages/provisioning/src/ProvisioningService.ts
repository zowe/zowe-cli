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

import * as fs from "fs";
import * as readYaml from "js-yaml";
import { ImperativeError } from "@zowe/imperative";
import { IPropertiesInput, IProvisionOptionals } from "./";

/**
 * Service class which helps to filter or edit input parameters.
 * @export
 * @class ProvisioningService
 */
export class ProvisioningService {

    /**
     * Parsers text with properties in key1=val1,key2=val2 format and returns IInputProperty[]
     * @param {string} propertiesText - required runtime property objects passed as a string.
     * @returns {IPropertiesInput[]} array of properties, @see {IPropertiesInput}
     * @memberof ProvisioningService
     */
    public static parseProperties(propertiesText: string): IPropertiesInput[] {
        if (propertiesText === "") {
            return [];
        }
        return propertiesText.split(",").map((property) => {
            const tempArray = property.split("=");
            if (tempArray.length === 2 && tempArray[0].length > 0) {
                return {name: tempArray[0].trim(), value: tempArray[1].trim()};
            } else {
                throw new ImperativeError({msg: `Incorrect properties format: ${propertiesText}`});
            }
        });
    }

    /**
     * Reads a YAML file with properties, parses it in key1=val1,key2=val2 format and returns IInputProperty[].
     * @param {string} path - path of the file.
     * @returns {IPropertiesInput[]} array of properties, @see {IPropertiesInput}
     * @memberof ProvisioningService
     */
    public static readPropertiesFromYamlFile(path: string): IPropertiesInput[] {
        const props = readYaml.load(fs.readFileSync(path, "utf8"));
        const propsArrayObj: IPropertiesInput[] = [];

        if (typeof props !== "object") {
            return [];
        }
        for (const key in props) {
            if (Object.prototype.hasOwnProperty.call(props, key)) {
                propsArrayObj.push({name: key, value: (props as any)[key]});
            }
        }
        return propsArrayObj;
    }

    /**
     * Helper method which checks if optional parameters were passed or not.
     * @param {string} properties - required runtime property objects.
     * @param {string} propertiesFile - path of the properties yaml file.
     * @param {string} domainName - name of the domain.
     * @param {string} tenantName - name of the tenant.
     * @param {string} userDataId - ID for the user data specified with user-data.
     * @param {string} userData - user data that is passed into the software services registry.
     * @param {string} accountInfo - account information to use in the JCL JOB statement.
     * @param {string[]} systemNickNames - nicknames of the systems upon which to provision a template.
     * @returns {IProvisionOptionals} object with optional properties, @see {IProvisionOptionals}
     * @memberof ProvisioningService
     */
    public static checkForPassedOptionalParms(properties?: string,
        propertiesFile?: string,
        domainName?: string,
        tenantName?: string,
        userDataId?: string,
        userData?: string,
        accountInfo?: string,
        systemNickNames?: string[]): IProvisionOptionals {

        const optionalItems: IProvisionOptionals = {
            "input-variables": null,
            "domain-name": null,
            "tenant-name": null,
            "user-data-id": null,
            "account-info": null,
            "user-data": null,
            "systems-nicknames": null
        };

        if (properties) {
            optionalItems["input-variables"] = ProvisioningService.parseProperties(properties);
        }
        if (propertiesFile) {
            optionalItems["input-variables"] = ProvisioningService.readPropertiesFromYamlFile(propertiesFile);
        }
        if (domainName) {
            optionalItems["domain-name"] = domainName;
        }
        if (tenantName) {
            optionalItems["tenant-name"] = tenantName;
        }
        if (accountInfo) {
            optionalItems["account-info"] = accountInfo;
        }
        if (userDataId) {
            optionalItems["user-data-id"] = userDataId;
        }
        if (userData) {
            optionalItems["user-data"] = userData;
        }
        if (systemNickNames) {
            optionalItems["systems-nicknames"] = systemNickNames;
        }
        return optionalItems;
    }
}
