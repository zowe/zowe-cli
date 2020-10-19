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
const os = jest.genMockFromModule("os") as any;
const realOs = require.requireActual("os");

let osProperties = Object.create(null);
function __setValues(properties: { [key: string]: string }) {
    osProperties = Object.create(null);
    // tslint:disable-next-line forin
    for (const prop in properties) {
        osProperties[prop] = properties[prop];
    }
}

function homedir() {
    return osProperties.homedir;
}

os.__setValues = __setValues;
os.homedir = homedir;
os.release = realOs.release;

module.exports = os;
