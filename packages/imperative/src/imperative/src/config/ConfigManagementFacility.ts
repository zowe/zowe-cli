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

import { UpdateImpConfig } from "../UpdateImpConfig";
import { Logger } from "../../../logger";

/**
 * This class is the main engine for the Config Management Facility. The
 * underlying class should be treated as a singleton and should be accessed
 * via ConfigManagementFacility.instance.
 */
export class ConfigManagementFacility {
    /**
     * This is the variable that stores the specific instance of the CMF. Defined
     * as static so that it can be accessed from anywhere.
     *
     * @private
     * @type {ConfigManagementFacility}
     */
    private static mInstance: ConfigManagementFacility;

    /**
     * Used for internal imperative logging.
     *
     * @private
     * @type {Logger}
     */
    private impLogger: Logger = Logger.getImperativeLogger();

    /**
     * Gets a single instance of the CMF. On the first call of
     * ConfigManagementFacility.instance, a new CMF is initialized and returned.
     * Every subsequent call will use the one that was first created.
     *
     * @returns {ConfigManagementFacility} - The newly initialized CMF object.
     */
    public static get instance(): ConfigManagementFacility {
        if (this.mInstance == null) {
            this.mInstance = new ConfigManagementFacility();
        }

        return this.mInstance;
    }

    /**
     * Initialize the CMF. Must be called to enable the various commands provided
     * by the facility.
     */
    public init(): void {

        this.impLogger.debug("ConfigManagementFacility.init() - Start");

        // Add the config group and related commands.
        UpdateImpConfig.addCmdGrp({
            name: "config",
            type: "group",
            summary: "Manage configuration and overrides",
            description: "Manage configuration and overrides. To see all set-able options use \"list\" command.",
            children: [
                // require("./cmd/get/get.definition").getDefinition,
                require("./cmd/set/set.definition").setDefinition,
                require("./cmd/reset/reset.definition").resetDefinition,
                require("./cmd/list/list.definition").listDefinition,
                require("./cmd/get/get.definition").getDefinition,
            ]
        });

        this.impLogger.debug("ConfigManagementFacility.init() - Success");
    }
}
