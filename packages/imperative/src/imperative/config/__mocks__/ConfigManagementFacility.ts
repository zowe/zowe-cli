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

const ConfigManagementFacility: any =
    (jest.genMockFromModule("../ConfigManagementFacility") as any).ConfigManagementFacility;

ConfigManagementFacility.instance = new ConfigManagementFacility();

exports.ConfigManagementFacility = ConfigManagementFacility;
