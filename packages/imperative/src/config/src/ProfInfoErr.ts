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

// for imperative operations
import { IProfInfoErrParms } from "./doc/IProfInfoErrParms";
import { ImperativeError, IImperativeError } from "../../error";

/**
 * This class is the error exception mechanism for the ProfileInfo API.
 * It is derived from ImperativeError. We use a separate class so that
 * our consumer can check the type of error, and then rely on errorCode
 * values that are unique to ProfInfoErr. ProfInfoErr will always
 * populate the errorCode property. Our consumer can use the errorCode to
 * determine if it should process partial results.
 */
export class ProfInfoErr extends ImperativeError {

    // _______________________________________________________________________
    // The following are the complete set of errorCodes for ProfInfoErr.

    /**
     * Unable to retrieve the schema from a URL reference.
     * Currently, the ProfiInfo API does not attempt to retrieve a schema
     * through a URL. A URL does work to provide intellisense in VSCode
     * when editing a config file.
     */
    public static readonly CANT_GET_SCHEMA_URL: string = "CantGetSchemaUrl";

    /**
     * The specified type of profile location is invalid for the requested operation.
     */
    public static readonly INVALID_PROF_LOC_TYPE: string = "InvalidProfLocType";

    /**
     * Failed to initialize ProfileCredentials and load the credential manager.
     */
    public static readonly LOAD_CRED_MGR_FAILED: string = "LoadCredMgrFailed";

    /**
     * Failed to load the schema for a specified type of profile.
     */
    public static readonly LOAD_SCHEMA_FAILED: string = "LoadSchemaFailed";

    /**
     * A required profile property was not assigned a value.
     */
    public static readonly MISSING_REQ_PROP: string = "MissingProp";

    /**
     * The ProfileInfo.readProfilesFromDisk function was not called before
     * a function which requires that prerequisite.
     */
    public static readonly MUST_READ_FROM_DISK: string = "MustReadFromDisk";

    /**
     * A specified property that is expected to exist in a specified profile
     * does not exist in that profile.
     */
    public static readonly PROP_NOT_IN_PROFILE: string = "PropNotInProfile";

    /**
     * A specified property that is expected to exist in a specified profile
     * does not have OS and JSON locations defined.
     */
    public static readonly UNKNOWN_PROP_LOCATION: string = "UnknownPropLocation";

    /**
     * A specified profile was not found (V1)
     */
    public static readonly PROF_NOT_FOUND: string = "ProfileNotFound";

    // _______________________________________________________________________

    /**
     * Construct the ProfInfoErr error object. It adds properties in
     * IProfInfoErrParms to the existing properties of ImperativeError.
     *
     * @param impErrDetails
     *        ImperativeError details and text (stack, messages, etc.)
     *
     * @param profErrParms
     *        ProfInfoErr parms and ImperativeError control parameters.
     */
    constructor(
        impErrDetails: IImperativeError,
        profErrParms?: IProfInfoErrParms
    ) {
        super(impErrDetails, profErrParms);
        this.name = "ProfInfoErr";

        // make a shallow copy of the itemsInError array
        if (profErrParms) {
            this.mItemsInError = [...profErrParms.itemsInError];
        }
    }

    /**
     * Additional error properties, specific to ProfInfoErr.
     */
    private mItemsInError: string[] = [];

    public get itemsInError(): string[] {
        return this.mItemsInError;
    }
}
