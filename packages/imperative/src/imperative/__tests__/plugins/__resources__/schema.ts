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

import { IProfileTypeConfiguration } from "../../../..";

const mockSchema: IProfileTypeConfiguration = {
    type: "test-type",
    schema: {
        title: "test-type",
        description: "A test type profile",
        type: "object",
        required: [],
        properties: {
            host: {
                type: "string",
                secure: false
            }
        }
    }
};

export default mockSchema;