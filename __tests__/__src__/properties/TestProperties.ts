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

import { ITestSystemSchema } from "./ITestSystemSchema";
import { ITestPropertiesSchema } from "./ITestPropertiesSchema";
import { isNullOrUndefined } from "util";
import { Logger } from "@zowe/imperative";

export class TestProperties {

    private testProperties: ITestPropertiesSchema;
    private log: Logger = Logger.getLoggerCategory("test");

    constructor(testProps: ITestPropertiesSchema) {
        this.testProperties = testProps;
    }

    /**
     * Get the default system information
     *
     * @returns {ITestSystemSchema}
     */
    public getDefaultSystem(): ITestSystemSchema {
        if (!isNullOrUndefined(this.testProperties.systems.primary)) {
            const system: ITestSystemSchema = this.findSystemWithNameInProperties(this.testProperties.systems.primary);
            if (!isNullOrUndefined(system)) {
                return {
                    ...system,
                    ...this.testProperties.systems.common
                };
            }
            else {
                this.log.warn("No system found for the given primary system specified. Returning the common system config.");
            }
        }
        return{
            name: "common_default",
            ...this.testProperties.systems.common
        };
    }

    /**
     *  Get a list of system names configured in the loaded properties file. You can use the system names to load
     *  the property object for any given system by calling {@getSystemProperties}.
     *
     *  @returns { string [] }
     */
    public getSystemsNamesList(): string [] {
        const systemList: string[] = [];
        this.testProperties.systems.specific.forEach((system: ITestSystemSchema) => {
            systemList.push(system.name);
        });
        return systemList;
    }

    /**
     * Get the fully qualified properties for a system name
     *
     * @param {string} systemName - the system name to load
     *
     * @returns { ITestSystemSchema } - null if system invalid
     */
    public getSystemProperties(systemName: string): ITestSystemSchema {
        const system: ITestSystemSchema = this.findSystemWithNameInProperties(systemName);
        if (!isNullOrUndefined(system)) {
            return {
                ...system,
                ...this.testProperties.systems.common
            };
        }
        // TODO: Should this be a hard error instead of a soft one?
        this.log.error("No system by the name of " + systemName + " could be found in the loaded properties.");
        return null;
    }

    private findSystemWithNameInProperties(sysName: string): ITestSystemSchema {
        return this.testProperties.systems.specific.find((sys) => {
            return sys.name === sysName;
        });
    }
}
