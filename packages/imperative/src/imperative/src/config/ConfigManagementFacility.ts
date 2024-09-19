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
import { listDefinition } from "./cmd/list/list.definition";
import { initDefinition } from "./cmd/init/init.definition";
import { schemaDefinition } from "./cmd/schema/schema.definition";
import { profilesDefinition } from "./cmd/profiles/profiles.definition";
import { secureDefinition } from "./cmd/secure/secure.definition";
import { setDefinition } from "./cmd/set/set.definition";
import { editDefinition } from "./cmd/edit/edit.definition";
import { importDefinition } from "./cmd/import/import.definition";
import { convertProfilesDefinition } from "./cmd/convert-profiles/convert-profiles.definition";
import { ReportEnvDefinition } from "./cmd/report-env/Report-env.definition";
import { updateSchemasDefinition } from "./cmd/update-schemas/update-schemas.definition";

export class ConfigManagementFacility {
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
            summary: "Manage JSON project and global configuration",
            description: "Manage JSON project and global configuration.",
            children: [
                listDefinition,
                secureDefinition,
                setDefinition,
                initDefinition,
                schemaDefinition,
                profilesDefinition,
                editDefinition,
                importDefinition,
                convertProfilesDefinition,
                ReportEnvDefinition,
                updateSchemasDefinition
            ]
        });

        this.impLogger.debug("ConfigManagementFacility.init() - Success");
    }
}
