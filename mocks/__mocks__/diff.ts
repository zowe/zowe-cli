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

const diff = jest.genMockFromModule("diff") as any;
const originalCreateTwoFilesPatch = jest.requireActual("diff").createTwoFilesPatch;
const mockedCreateTwoFilesPatch = diff.createTwoFilesPatch;

function createTwoFilesPatch(fileA: string, fileB: string, str1: string, str2: string) {
    if (str1.indexOf("random") >= 0 || str2.indexOf("random") >= 0 ) {
        return originalCreateTwoFilesPatch(fileA, fileB, str1, str2);
    }
    return mockedCreateTwoFilesPatch(fileA, fileB, str1, str2);
}

diff.createTwoFilesPatch = createTwoFilesPatch;

module.exports = diff;
