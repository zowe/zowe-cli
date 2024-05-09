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

import { AbstractCredentialManager } from "../abstract/AbstractCredentialManager";

// Generate the mock
const DefaultCredentialManager: any =
    (jest.genMockFromModule("../DefaultCredentialManager") as any).DefaultCredentialManager;

// Preserve inheritance
DefaultCredentialManager.prototype = new (AbstractCredentialManager as any)("dummy", "dummy manager");

exports.DefaultCredentialManager = DefaultCredentialManager;
